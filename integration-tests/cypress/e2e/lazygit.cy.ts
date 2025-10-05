import { flavors } from "@catppuccin/palette"
import { rgbify } from "@tui-sandbox/library/dist/src/client/color-utilities"
import { textIsVisibleWithBackgroundColor } from "@tui-sandbox/library/dist/src/client/cypress-assertions"
import z from "zod"
import {
  assertCurrentBufferName,
  initializeGitRepositoryInDirectory,
} from "./test-utils"
const colors = {
  selectedItem: rgbify(flavors.macchiato.colors.blue.rgb),
}

const lazygit = {
  filesPane: "Stash:",
  branchesPane: "Checkout:",
  donateMessage: "Donate",
} as const

const fakeGitRepoFileText = "fake-git-repository-file-contents-71f64aabd056"

const lazygitWasClosedMessage = "tsugit.nvim: lazygit closed for"

describe("testing", () => {
  it("can toggle lazygit on/off", () => {
    cy.visit("/")
    cy.startNeovim({ filename: "fakegitrepo/file.txt" }).then((nvim) => {
      // wait until text on the start screen is visible
      cy.contains(fakeGitRepoFileText)
      initializeGitRepositoryInDirectory()

      cy.typeIntoTerminal("{rightarrow}")

      // wait until lazygit has initialized and the main branch name is visible
      cy.contains("main")

      // The files pane is selected by default (the text is displayed at the
      // bottom of the screen)
      cy.contains(lazygit.filesPane)
      cy.contains(lazygit.branchesPane).should("not.exist")

      // switch to the Local branches pane
      cy.typeIntoTerminal("3")
      cy.contains(lazygit.filesPane).should("not.exist")
      cy.contains(lazygit.branchesPane)

      // lazygit is now in a non-default state. Let's toggle it off
      cy.typeIntoTerminal("{rightarrow}")
      // lazygit should have disappeared
      cy.contains(lazygit.branchesPane).should("not.exist")

      // it should not have been closed yet
      nvim.runExCommand({ command: "messages" }).and((output) => {
        expect(output.value).to.not.include(lazygitWasClosedMessage)
      })

      // bring lazygit back. The pane should be the same as before - the state
      // must have been kept (lazygit was not actually closed, just toggled)
      cy.typeIntoTerminal("{rightarrow}")
      cy.contains(lazygit.branchesPane)

      // now close lazygit and reopen it. The state should be reset.
      cy.typeIntoTerminal("q")
      cy.contains(lazygit.branchesPane).should("not.exist")

      nvim.runExCommand({ command: "messages" }).and((output) => {
        expect(output.value).to.include(lazygitWasClosedMessage)
      })

      cy.typeIntoTerminal("{rightarrow}")
      cy.contains(lazygit.filesPane)
      cy.contains(lazygit.branchesPane).should("not.exist")
    })
  })

  it("hides lazygit when clicked outside of the floating window", () => {
    cy.visit("/")

    cy.startNeovim({ filename: "fakegitrepo/file.txt" }).then(() => {
      cy.contains(fakeGitRepoFileText)
      initializeGitRepositoryInDirectory()

      cy.typeIntoTerminal("{rightarrow}")
      cy.contains(lazygit.donateMessage)

      cy.contains(fakeGitRepoFileText).click()
      cy.contains(lazygit.donateMessage).should("not.exist")
    })
  })

  it("keeps focus on the previous buffer after closing", () => {
    cy.visit("/")

    cy.startNeovim({
      filename: {
        openInVerticalSplits: [
          "fakegitrepo/file.txt",
          "fakegitrepo/other-file.txt",
        ],
      },
    }).then((nvim) => {
      cy.contains(fakeGitRepoFileText)
      initializeGitRepositoryInDirectory()

      // make sure the first file is focused
      assertCurrentBufferName("fakegitrepo/file.txt")

      // focus on the second file
      nvim.runExCommand({ command: "wincmd l" })
      assertCurrentBufferName("fakegitrepo/other-file.txt")

      cy.typeIntoTerminal("{rightarrow}")
      cy.contains(lazygit.donateMessage)

      cy.typeIntoTerminal("q")
      cy.contains(lazygit.donateMessage).should("not.exist")
      assertCurrentBufferName("fakegitrepo/other-file.txt")
    })
  })

  it("can open lazygit after COMMIT_EDITMSG is closed", () => {
    cy.visit("/")

    cy.startNeovim({ filename: "fakegitrepo/file.txt" }).then((nvim) => {
      cy.contains(fakeGitRepoFileText)
      initializeGitRepositoryInDirectory()
      nvim.runExCommand({ command: "e %:h/.git/COMMIT_EDITMSG" })
      cy.typeIntoTerminal("itest commit message{esc}", { delay: 0 })
      nvim.runExCommand({ command: "write | bdelete" })

      cy.contains(lazygit.donateMessage)
    })
  })

  it("can write a lazygit commit message in neovim", () => {
    cy.visit("/")

    cy.startNeovim({
      filename: "fakegitrepo/file.txt",
    }).then((nvim) => {
      cy.contains(fakeGitRepoFileText)
      initializeGitRepositoryInDirectory()

      cy.typeIntoTerminal("{rightarrow}")
      cy.contains("main")

      // the file tree root item (📁 /) should be selected
      textIsVisibleWithBackgroundColor("/", colors.selectedItem)

      // select the first file in the file tree (move the selection away from
      // the root of the tree)
      cy.typeIntoTerminal("j")

      // stage all files
      cy.typeIntoTerminal("a")
      textIsVisibleWithBackgroundColor("A", colors.selectedItem)

      // tell lazygit to commit the changes. This should hide lazygit and open
      // COMMIT_EDITMSG in the parent neovim because flatten.nvim is used
      cy.contains("main")
      cy.typeIntoTerminal("C")
      cy.contains("# Please enter the commit message for your changes.")

      cy.typeIntoTerminal("itest commit message{esc}", { delay: 0 })
      nvim.runExCommand({ command: "write | bdelete" })

      // lazygit should have been brought back
      cy.contains("Donate")
    })
  })

  it("can open a file in neovim from lazygit", () => {
    cy.visit("/")

    cy.startNeovim({
      filename: "fakegitrepo/file.txt",
    }).then((nvim) => {
      initializeGitRepositoryInDirectory()
      cy.contains(fakeGitRepoFileText)
      nvim.runBlockingShellCommand({
        command:
          "cd fakegitrepo && git add file.txt && git commit -a -m 'initial commit'",
      })
      nvim.runBlockingShellCommand({
        command: "cd $HOME/fakegitrepo && echo 'file2-contents' > file2.txt",
      })

      cy.typeIntoTerminal("{rightarrow}")
      cy.contains("Donate")

      // the file tree root item (📁 /) should be selected
      textIsVisibleWithBackgroundColor("/", colors.selectedItem)

      // select the first file in the file tree (move the selection away from
      // the root of the tree)
      cy.typeIntoTerminal("j")

      textIsVisibleWithBackgroundColor("??", colors.selectedItem)

      // edit the file. This should call neovim to open the file.
      cy.typeIntoTerminal("e")

      // lazygit should have been hidden
      cy.contains("Donate").should("not.exist")

      // the file should have been opened in neovim
      cy.contains(fakeGitRepoFileText).should("not.exist")
      cy.contains("file2-contents")
    })
  })

  it("can display the history for a single file", () => {
    cy.visit("/")

    cy.startNeovim({
      filename: "fakegitrepo/file.txt",
    }).then((nvim) => {
      initializeGitRepositoryInDirectory()
      cy.contains(fakeGitRepoFileText)
      nvim.runBlockingShellCommand({
        command:
          "cd fakegitrepo && git add file.txt && git commit -a -m 'initial commit'",
      })
      nvim.runBlockingShellCommand({
        command: "cd $HOME/fakegitrepo && echo 'file2-contents' > file2.txt",
      })
      nvim.runExCommand({ command: "edit %:h/file2.txt" })
      cy.contains("file2-contents")

      // opening lazygit for a single file should keep the "repo" lazygit
      // active. the single file lazygit should also be closeable with
      // rightarrow without disturbing the "repo" lazygit

      {
        // manipulate the repoLevelLazygit
        cy.typeIntoTerminal("{rightarrow}")
        cy.contains("Donate")

        // the commit for the first file should be visible
        cy.contains("initial commit")
        // set up some state for the repoLevelLazygit by hiding the command log
        cy.contains("Command log")
        cy.typeIntoTerminal("@")
        cy.contains("Toggle show/hide command log")
        cy.typeIntoTerminal("{enter}")
        cy.contains("Command log").should("not.exist")

        cy.typeIntoTerminal("{rightarrow}")
        cy.contains("initial commit").should("not.exist")
      }

      {
        // manipulate the fileLevelLazygit
        cy.typeIntoTerminal(" gl")

        // the Commits/Reflog pane should be visible
        cy.contains("Reflog")
        // we're at the commits view in the single file lazygit. Move to the next view.
        cy.contains("Commits")
        cy.contains("Stash").should("not.exist")
        cy.contains("Filtering by")
        cy.contains("initial commit").should("not.exist")
        cy.typeIntoTerminal("l") // move
        cy.contains("Commits").should("not.exist")
        cy.contains("Stash")
      }

      // toggle it to hide it
      cy.typeIntoTerminal("{rightarrow}")
      cy.contains("Stash").should("not.exist")

      {
        // toggle the fileLevelLazygit back and close it
        cy.typeIntoTerminal(" gl")
        cy.contains("Stash") // should still be visible
        cy.typeIntoTerminal("q")
        cy.contains("Stash").should("not.exist")
      }

      {
        // manipulate the repoLevelLazygit again
        cy.typeIntoTerminal("{rightarrow}")
        cy.contains("Donate")
        cy.contains("Command log").should("not.exist") // should still be hidden (not closed)
      }
    })
  })

  it("can force_quit lazygit", () => {
    cy.visit("/")
    cy.startNeovim({ filename: "fakegitrepo/file.txt" }).then((_nvim) => {
      // wait until text on the start screen is visible
      cy.contains(fakeGitRepoFileText)
      initializeGitRepositoryInDirectory()

      cy.typeIntoTerminal("{rightarrow}")

      // wait until lazygit has initialized and the main branch name is visible
      cy.contains("main")

      // The files pane is selected by default (the text is displayed at the
      // bottom of the screen)
      cy.contains(lazygit.filesPane)
      cy.contains(lazygit.branchesPane).should("not.exist")

      // switch to the Local branches pane
      cy.typeIntoTerminal("3")
      cy.contains(lazygit.filesPane).should("not.exist")
      cy.contains(lazygit.branchesPane)

      // lazygit is now in a non-default state. Let's force_quit it
      cy.typeIntoTerminal("{control+c}")

      // lazygit should have disappeared
      cy.contains(lazygit.branchesPane).should("not.exist")

      // bring lazygit back. The pane should be reset to the initial state
      cy.contains(lazygit.branchesPane).should("not.exist")
      cy.typeIntoTerminal("{rightarrow}")
      cy.contains(lazygit.filesPane)
      cy.contains(lazygit.branchesPane).should("not.exist")

      // make sure we can still quit the new lazygit normally
      cy.typeIntoTerminal("q")
      cy.contains(lazygit.filesPane).should("not.exist")
      cy.typeIntoTerminal("{rightarrow}")
      cy.contains(lazygit.filesPane)
    })
  })
})

