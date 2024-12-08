# ⚡ A blazingly fast [lazygit](https://github.com/jesseduffield/lazygit) + Neovim integration

Lazygit is a powerful terminal UI for git. This is a Neovim plugin I built for
myself to make it even more powerful.

> _tsugit_ is a blend of the words tsugi (次, Japanese for "next") and git

<a href="https://dotfyle.com/plugins/mikavilpas/tsugit.nvim">
  <img src="https://dotfyle.com/plugins/mikavilpas/tsugit.nvim/shield?style=flat-square" alt="shield image for plugin usage" /> </a>

![fast git in the forest 🙂)](https://raw.githubusercontent.com/mikavilpas/tsugit.nvim/refs/heads/assets/.github/images/logo.jpeg)

## ✨ Features

- **Blazingly fast**: No more waiting for lazygit to start up. After starting it
  once, it's always running in the background.
  - When you quit lazygit (default: `q`), it's automatically restarted in the
    background.
  - Alternatively, toggle lazygit on/off. Instantly bring it back with the same
    key.
  - Kill lazygit (in case it gets stuck) with `<c-c>`.
- **Seamless integration**: Use lazygit as if it's a part of Neovim. No extra
  applications are required.
  - You can edit files in Neovim while lazygit is open.
  - yeah, that's it for now 😄

## 📦 Installation

Requires [lazy.nvim](https://lazy.folke.io/).

```lua
---@module "lazy"
---@type LazySpec
return {
  "mikavilpas/tsugit.nvim",
  keys = {
    {
      "<right>",
      function()
        require("tsugit").toggle()
      end,
      { silent = true, desc = "toggle lazygit" },
    },
    {
      "<leader>gl",
      function()
        local absolutePath = vim.api.nvim_buf_get_name(0)
        require("tsugit").toggle_for_file(absolutePath)
      end,
      { silent = true, desc = "lazygit file commits" },
    },
  },
  -- NOTE: opts is required in lazy.nvim so that setup() is called
  ---@type tsugit.UserConfig
  opts = {
    -- The key mappings that are active when lazygit is open. They are
    -- completely unusable by lazygit, so set the to rare keys.
    keys = {
      toggle = "<right>",
      force_quit = "<c-c>",
    }
  },
}

```

See
[permalink to my personal config](https://github.com/mikavilpas/dotfiles/blob/8bbd50dd96cfd891e0c1ea24c96b4270ff84cb7e/.config/nvim/lua/plugins/git.lua#L45-L48)
or the
[latest version](https://github.com/mikavilpas/dotfiles/blob/main/.config/nvim/lua/plugins/git.lua?plain=1)
