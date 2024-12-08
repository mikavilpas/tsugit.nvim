# ⚡ A blazingly fast [lazygit](https://github.com/jesseduffield/lazygit) + Neovim integration

Lazygit is a powerful terminal UI for git. This is a Neovim plugin I built for
myself to make it even more powerful.

> _tsugit_ is a blend of the words tsugi (次, Japanese for "next") and git

<a href="https://dotfyle.com/plugins/mikavilpas/tsugit.nvim">
  <img src="https://dotfyle.com/plugins/mikavilpas/tsugit.nvim/shield?style=flat-square" alt="shield image for plugin usage" /> </a>

https://github.com/user-attachments/assets/46c8b582-6b4f-4418-8fe4-e63f0d8766cf

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
  - See below for [[#🎁 Goodies]]
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

## 🎁 Goodies

These are cool features that can be enabled manually with a bit of extra work.

> [!TIP]
>
> I'm looking for a way to make it easier to integrate these features. For now,
> you can add these manually to your config.

### Write commit messages in Neovim

With the following config, lazygit uses the parent nvim to edit commit messages.
`:bd[elete]` when you are done to return to lazygit.

When using lazygit outside of Neovim, lazygit will open a new Neovim instance.

```yaml
# /Users/mikavilpas/.config/lazygit/config.yml
os:
  edit: "nvim {{filename}}"
  editAtLine: "nvim +{{line}} {{filename}}"
  editAtLineAndWait: "nvim +{{line}} {{filename}}"
```

### AI assisted commit messages in Neovim

If you use an AI assistant that can complete text in Neovim, you can use it to
write commit messages. It should get activated automatically when you follow
[[#Write commit messages in Neovim]].

I also recommend giving the assistant more context by providing the full diff of
the change as text. This feature is built-in to git, but it's not enabled by
default. You can enable it with the following config:

```gitconfig
# /Users/mikavilpas/.gitconfig
[commit]
	verbose = true
```

The documentation for this feature can be found in the git docs
[here](https://git-scm.com/docs/git-commit#Documentation/git-commit.txt---verbose).

### Lazygit color scheme (💤 lazygit feature)

> [!NOTE]
>
> This is a lazygit feature and not related to tsugit.nvim.

- Themes available on Github:
  <https://github.com/search?q=lazygit%20theme&type=repositories>
- My personal favorite: <https://github.com/catppuccin/lazygit>

### Nerd font icons (💤 lazygit feature)

<https://github.com/jesseduffield/lazygit/blob/master/docs/Config.md#display-nerd-fonts-icons>

### Better diff syntax highlighting (💤 lazygit feature)

This is such a nice feature that I don't even know what to say.

<https://github.com/dandavison/delta>

<https://github.com/jesseduffield/lazygit/blob/master/docs/Custom_Pagers.md#delta>
