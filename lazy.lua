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
  {
    "folke/snacks.nvim",
    -- renovate: datasource=github-releases depName=folke/snacks.nvim
    version = "v2.28.0",
    lazy = true,
  },
  {
    -- Open files and command output from wezterm, kitty, and neovim terminals in
    -- your current neovim instance
    -- https://github.com/willothy/flatten.nvim
    "willothy/flatten.nvim",
    commit = "7252779",
    -- Ensure that it runs first to minimize delay when opening file from terminal
    lazy = false,
    priority = 1001,
    enabled = true,
    config = true,
  },
  {
    "mikavilpas/tsugit.nvim",
  },
}
