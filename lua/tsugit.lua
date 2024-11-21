---@module "plenary"

local M = {}

---@class(exact) tsugit.Config
---@field keys tsugit.Keys

---@class(exact) tsugit.UserConfig
---@field keys? tsugit.Keys # key mappings that are active when lazygit is open. They are completely unusable by lazygit, so set the to rare keys.

---@class(exact) tsugit.Keys
---@field toggle? string # toggle lazygit on/off without closing it

---@class snacks.win | nil
local lastLazyGit = nil

M.version = "1.0.0" -- x-release-please-version

---@type tsugit.Config
M.config = {
  keys = {
    toggle = "<right>",
  },
}

---@param config tsugit.Config
M.setup = function(config)
  M.config = vim.tbl_deep_extend("force", M.config, config or {})
  vim.api.nvim_create_autocmd("BufDelete", {
    -- if the git COMMIT_EDITMSG file is closed, automatically display lazygit
    callback = function()
      local file_name = vim.fn.expand("<afile>")

      if not file_name:match("COMMIT_EDITMSG") then
        return
      end

      -- write to a backup file because sometimes lazygit fails to create a new
      -- commit, and the message can be lost
      local file_exists = vim.uv.fs_access(file_name, "RW")

      if not file_exists then
        -- should not happen
        vim.notify(
          string.format("File does not exist: %s", file_name),
          vim.log.levels.ERROR
        )
        return
      end

      local contents = vim.fn.readfile(file_name)

      local backup_file_path =
        vim.fs.joinpath(vim.fs.dirname(file_name), "COMMIT_EDITMSG.backup")
      local backup_file = io.open(backup_file_path, "w+")
      if not backup_file then
        vim.notify(
          string.format("Failed to open file: %s", backup_file_path),
          vim.log.levels.ERROR
        )
        return
      end
      backup_file:write(table.concat(contents, "\n"))
      backup_file:close()

      vim.schedule(function()
        if lastLazyGit then
          lastLazyGit:show()
        else
          M.toggle()
        end
      end)
    end,
  })
end

-- open lazygit in the current git directory
---@module "snacks.terminal"
---@param args? string[]
---@param options? {retry_count?: number, term_opts?: snacks.terminal.Opts, config?: tsugit.Config}
---@return snacks.win
function M.toggle(args, options)
  local cmd = vim.list_extend({ "lazygit" }, args or {})
  options = options or {}
  local config = vim.tbl_deep_extend("force", M.config, options.config or {})
  assert(config.keys.toggle, "tsugit.nvim: missing the toggle key")

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

  vim.keymap.set({ "t" }, config.keys.toggle, function()
    -- this prevents using the key in lazygit, but is very performant
    lazygit:hide()
  end, { buffer = lazygit.buf })

  lastLazyGit = lazygit
  return lazygit
end

--- Open lazygit for the current file path
---@param path string
---@param options? {retry_count?: number, term_opts?: snacks.terminal.Opts, config?: tsugit.Config}
function M.toggle_for_file(path, options)
  if not path then
    vim.notify("tsugit.nvim: No file path provided", vim.log.levels.ERROR)
    return
  end

  return M.toggle({ "--filter", path }, options)
end

return M
