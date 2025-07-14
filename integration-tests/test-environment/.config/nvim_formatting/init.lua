-- Bootstrap lazy.nvim
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.uv.fs_stat(lazypath) then
  local lazyrepo = "https://github.com/folke/lazy.nvim.git"
  local out = vim.fn.system({
    "git",
    "clone",
    "--filter=blob:none",
    "--branch=v11.17.1",
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

-- load the base plugins from the main nvim configuration
local fname = vim.fs.joinpath(vim.env.PWD, "/.config/nvim/lua/plugins.lua")
local plugins = assert(loadfile(fname)())

---@module "lazy"
---@type LazySpec
vim.list_extend(plugins, {
  -- mason.nvim is used to install prettierd. You can also install it
  -- manually, but in the e2e test environment, this is the easiest way to do
  -- it.
  { "https://github.com/mason-org/mason.nvim", opts = {} },

  -- conform.nvim is the formatter that is used to format the code.
  { "https://github.com/stevearc/conform.nvim", opts = {} },

  -- enable the conform.nvim integration that formats COMMIT_EDITMSG files in
  -- tsugit.nvim
  {
    "mikavilpas/tsugit.nvim",
    ---@type tsugit.UserConfig
    opts = {
      integrations = {
        conform = {
          formatter = "prettierd",
        },
      },
    },
  },
})

require("lazy").setup({ spec = plugins })

vim.cmd.colorscheme("catppuccin-macchiato")
