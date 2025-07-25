# ⚡ A blazingly fast [lazygit](https://github.com/jesseduffield/lazygit) + Neovim integration

Lazygit is a powerful terminal UI for git. This is a Neovim plugin I built for
myself to make it even more powerful.

> _tsugit_ is a blend of the words tsugi (次, Japanese for "next") and git

<a href="https://dotfyle.com/plugins/mikavilpas/tsugit.nvim">
  <img src="https://dotfyle.com/plugins/mikavilpas/tsugit.nvim/shield?style=flat-square" alt="shield image for plugin usage" /> </a>

<https://github.com/user-attachments/assets/f9f676ee-49eb-424a-9cf1-e472814b9674>

## ✨ Features

- **Blazingly fast**: No more waiting for lazygit to start up. After starting it
  once, it's always running in the background.
  - When you quit lazygit (default lazygit key: `q`), it's automatically
    restarted in the background.
  - Alternatively, toggle lazygit on/off. Instantly bring it back with the same
    key.
  - Kill lazygit (in case it gets stuck) with `<c-c>` by default.
- **Seamless integration**: Use lazygit as if it's a part of Neovim. No extra
  applications are required.
  - You can edit files in Neovim while lazygit is open.
  - See below for 🎁 Goodies on how to write commit messages in Neovim.
- **Autoformatting of commit messages**: If you use
  [conform.nvim](https://github.com/stevearc/conform.nvim), you can
  automatically format your commit messages as markdown on save. It uses
  [prettierd](https://github.com/fsouza/prettierd) under the hood for maximum
  speed. See the instructions below:
  [Autoformatting commit messages with prettierd](#autoformatting-commit-messages-with-prettierd).

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
        -- if lazygit is running in the background but hidden, show it.
        -- otherwise, start it and focus it.
        require("tsugit").toggle()
      end,
      { silent = true, desc = "toggle lazygit" },
    },
    {
      "<leader>gl",
      function()
        -- display the commit history for the current file in lazygit.
        -- do not keep lazygit open after it has been closed.
        require("tsugit").toggle_for_file()
      end,
      { silent = true, desc = "lazygit file commits" },
    },
  },
  -- NOTE: opts is required in lazy.nvim so that setup() is called
  ---@type tsugit.UserConfig
  opts = {
    -- The key mappings that are active when lazygit is open. They are
    -- completely unusable by lazygit, so set the to rare keys.
    --
    -- If you want to completely disable keys, you can set them to `false`.
    -- You can also set `keys = false` to disable automatically creating keymaps.
    keys = {
      -- when lazygit is open and focused, hide it but keep it running in the
      -- background
      toggle = "<right>",
      -- when lazygit is open and focused, kill it and warm up the next
      -- instance
      force_quit = "<c-c>",
    }
    debug = false, -- set to true to enable debug logging

    integrations = {
      -- off by default. The structure is shown here for reference.
      conform = {
        -- use conform.nvim and https://github.com/fsouza/prettierd to format
        -- git COMMIT_EDITMSG files as markdown. More details are available in
        -- the readme.
        formatter = "prettierd",
      },
    },
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
[the previous step](#write-commit-messages-in-neovim).

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

### Autoformatting commit messages with prettierd

Instructions:

1. Install [prettierd](https://github.com/fsouza/prettierd) with e.g.
   [mason.nvim](https://github.com/mason-org/mason.nvim).
2. Configure tsugit.nvim to use the conform.nvim integration

   ```lua
   return {
     "mikavilpas/tsugit.nvim",
     ---@type tsugit.UserConfig
     opts = {
       integrations = {
         conform = {
           formatter = "prettierd",
         },
       },
     }
   ```

<https://github.com/user-attachments/assets/c00be1fd-d7f9-41d9-a2f4-ae742c3c0a87>

See here how it's done in the e2e tests that use
[tui-sandbox](https://github.com/mikavilpas/tui-sandbox):

- [init.lua](integration-tests/test-environment/.config/nvim_formatting/init.lua)
  for configuring tsugit.nvim and conform.nvim
- [prepare.lua](integration-tests/test-environment/.config/nvim_formatting/prepare.lua)
  for installing prettierd

### Lazygit color scheme (💤 lazygit feature)

> [!NOTE]
>
> This is a lazygit feature and not related to tsugit.nvim.

- Themes available on Github:
  <https://github.com/search?q=lazygit%20theme&type=repositories>
- My personal favorite: <https://github.com/catppuccin/lazygit>
  ![lazygit colorscheme preview](https://raw.githubusercontent.com/catppuccin/lazygit/refs/heads/main/assets/preview.webp)

### Nerd font icons (💤 lazygit feature)

<https://github.com/jesseduffield/lazygit/blob/master/docs/Config.md#display-nerd-fonts-icons>

### Better diff syntax highlighting (💤 lazygit feature)

This feature improves lazygit's diff syntax highlighting by providing

- nice colors for your files based on the file type
- improved syntax highlighting for diffs

You can see it being used in the main demo.

- Delta documentation: <https://github.com/dandavison/delta>
- Lazygit documentation for Custom_Pagers:
  <https://github.com/jesseduffield/lazygit/blob/master/docs/Custom_Pagers.md#delta>
- Catppuccin delta colorscheme: <https://github.com/catppuccin/delta>
