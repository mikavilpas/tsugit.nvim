local M = {}

local function is_long_mode()
  -- we are in long mode if the commit subject is longer than 72 characters
  local first_line = vim.api.nvim_buf_get_lines(0, 0, 1, false)[1] or ""
  return #first_line > 72
end

local function is_trailer_line(line)
  -- git-interpret-trailers(1): Token ": " value, Token is [A-Za-z0-9-]+
  return line:match("^[A-Za-z][A-Za-z0-9%-]*:%s") ~= nil
end

-- Find the 1-based index of the first line of git's instructions block.
--
-- Strategy: anchor on the scissors line `<comment_char> ---- >8 ----` if it
-- exists (verbose mode), otherwise anchor on EOF. Then walk backward through
-- the contiguous block of `comment_char`- prefixed lines. Instructions start
-- on the line after the first non- comment line we hit.
--
-- This is robust against `comment_char` lines inside the commit body (e.g.
-- shell comments inside a ```sh fenced code block): those lines are separated
-- from the real instructions by non-comment content, so the walk-back stops
-- before reaching them. A naive "first `#` line from the top" scan would
-- misfire on such in-body `#` lines.
---@param lines string[]
---@param comment_char string
---@return number|nil
local function find_instructions_start(lines, comment_char)
  local scissors_pattern = "^" .. vim.pesc(comment_char) .. " %-+ >8 %-+$"
  local anchor = nil
  for i, line in ipairs(lines) do
    if line:match(scissors_pattern) then
      anchor = i
      break
    end
  end
  if anchor == nil then
    anchor = #lines
  end
  local i = anchor
  while i > 0 and vim.startswith(lines[i], comment_char) do
    i = i - 1
  end
  if i < anchor then
    return i + 1
  end
  return nil
end

local PRETTIER_IGNORE = "<!-- prettier-ignore -->"

-- Insert a <!-- prettier-ignore --> comment above every paragraph that is
-- entirely git trailers. Prettier treats the comment as a pragma and leaves
-- the paragraph that follows it untouched, so long URLs in trailers don't
-- get split across lines. After prettier runs, the markers are stripped
-- back out, leaving the trailers intact in their original positions.
--
-- This handles trailer blocks anywhere in the message — including the
-- middle, which happens when a commit is squashed from several smaller
-- commits, each of which had its own trailer.
---@param buf number
local function shield_trailer_blocks_from_prettier(buf)
  local lines = vim.api.nvim_buf_get_lines(buf, 0, -1, false)
  local new_lines = {}
  local i = 1
  local n = #lines
  while i <= n do
    if lines[i] == "" then
      table.insert(new_lines, "")
      i = i + 1
    else
      local para_start = i
      while i <= n and lines[i] ~= "" do
        i = i + 1
      end
      local para_end = i - 1

      local all_trailers = true
      for j = para_start, para_end do
        if not is_trailer_line(lines[j]) then
          all_trailers = false
          break
        end
      end

      if all_trailers then
        table.insert(new_lines, PRETTIER_IGNORE)
      end
      for j = para_start, para_end do
        table.insert(new_lines, lines[j])
      end
    end
  end

  vim.api.nvim_buf_set_lines(buf, 0, -1, true, new_lines)
end

---@param buf number
local function unshield_trailer_blocks(buf)
  -- Pattern is coupled to PRETTIER_IGNORE — update both if that constant
  -- ever changes. Deletes into the black-hole register (d _) so we don't
  -- clobber any register the user relied on.
  vim.api.nvim_buf_call(buf, function()
    vim.cmd([[silent! g/^<!-- prettier-ignore -->$/d _]])
  end)
end

-- Remove git's instructions block from the buffer and return those lines
-- so the caller can paste them back after formatting. Also returns the
-- total line count as it was before stripping, for debug logging.
-- See `find_instructions_start` for how the block boundary is detected.
---@param buf number
---@param comment_char string
---@return string[] instructions
---@return number total_line_count
local function extract_instructions(buf, comment_char)
  local lines = vim.api.nvim_buf_get_lines(buf, 0, -1, false)
  local instructions_start = find_instructions_start(lines, comment_char)
  if instructions_start ~= nil then
    local instructions = vim.list_slice(lines, instructions_start, #lines)
    vim.api.nvim_buf_set_lines(buf, instructions_start - 1, -1, true, {})
    return instructions, #lines
  end
  return {}, #lines
end

---@param config tsugit.Config
function M.setup_conform_prettierd_integration(config)
  local conform = require("conform")
  conform.setup({
    formatters = {
      tsugit_gitcommit = {
        command = "prettierd",
        args = {
          -- provide the filename to the formatter so that it picks the
          -- markdown language
          "commit.md",
          "--print-width=72",
          "--prose-wrap=always",
        },
      },
    },
  })

  if config.debug then
    require("tsugit.debug").add_debug_message(
      "tsugit: Configured conform with prettierd for git commit messages"
    )
  end

  vim.api.nvim_create_autocmd("BufEnter", {
    pattern = "COMMIT_EDITMSG",
    callback = function()
      if config.debug then
        require("tsugit.debug").add_debug_message(
          "tsugit: Entered git commit message buffer"
        )
      end

      if is_long_mode() then
        -- disable neovim hard wrapping for this buffer to prevent changing long
        -- commit subjects. git expects them to be a single line no matter how
        -- long it is.
        vim.opt_local.textwidth = 0
        vim.opt_local.wrapmargin = 0
        vim.opt_local.wrap = false
      end
    end,
  })

  vim.api.nvim_create_autocmd("BufWritePre", {
    pattern = "COMMIT_EDITMSG",
    callback = function(args)
      -- Format the commit message with prettierd, but don't format the
      -- instructions at the bottom because they are not markdown
      --
      -- conform supports hacky "aftermarket" range formatting which tries to
      -- format everything and only keep the range that was requested to be
      -- formatted.
      -- https://github.com/stevearc/conform.nvim/blob/master/doc/advanced_topics.md#range-formatting
      --
      -- However, prettier does not support range formatting properly, and
      -- together they don't do a good job.
      -- https://github.com/prettier/prettier/issues/7639
      --
      -- For this reason, we have a custom implementation that
      -- - keeps the commit message and removes the instructions at the bottom
      --   that are provided by git
      -- - formats the commit message with conform and prettierd
      -- - puts the instructions back at the bottom, so that it seems like only
      --   the commit message was formatted

      local buf = args.buf
      local comment_char = vim
        .system({ "git", "config", "--get", "core.commentChar" }, {
          cwd = vim.fs.dirname(vim.api.nvim_buf_get_name(buf)),
          text = true,
        })
        :wait(500).stdout
        :gsub("%s+", "")

      if comment_char == "" then
        comment_char = "#"
      end
      ---@cast comment_char string

      -- do not use long (subject) mode unless we have to avoid reformatting
      -- the subject, because:
      -- - the cursor can jump a round annoyingly
      -- - auto hard wrapping is disabled and it's annoying to type the commit
      --   message having to wrap manually
      if not is_long_mode() then
        M.format_comfy_mode(config, comment_char, buf)
      else
        M.format_long_mode(config, comment_char, buf)
      end

      -- selene: allow(global_usage)
      _G.tsugit_formatting_done = true
    end,
  })
end

---@param config tsugit.Config
---@param comment_char string
---@param buf number
M.format_comfy_mode = function(config, comment_char, buf)
  local instructions, total_line_count = extract_instructions(buf, comment_char)

  shield_trailer_blocks_from_prettier(buf)

  if config.debug then
    require("tsugit.debug").add_debug_message(
      string.format(
        "tsugit: Formatting %s commit message lines in comfy mode with conform using comment_char '%s'",
        total_line_count,
        vim.inspect(comment_char)
      )
    )
  end

  require("conform").format({
    bufnr = buf,
    formatters = { "tsugit_gitcommit" },
  })

  unshield_trailer_blocks(buf)

  -- put the commit instructions back
  if #instructions > 0 then
    vim.api.nvim_buf_set_lines(buf, -1, -1, false, { "" })
    vim.api.nvim_buf_set_lines(buf, -1, -1, false, instructions)
  end
end

M.format_long_mode = function(config, comment_char, buf)
  -- get the subject and the second line (the empty line)
  local heading_lines = vim.tbl_filter(function(value)
    return not vim.startswith(value, comment_char)
  end, vim.api.nvim_buf_get_lines(buf, 0, 2, false))
  if #heading_lines <= 1 then
    table.insert(heading_lines, "")
  end

  -- remove them from the buffer temporarily
  vim.api.nvim_buf_set_lines(buf, 0, #heading_lines - 1, true, {})

  local instructions, total_line_count = extract_instructions(buf, comment_char)

  shield_trailer_blocks_from_prettier(buf)

  if config.debug then
    require("tsugit.debug").add_debug_message(
      string.format(
        "tsugit: Formatting %s commit message lines in long mode with conform using comment_char '%s'",
        total_line_count,
        vim.inspect(comment_char)
      )
    )
  end

  require("conform").format({
    bufnr = buf,
    formatters = { "tsugit_gitcommit" },
  })

  unshield_trailer_blocks(buf)

  -- add the heading lines back to the beginning
  vim.api.nvim_buf_set_lines(buf, 0, 0, false, heading_lines)

  -- put the commit instructions back
  if #instructions > 0 then
    if heading_lines[#heading_lines] ~= "" then
      vim.api.nvim_buf_set_lines(buf, -1, -1, false, { "" })
    end
    vim.api.nvim_buf_set_lines(buf, -1, -1, false, instructions)
  end
end

return M
