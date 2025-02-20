-- https://lazy.folke.io/developers#reprolua

vim.env.LAZY_STDPATH = ".repro"
load(
  vim.fn.system(
    "curl -s https://raw.githubusercontent.com/folke/lazy.nvim/main/bootstrap.lua"
  )
)()

---@diagnostic disable-next-line: missing-fields
require("lazy.minit").repro({
  ---@type LazySpec
  spec = {
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
      config = function()
        require("tsugit").setup({

          keys = {
            toggle = "<right>",
            force_quit = "<c-c>",
          },
        })
      end,
    },
  },
})

-- do anything else you need to do to reproduce the issue
