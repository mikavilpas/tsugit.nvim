import { flavors } from "@catppuccin/palette"
import { rgbify } from "@tui-sandbox/library/dist/src/client/color-utilities"
import assert from "assert"
import type { MyTestDirectoryFile } from "MyTestDirectory"

const colors = {
  selectedItem: rgbify(flavors.macchiato.colors.blue.rgb),
}

const lazygit = {
  filesPane: "Stash:",
  branchesPane: "Checkout:",
  donateMessage: "Donate",
} as const

describe("testing", () => {
  it("can toggle lazygit on/off", () => {
    cy.visit("/")
    cy.startNeovim({ filename: "fakegitrepo/file.txt" }).then(() => {
      // wait until text on the start screen is visible
      cy.contains("fake-git-repository-file-contents-71f64aabd056")
      initializeGitRepositoryInDirectory()

      cy.typeIntoTerminal("{rightarrow}")
      // close any introduction popup. TODO this should be done automatically
      cy.typeIntoTerminal("{esc}")

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

      // bring lazygit back. The pane should be the same as before - the state
      // must have been kept (lazygit was not actually closed, just toggled)
      cy.typeIntoTerminal("{rightarrow}")
      cy.contains(lazygit.branchesPane)

      // now close lazygit and reopen it. The state should be reset.
      cy.typeIntoTerminal("q")
      cy.contains(lazygit.branchesPane).should("not.exist")
      cy.typeIntoTerminal("{rightarrow}")
      cy.contains(lazygit.filesPane)
      cy.contains(lazygit.branchesPane).should("not.exist")
    })
  })

  it("hides lazygit when clicked outside of the floating window", () => {
    cy.visit("/")

    cy.startNeovim({ filename: "fakegitrepo/file.txt" }).then(() => {
      cy.contains("fake-git-repository-file-contents-71f64aabd056")
      initializeGitRepositoryInDirectory()

      cy.typeIntoTerminal("{rightarrow}")
      cy.contains(lazygit.donateMessage)

      cy.contains("fake-git-repository-file-contents-71f64aabd056").click()
      cy.contains(lazygit.donateMessage).should("not.exist")
    })
  })

  it("can open lazygit after COMMIT_EDITMSG is closed", () => {
    cy.visit("/")

    cy.startNeovim({ filename: "fakegitrepo/file.txt" }).then((nvim) => {
      cy.contains("fake-git-repository-file-contents-71f64aabd056")
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
      additionalEnvironmentVariables: {
        EDITOR: "nvim",
        VISUAL: "nvim",
      },
    }).then((nvim) => {
      cy.contains("fake-git-repository-file-contents-71f64aabd056")
      initializeGitRepositoryInDirectory()

      cy.typeIntoTerminal("{rightarrow}")
      cy.contains("main")

      // the file tree root item (📁 /) should be selected
      cy.contains("/").should(
        "have.css",
        "background-color",
        colors.selectedItem,
      )

      // select the first file in the file tree (move the selection away from
      // the root of the tree)
      cy.typeIntoTerminal("j")

      // stage all files
      cy.typeIntoTerminal("a")
      cy.contains("A").should(
        "have.css",
        "background-color",
        colors.selectedItem,
      )

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
      additionalEnvironmentVariables: {
        EDITOR: "nvim",
        VISUAL: "nvim",
      },
    }).then((nvim) => {
      initializeGitRepositoryInDirectory()
      cy.contains("fake-git-repository-file-contents-71f64aabd056")
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
      cy.contains("/").should(
        "have.css",
        "background-color",
        colors.selectedItem,
      )

      // select the first file in the file tree (move the selection away from
      // the root of the tree)
      cy.typeIntoTerminal("j")

      cy.contains("??").should(
        "have.css",
        "background-color",
        colors.selectedItem,
      )

      // edit the file. This should call neovim to open the file.
      cy.typeIntoTerminal("e")

      // lazygit should have been hidden
      cy.contains("Donate").should("not.exist")

      // the file should have been opened in neovim
      cy.contains("fake-git-repository-file-contents-71f64aabd056").should(
        "not.exist",
      )
      cy.contains("file2-contents")
    })
  })

  it("can display the history for a single file", () => {
    cy.visit("/")

    cy.startNeovim({
      filename: "fakegitrepo/file.txt",
      additionalEnvironmentVariables: {
        EDITOR: "nvim",
        VISUAL: "nvim",
      },
    }).then((nvim) => {
      initializeGitRepositoryInDirectory()
      cy.contains("fake-git-repository-file-contents-71f64aabd056")
      nvim.runBlockingShellCommand({
        command:
          "cd fakegitrepo && git add file.txt && git commit -a -m 'initial commit'",
      })
      nvim.runBlockingShellCommand({
        command: "cd $HOME/fakegitrepo && echo 'file2-contents' > file2.txt",
      })
      nvim.runExCommand({ command: "edit %:h/file2.txt" })
      cy.contains("file2-contents")

      cy.typeIntoTerminal("{rightarrow}")
      cy.contains("Donate")

      // the commit for the first file should be visible
      cy.contains("initial commit")

      cy.typeIntoTerminal("{rightarrow}")
      cy.contains("initial commit").should("not.exist")

      // bring up the file history
      cy.typeIntoTerminal(" gl")

      // the Commits/Reflog pane should be visible
      cy.contains("Reflog")

      cy.contains("Commits")
      cy.contains("Filtering by")
      cy.contains("initial commit").should("not.exist")
    })
  })

  it("can force_quit lazygit", () => {
    cy.visit("/")
    cy.startNeovim({ filename: "fakegitrepo/file.txt" }).then((_nvim) => {
      // wait until text on the start screen is visible
      cy.contains("fake-git-repository-file-contents-71f64aabd056")
      initializeGitRepositoryInDirectory()

      cy.typeIntoTerminal("{rightarrow}")
      // close any introduction popup. TODO this should be done automatically
      cy.typeIntoTerminal("{esc}")

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
    })
  })
})

describe("toggle_for_file", () => {
  it("opens lazygit in filter mode for the given file", () => {
    cy.visit("/")
    cy.startNeovim({ filename: "fakegitrepo/file.txt" }).then((nvim) => {
      // wait until text on the start screen is visible
      cy.contains("fake-git-repository-file-contents-71f64aabd056")
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
      cy.contains("fake-git-repository-file-contents-71f64aabd056")

      nvim.runLuaCode({
        luaCode: `require('tsugit').toggle_for_file()`,
      })
      cy.contains("other-file commit").should("not.exist")
      cy.contains("root commit")
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

function initializeGitRepositoryInDirectory(
  relativePath: MyTestDirectoryFile = "fakegitrepo",
) {
  cy.nvim_runBlockingShellCommand({
    command: `git init`,
    cwdRelative: relativePath,
  }).and((result) => {
    assert(result.type === "success", "Failed to initialize git repository")
  })
}
