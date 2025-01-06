local M = {}

---@module "snacks.win"

---@param config tsugit.Config
---@param lazygit snacks.win
function M.create_keymaps(config, lazygit)
  if not config.keys then
    return
  end

  if config.keys.toggle and config.keys.toggle ~= false then
    vim.keymap.set({ "t" }, config.keys.toggle, function()
      -- this prevents using the key in lazygit, but is very performant
      lazygit:hide()
    end, { buffer = lazygit.buf })
  end

  if config.keys.force_quit ~= false then
    vim.keymap.set({ "t" }, config.keys.force_quit, function()
      vim.o.lazyredraw = true
      pcall(function()
        lazygit:close({ buf = true })
      end)
      vim.o.lazyredraw = false
    end, { buffer = lazygit.buf })
  end
end

return M
