local M = {}

---@class(exact) tsugit.UserConfig
---@field keys? tsugit.Keys | false # key mappings that are active when lazygit is open. They are completely unusable by lazygit, so set the to rare keys.

---@class(exact) tsugit.Config # the internal configuration for tsugit. Use tsugit.UserConfig for your personal configuration.
---@field keys tsugit.Keys | false
---@field debug? boolean # whether to enable debug messages. Defaults to false.

---@class(exact) tsugit.Keys
---@field toggle? string | false # toggle lazygit on/off without closing it
---@field force_quit? string | false # force quit lazygit (e.g. when it's stuck)

--- issue: The snacks terminal seems to have some issue that causes duplicate
--- lazygits to be opened
---
--- solution: Provides a cache for the lazygits that are known to tsugit. We
--- can use this to detect if a lazygit has already been opened, and avoiding
--- opening a new one if it has. This essentially duplicates the snacks
--- terminal's cache.
---@type table<string, snacks.win>
M.lazygit_cache = {
  -- `v` means weak values, which allows garbage collecting them when they have
  -- no other references, see :help lua-weaktable
  --
  -- `k` is the same thing but for keys
  __mode = "kv",
}

M.last_lazygits = vim.ringbuf(5)

M.version = "1.0.0" -- x-release-please-version

---@type tsugit.Config
M.config = {
  keys = {
    toggle = "<right>",
    force_quit = "<c-c>",
  },
  debug = false,
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
---@return snacks.win | nil # the lazygit terminal window, or nil if it could not be opened
function M.toggle(args, options)
  options = options or {}

  if options.tries_remaining and options.tries_remaining < 0 then
    if M.config.debug then
      require("tsugit.debug").add_debug_message(
        "tsugit.nvim: too many tries to open lazygit, aborting"
      )
    end
    return nil
  end

  local config = vim.tbl_deep_extend("force", M.config, options.config or {})
  assert(config.keys.toggle, "tsugit.nvim: missing the toggle key")

  local absolute_cwd = options.cwd
    or vim.fn.fnamemodify(
      -- make it absolute
      vim.fn.fnameescape(require("snacks.git").get_root() or vim.fn.getcwd()),
      ":p"
    )

  local key = vim.inspect({ cwd = vim.inspect(absolute_cwd), args = args })

  local created = false
  local lazygit = M.lazygit_cache[key]
  if lazygit and not lazygit.closed then
    if M.config.debug then
      require("tsugit.debug").add_debug_message(
        "tsugit.nvim: using cached lazygit for cwd " .. absolute_cwd
      )
    end
  else
    if M.config.debug then
      require("tsugit.debug").add_debug_message(
        "tsugit.nvim: creating new lazygit for cwd " .. absolute_cwd
      )
    end
    -- if lazygit is not cached, create it
    lazygit, created =
      require("tsugit.snacks").maybe_create_lazygit(args, options, absolute_cwd)
  end

  -- sometimes when editing a commit message, the terminal is left open. In
  -- this case, toggling tsugit should close the terminal so that only one can
  -- be open at a time.
  for _, lg in ipairs(M.last_lazygits) do
    ---@cast lg snacks.win
    if lg:valid() or lg:buf_valid() then
      lg:hide()
    end
  end

  local previous_buffer = vim.api.nvim_get_current_buf()
  lazygit:show()

  if created then
    M.lazygit_cache[key] = lazygit
    vim.api.nvim_buf_set_var(lazygit.buf, "minicursorword_disable", true)
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

        -- focus the previous_buffer after closing lazygit
        if vim.api.nvim_buf_is_valid(previous_buffer) then
          vim.api.set_current_buf(previous_buffer)
        end
      end

      if M.config.debug then
        require("tsugit.debug").add_debug_message(
          string.format(
            "tsugit.nvim: lazygit for cwd %s closed",
            vim.inspect(absolute_cwd)
          )
        )
      end

      assert(M.lazygit_cache[key])
      M.lazygit_cache[key] = nil
      -- warm up the next instance
      local newLazyGit = M.toggle(args, {
        tries_remaining = (options.tries_remaining or 0) - 1,
        term_opts = {},
      })
      if newLazyGit then
        newLazyGit:hide()
      end
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
  options.tries_remaining = 1 -- just one try

  return M.toggle({ "--filter", path }, options)
end

return M
