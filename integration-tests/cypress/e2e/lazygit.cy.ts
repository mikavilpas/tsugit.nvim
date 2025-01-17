import { flavors } from "@catppuccin/palette"
import { rgbify } from "@tui-sandbox/library/dist/src/client/color-utilities"
import assert from "assert"

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

      // TODO tui-sandbox should have a human readable way to match the text on the screen
      //
      // for now just match on the symbol before the file since the test
      // environment is well controlled anyway
      cy.contains("??").should(
        "have.css",
        "background-color",
        colors.selectedItem,
      )

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
    cy.startNeovim({ filename: "fakegitrepo/file.txt" }).then((nvim) => {
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

      // snacks displays an error message. Close it.
      cy.contains("Error detected")
      cy.contains("Check for any errors")
      cy.typeIntoTerminal("{enter}")
      cy.contains("Check for any errors").should("not.exist")

      // lazygit should have disappeared
      cy.contains(lazygit.branchesPane).should("not.exist")

      // we should be in insert mode (TODO why? is this caused by snacks?)
      cy.contains("INSERT")
      nvim.runLuaCode({
        luaCode: "assert(vim.api.nvim_get_mode().mode == 'i')",
      })
      cy.typeIntoTerminal("{esc}")

      // bring lazygit back. The pane should be reset to the initial state
      cy.contains(lazygit.branchesPane).should("not.exist")
      cy.typeIntoTerminal("{rightarrow}")
      cy.contains(lazygit.filesPane)
      cy.contains(lazygit.branchesPane).should("not.exist")
    })
  })
})

function initializeGitRepositoryInDirectory(
  relativePath: string = "fakegitrepo",
) {
  cy.nvim_runBlockingShellCommand({
    command: `cd $HOME/${relativePath} && git init`,
  }).and((result) => {
    assert(result.type === "success", "Failed to initialize git repository")
  })
}
