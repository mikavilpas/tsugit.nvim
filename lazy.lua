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
    "mikavilpas/tsugit.nvim",
    keys = {
      {
        "<right>",
        function()
          require("tsugit").toggle()
        end,
        { silent = true },
      },
    },
    opts = {},
  },
}
