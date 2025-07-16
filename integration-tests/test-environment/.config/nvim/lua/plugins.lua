---@module "lazy"

vim.env.EDITOR = "nvim"
vim.env.VISUAL = "nvim"

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
    opts = {
      debug = true,
    },
  },
  { "catppuccin/nvim", name = "catppuccin", priority = 1000 },
}

return plugins
