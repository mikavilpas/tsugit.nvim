-- Bootstrap lazy.nvim
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not (vim.uv or vim.loop).fs_stat(lazypath) then
  local lazyrepo = "https://github.com/folke/lazy.nvim.git"
  local out = vim.fn.system({
    "git",
    "clone",
    "--filter=blob:none",
    "--branch=v11.14.1",
    lazyrepo,
    lazypath,
  })
  if vim.v.shell_error ~= 0 then
    vim.api.nvim_echo({
      { "Failed to clone lazy.nvim:\n", "ErrorMsg" },
      { out, "WarningMsg" },
      { "\nPress any key to exit..." },
    }, true, {})
    vim.fn.getchar()
    os.exit(1)
  end
end
vim.opt.rtp:prepend(lazypath)

-- Make sure to setup `mapleader` and `maplocalleader` before
-- loading lazy.nvim so that mappings are correct.
-- This is also a good place to setup other settings (vim.opt)
vim.g.mapleader = " "
vim.g.maplocalleader = " "
vim.o.swapfile = false

-- install the following plugins
---@type LazySpec
local plugins = {
  {
    "mikavilpas/tsugit.nvim",
    -- for tests, always use the code from this repository
    dir = "../..",
    -- loading on VeryLazy is required so that lazygit can be shown when
    -- COMMIT_EDITMSG is closed. If setup() is not called, the autocmd for
    -- opening lazygit will not be registered at all.
    event = "VeryLazy",
    keys = {
      {
        "<right>",
        function()
          require("tsugit").toggle()
        end,
        { silent = true },
      },
      {
        "<leader>gl",
        function()
          -- open lazygit history for the current file
          local absolutePath = vim.api.nvim_buf_get_name(0)
          require("tsugit").toggle_for_file(absolutePath)
        end,
        { silent = true },
      },
    },
    -- NOTE: opts is required so that setup() is called
    ---@type tsugit.UserConfig
    opts = {},
  },
  { "catppuccin/nvim", name = "catppuccin", priority = 1000 },
}
require("lazy").setup({ spec = plugins })

vim.cmd.colorscheme("catppuccin-macchiato")