describe("toggle_for_file", () => {
  it("opens lazygit in filter mode for the given file", () => {
    cy.visit("/")
    cy.startNeovim({ filename: "fakegitrepo/file.txt" }).then((nvim) => {
      // wait until text on the start screen is visible
      cy.contains(fakeGitRepoFileText)
      initializeGitRepositoryInDirectory()

      // create a commit for the root repo that includes all files in this mini
      // repo
      cy.typeIntoTerminal("ofoo{esc}")
      nvim.runExCommand({ command: "write" })
      nvim.runBlockingShellCommand({
        command: `git add . && git commit -m 'root commit'`,
        cwdRelative: "fakegitrepo",
      })

      // create commit for other-file.txt that only includes that file
      nvim.runExCommand({ command: "edit %:h/other-file.txt" })
      cy.contains("another fakegitrepo file")
      cy.typeIntoTerminal("ofoo{esc}")
      nvim.runExCommand({ command: "write" })
      nvim.runBlockingShellCommand({
        command: `git add . && git commit -m 'other-file commit'`,
        cwdRelative: "fakegitrepo",
      })

      // verify that toggle_for_file shows the commit messages for the current
      // file
      nvim.runLuaCode({
        luaCode: `require('tsugit').toggle_for_file()`,
      })
      cy.contains("other-file commit")
      cy.contains("root commit")
      // close lazygit
      cy.typeIntoTerminal("q")
      cy.contains("other-file commit").should("not.exist")

      // now that both files have a commit, go back to the first file and
      // verify that the commit message for that file only is visible when
      // toggle_for_file is used
      nvim.runExCommand({ command: "edit %:h/file.txt" })
      cy.contains(fakeGitRepoFileText)

      nvim.runLuaCode({
        luaCode: `require('tsugit').toggle_for_file()`,
      })
      cy.contains("other-file commit").should("not.exist")
      cy.contains("root commit")
    })
  })

  it("can start toggle_for_file in a different screen mode", () => {
    cy.visit("/")

    cy.startNeovim({
      filename: "fakegitrepo/file.txt",
      startupScriptModifications: [
        "map_key_to_start_lazygit_in_normal_screen_mode.lua",
      ],
    }).then((nvim) => {
      initializeGitRepositoryInDirectory()
      cy.contains(fakeGitRepoFileText)
      nvim.runBlockingShellCommand({
        command: "git add file.txt && git commit -a -m 'initial commit'",
        cwdRelative: "fakegitrepo",
      })

      cy.typeIntoTerminal(" lF")

      // the normal screen mode should have been applied
      cy.contains("Worktrees")
    })
  })
})

