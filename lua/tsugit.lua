---@module "plenary"

local M = {}

M.version = "1.0.0" -- x-release-please-version

M.setup = function() end

-- open lazygit in the current git directory
---@module "snacks.terminal"
---@param args? string[]
---@param options? {retry_count?: number, term_opts?: snacks.terminal.Opts}
---@return snacks.win
function M.toggle(args, options)
  local cmd = vim.list_extend({ "lazygit" }, args or {})
  options = options or {}

  local cwd = vim.fn.fnameescape(vim.fs.root(0, ".git") or vim.fn.getcwd())
  local terminal = require("snacks.terminal")
  ---@type snacks.terminal.Opts
  local default_opts = {
    cwd = cwd,
    win = {
      backdrop = false,
      border = "none",
      width = 0.95,
      height = 0.97,
      style = "minimal",
    },
  }
  local lazygit = terminal.toggle(
    cmd,
    vim.tbl_deep_extend("force", default_opts, options.term_opts or {})
  )
  vim.api.nvim_buf_set_var(lazygit.buf, "minicursorword_disable", true)

  vim.api.nvim_create_autocmd({ "WinLeave" }, {
    buffer = lazygit.buf,
    once = true,
    callback = function()
      lazygit:hide()
      local tries_remaining = (options.retry_count or 0) < 2
      if not tries_remaining then
        vim.notify("Unable to warm up the next lazygit", vim.log.levels.INFO)
        return
      end

      if lazygit:buf_valid() then
        return -- nothing to do
      end

      vim.schedule(function()
        -- warm up the next instance
        local newLazyGit = M.toggle(args, {
          try_count = (options.retry_count or 0) + 1,
          term_opts = {},
        })
        newLazyGit:hide()
      end)
    end,
  })

  vim.keymap.set({ "t" }, "<right>", function()
    -- NOTE: this prevents using the key in lazygit, but is very performant
    lazygit:hide()
  end, { buffer = lazygit.buf })

  _G.lastLazyGit = lazygit
  return lazygit
end

return M
