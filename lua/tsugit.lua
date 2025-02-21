local M = {}

---@class(exact) tsugit.UserConfig
---@field keys? tsugit.Keys | false # key mappings that are active when lazygit is open. They are completely unusable by lazygit, so set the to rare keys.

---@class(exact) tsugit.Config # the internal configuration for tsugit. Use tsugit.UserConfig for your personal configuration.
---@field keys tsugit.Keys | false

---@class(exact) tsugit.Keys
---@field toggle? string | false # toggle lazygit on/off without closing it
---@field force_quit? string | false # force quit lazygit (e.g. when it's stuck)

M.last_lazygits = vim.ringbuf(5)

M.version = "1.0.0" -- x-release-please-version

---@type tsugit.Config
M.config = {
  keys = {
    toggle = "<right>",
    force_quit = "<c-c>",
  },
}

---@param config tsugit.Config | {}
M.setup = function(config)
  require("flatten").setup(
    ---@diagnostic disable-next-line: missing-fields
    {
      window = {
        open = "alternate",
      },
    }
  )

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
        for _, lg in ipairs(M.last_lazygits) do
          ---@cast lg snacks.win
          if lg:valid() or lg:buf_valid() then
            lg:hide()
          end
        end

        -- tsugit has not been opened yet
        M.toggle()
      end)
    end,
  })
end

---@class tsugit.CallOptions
---@field config? tsugit.Config | {} # overrides to the default configuration, used for this call only
---@field cwd? string # the path to open lazygit in
---@field term_opts? snacks.terminal.Opts # overrides to the snacks terminal
---@field tries_remaining? number # used internally to prevent infinite loops

-- open lazygit in the current git directory
---@module "snacks.terminal"
---@param args? string[]
---@param options? tsugit.CallOptions
---@return snacks.win
function M.toggle(args, options)
  local cmd = vim.list_extend({ "lazygit" }, args or {})
  options = options or {}
  local config = vim.tbl_deep_extend("force", M.config, options.config or {})
  assert(config.keys.toggle, "tsugit.nvim: missing the toggle key")

  local cwd = options.cwd
    or vim.fn.fnameescape(require("snacks.git").get_root() or vim.fn.getcwd())
  local terminal = require("snacks.terminal")
  ---@type snacks.terminal.Opts
  local default_opts = {
    cwd = cwd,
    win = {
      backdrop = false,
      relative = "editor",
      border = "none",
      width = 0.95,
      height = 0.97,
      style = "minimal",
    },
  }

  -- sometimes when editing a commit message, the terminal is left open. In
  -- this case, toggling tsugit should close the terminal so that only one can
  -- be open at a time.
  for _, lg in ipairs(M.last_lazygits) do
    ---@cast lg snacks.win
    if lg:valid() or lg:buf_valid() then
      lg:hide()
    end
  end

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
  vim.api.nvim_buf_set_var(lazygit.buf, "minicursorword_disable", true)
  lazygit:show()

  if created then
    vim.api.nvim_create_autocmd({ "BufEnter" }, {
      buffer = lazygit.buf,
      callback = function()
        -- Sometimes when a new buffer is opened behind tsugit, it is not
        -- automatically hidden. Force it to hide.
        lazygit:hide()
      end,
    })

    lazygit:on("TermClose", function()
      -- Prevent the "Process exited 0" message. It's displayed by default when
      -- the terminal application has exited.
      if vim.api.nvim_buf_is_valid(lazygit.buf) then
        vim.api.nvim_buf_delete(lazygit.buf, { force = true })
      end

      -- warm up the next instance
      local newLazyGit = M.toggle(args, {
        tries_remaining = (options.tries_remaining or 0) - 1,
        term_opts = {},
      })
      newLazyGit:hide()
    end)

    lazygit:on("WinLeave", function()
      lazygit:hide()
    end)
  end

  require("tsugit.keymaps").create_keymaps(config, lazygit)

  -- avoid copies for clarity, not a performance issue
  if not M.last_lazygits:peek() then
    M.last_lazygits:push(lazygit)
  elseif M.last_lazygits:peek().id ~= lazygit.id then
    -- selene: allow(if_same_then_else)
    M.last_lazygits:push(lazygit)
  end

  return lazygit
end

--- Open lazygit for the current file path
---@param path? string # the file path to open lazygit in. If not given, uses the current buffer's file path.
---@param options? tsugit.CallOptions | {}
function M.toggle_for_file(path, options)
  path = path or vim.fn.expand("%:p")
  if not path then
    -- might happen if the current buffer is not a file (rare)
    vim.notify("tsugit.nvim: No file path provided", vim.log.levels.ERROR)
    error("tsugit.nvim: No file path provided")
  end

  -- don't warm up the next lazygit for a single file path to save some resources
  options = options or {}
  options.tries_remaining = 999

  return M.toggle({ "--filter", path }, options)
end

return M
