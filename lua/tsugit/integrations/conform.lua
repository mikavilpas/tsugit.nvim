local M = {}

---@param config tsugit.Config
function M.setup_conform_prettierd_integration(config)
  local conform = require("conform")
  conform.setup({
    formatters = {
      tsugit_gitcommit = {
        command = "prettierd",
        inherit = false,
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

      -- disable neovim hard wrapping for this buffer to prevent changing long
      -- commit subjects. git expects them to be a single line no matter how
      -- long it is.
      vim.opt_local.textwidth = 0
      vim.opt_local.wrapmargin = 0
      vim.opt_local.wrap = false
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

      local comment_char = vim
        .system({ "git", "config", "--get", "core.commentChar" }, {
          cwd = vim.fs.dirname(vim.api.nvim_buf_get_name(args.buf)),
          text = true,
        })
        :wait(500).stdout
        :gsub("%s+", "")

      if comment_char == "" then
        comment_char = "#"
      end
      ---@cast comment_char string

      -- get the subject and the second line (the empty line)
      local heading_lines = vim.api.nvim_buf_get_lines(args.buf, 0, 2, false)
      assert(
        #heading_lines == 2,
        "Expected at least two lines in commit message buffer"
      )
      -- remove them from the buffer temporarily
      vim.api.nvim_buf_set_lines(args.buf, 0, 2, true, {})

      -- get the lines before the first line starting with the comment_char
      local instructions = {}
      local lines = vim.api.nvim_buf_get_lines(args.buf, 0, -1, false)
      for i, line in ipairs(lines) do
        if vim.startswith(line, comment_char) then
          instructions = vim.list_slice(lines, i, #lines)
          vim.api.nvim_buf_set_lines(args.buf, i - 1, -1, true, {})
          break
        end
      end

      if config.debug then
        require("tsugit.debug").add_debug_message(
          string.format(
            "tsugit: Formatting %s commit message lines with conform using comment_char '%s'",
            #lines,
            vim.inspect(comment_char)
          )
        )
      end

      require("conform").format({
        bufnr = args.buf,
        formatters = { "tsugit_gitcommit" },
      })

      -- add the heading lines back to the beginning
      vim.api.nvim_buf_set_lines(args.buf, 0, 0, false, heading_lines)

      -- put the commit instructions back
      if #instructions > 0 then
        vim.api.nvim_buf_set_lines(args.buf, -1, -1, false, { "" })
        vim.api.nvim_buf_set_lines(args.buf, -1, -1, false, instructions)
      end
    end,
  })
end

return M
