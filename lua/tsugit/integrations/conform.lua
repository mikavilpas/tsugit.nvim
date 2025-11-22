local M = {}

local function is_long_mode()
  -- we are in long mode if the commit subject is longer than 72 characters
  local first_line = vim.api.nvim_buf_get_lines(0, 0, 1, false)[1] or ""
  return #first_line > 72
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

      -- do not use long mode unless we have to avoid reformatting the subject, because:
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
  -- get the lines before the first line starting with the comment_char
  local instructions = {}
  local lines = vim.api.nvim_buf_get_lines(buf, 0, -1, false)
  for i, line in ipairs(lines) do
    if vim.startswith(line, comment_char) then
      instructions = vim.list_slice(lines, i, #lines)
      vim.api.nvim_buf_set_lines(buf, i - 1, -1, true, {})
      break
    end
  end

  if config.debug then
    require("tsugit.debug").add_debug_message(
      string.format(
        "tsugit: Formatting %s commit message lines in comfy mode with conform using comment_char '%s'",
        #lines,
        vim.inspect(comment_char)
      )
    )
  end

  require("conform").format({
    bufnr = buf,
    formatters = { "tsugit_gitcommit" },
  })

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

  -- get the lines before the first line starting with the comment_char
  local instructions = {}
  local lines = vim.api.nvim_buf_get_lines(buf, 0, -1, false)
  for i, line in ipairs(lines) do
    if vim.startswith(line, comment_char) then
      instructions = vim.list_slice(lines, i, #lines)
      vim.api.nvim_buf_set_lines(buf, i - 1, -1, true, {})
      break
    end
  end

  if config.debug then
    require("tsugit.debug").add_debug_message(
      string.format(
        "tsugit: Formatting %s commit message lines in long mode with conform using comment_char '%s'",
        #lines,
        vim.inspect(comment_char)
      )
    )
  end

  require("conform").format({
    bufnr = buf,
    formatters = { "tsugit_gitcommit" },
  })

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
