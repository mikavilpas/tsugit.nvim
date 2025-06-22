local M = {}

---@param args string[] | nil # arguments to pass to lazygit
---@param options tsugit.CallOptions
---@param cwd_absolute string
---@param on_buf fun(buf: number)
---@return snacks.terminal, boolean
function M.maybe_create_lazygit(args, options, cwd_absolute, on_buf)
  local terminal = require("snacks.terminal")
  ---@type snacks.terminal.Opts
  local default_opts = {
    cwd = cwd_absolute,
    win = {
      backdrop = false,
      relative = "editor",
      border = "none",
      width = 0.95,
      height = 0.97,
      style = "minimal",
      on_buf = function(self)
        on_buf(self.buf)
      end,
    },
  }

  local cmd = vim.list_extend({ "lazygit" }, args or {})
  local lazygit, created = terminal.get(
    cmd,
    vim.tbl_deep_extend(
      "force",
      default_opts,
      options.term_opts or {},
      { create = true }
    )
  )

  assert(lazygit, "tsugit.nvim: failed to create lazygit terminal")

  ---@cast lazygit snacks.terminal
  return lazygit, created or false
end

return M