describe("in a git workspace", () => {
  it("by default, opens the current workspace", () => {
    cy.visit("/")
    cy.startNeovim({}).then((nvim) => {
      // set up a git workspace
      nvim.runBlockingShellCommand({
        command: "./create-workspaces.sh",
        cwdRelative: "workspace-test",
      })

      // test: opening tsugit in a file in a workspace opens lazygit in that
      // workspace (not the workspace root)
      nvim.runExCommand({
        command:
          "e %:h/workspace-test/my-repo/workspaces/workspace1/workspace1.txt",
      })
      cy.contains("This is workspace 1")
      cy.typeIntoTerminal("{rightarrow}")
      // the commits for this workspace should be visible
      cy.contains("Add workspace1.txt")
      cy.contains("Initial commit")

      cy.typeIntoTerminal("q")
      cy.contains("Add workspace1.txt").should("not.exist")

      // test: toggle_for_file should also open lazygit in the current workspace
      nvim.runLuaCode({
        luaCode: `require('tsugit').toggle_for_file()`,
      })
      cy.contains("Add workspace1.txt")
      // at the bottom, lazygit should show that we're filtering the commits
      // for this file only
      cy.contains("Filtering by")
      cy.typeIntoTerminal("q")
      cy.contains("Add workspace1.txt").should("not.exist")
    })
  })
})

