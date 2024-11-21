-- This file is used to define the dependencies of this plugin when the user is
-- using lazy.nvim.
--
-- If you are curious about how exactly the plugins are used, you can use e.g.
-- the search functionality on Github.
--
--https://lazy.folke.io/packages#lazy

---@module "lazy"
---@module "tsugit"

---@type LazySpec
return {
  { "folke/snacks.nvim", lazy = true },
  {
    -- Open files and command output from wezterm, kitty, and neovim terminals in
    -- your current neovim instance
    -- https://github.com/willothy/flatten.nvim
    "willothy/flatten.nvim",
    -- Ensure that it runs first to minimize delay when opening file from terminal
    lazy = false,
    priority = 1001,
    enabled = true,

    opts = {
      window = { open = "alternate" },
    },
  },
  {
    "mikavilpas/tsugit.nvim",
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
    opts = {},
  },
}