describe("conform integration for commit message formatting", () => {
  it("can reformat a COMMIT_EDITMSG file with prettierd", () => {
    cy.visit("/")

    cy.startNeovim({
      filename: "fakegitrepo/file.txt",
      NVIM_APPNAME: "nvim_formatting",
    }).then((nvim) => {
      cy.contains(fakeGitRepoFileText)
      initializeGitRepositoryInDirectory()
      nvim.runBlockingShellCommand({
        command: `git add .`,
        cwdRelative: "fakegitrepo",
      })
      cy.typeIntoTerminal("{rightarrow}")

      // wait until lazygit has initialized and the main branch name is visible
      cy.contains("main")

      cy.typeIntoTerminal("C") // commit
      nvim.waitForLuaCode({
        luaAssertion: `return vim.api.nvim_buf_get_name(0) == vim.fn.expand('%:h') .. '/.git/COMMIT_EDITMSG'`,
      })
      cy.contains("# Please enter the commit message for your changes.")

      // add some unformatted text and save
      nvim.runExCommand({ command: `normal! i  test` })
      nvim.runExCommand({ command: `normal! o ` })
      nvim.runExCommand({ command: `normal! o-  list` })
      nvim.runExCommand({ command: `normal! o` })
      nvim.runExCommand({
        command: `normal! oLong line long line long line long line long long line long line line should wrap here`,
      })
      nvim.runExCommand({ command: `normal! gg` })
      cy.typeIntoTerminal(":w{enter}")

      // prettierd should have formatted the text
      nvim.waitForLuaCode({
        // wait for the first line to be formatted. This means the formatter is
        // finished.
        luaAssertion: `assert (vim.api.nvim_get_current_line() == "test")`,
      })

      nvim
        .runLuaCode({
          luaCode: `return vim.api.nvim_buf_get_lines(0, 0, -1, false)`,
        })
        .then((result) => {
          const lines = z.array(z.string()).parse(result.value)
          expect(lines.slice(0, 8).join("\n")).to.deep.equal(
            [
              "test",
              "",
              "- list",
              "",
              "Long line long line long line long line long long line long line line",
              "should wrap here",
              "",
              "# Please enter the commit message for your changes. Lines starting",
            ].join("\n"),
          )
        })
    })
  })

  it("can reformat a COMMIT_EDITMSG file with a custom commentChar", () => {
    // git allows customizing the comment character used in commit messages.
    cy.visit("/")

    cy.startNeovim({
      filename: "fakegitrepo/file.txt",
      NVIM_APPNAME: "nvim_formatting",
    }).then((nvim) => {
      cy.contains(fakeGitRepoFileText)
      initializeGitRepositoryInDirectory()
      nvim.runBlockingShellCommand({
        command: `git add .`,
        cwdRelative: "fakegitrepo",
      })
      // set the commentChar to a custom value
      nvim.runBlockingShellCommand({
        command: `git config core.commentChar ";"`,
        cwdRelative: "fakegitrepo",
      })
      cy.typeIntoTerminal("{rightarrow}")

      // wait until lazygit has initialized and the main branch name is visible
      cy.contains("main")

      cy.typeIntoTerminal("C") // commit
      nvim.waitForLuaCode({
        luaAssertion: `return vim.api.nvim_buf_get_name(0) == vim.fn.expand('%:h') .. '/.git/COMMIT_EDITMSG'`,
      })
      cy.contains("; Please enter the commit message for your changes.")

      // add some unformatted text and save
      nvim.runExCommand({ command: `normal! i  test` })
      nvim.runExCommand({ command: `normal! o ` })
      nvim.runExCommand({ command: `normal! o-  list` })
      nvim.runExCommand({ command: `normal! o` })
      nvim.runExCommand({ command: `normal! gg` })
      cy.typeIntoTerminal(":w{enter}")

      // prettierd should have formatted the text
      nvim.waitForLuaCode({
        // wait for the first line to be formatted. This means the formatter is
        // finished.
        luaAssertion: `assert (vim.api.nvim_get_current_line() == "test")`,
      })

      nvim
        .runLuaCode({
          luaCode: `return vim.api.nvim_buf_get_lines(0, 0, -1, false)`,
        })
        .then((result) => {
          const lines = z.array(z.string()).parse(result.value)
          expect(lines.slice(0, 5).join("\n")).to.deep.equal(
            [
              "test",
              "",
              "- list",
              "",
              "; Please enter the commit message for your changes. Lines starting",
            ].join("\n"),
          )
        })
    })
  })
})
