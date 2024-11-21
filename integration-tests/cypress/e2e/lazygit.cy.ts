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

  it("can open lazygit after COMMIT_EDITMSG is closed", () => {
    cy.visit("/")

    cy.startNeovim({ filename: "fakegitrepo/file.txt" }).then(() => {
      cy.contains("fake-git-repository-file-contents-71f64aabd056")
      initializeGitRepositoryInDirectory()
      cy.typeIntoTerminal(":e %:h/.git/COMMIT_EDITMSG{enter}", { delay: 0 })
      cy.typeIntoTerminal("itest commit message{esc}", { delay: 0 })
      cy.typeIntoTerminal(":write | bdelete{enter}", { delay: 0 })

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
    }).then(() => {
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

      cy.typeIntoTerminal("itest commit message{esc}:write | bdelete{enter}", {
        delay: 0,
      })

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
    }).then(() => {
      initializeGitRepositoryInDirectory()
      cy.contains("fake-git-repository-file-contents-71f64aabd056")
      cy.runBlockingShellCommand({
        command:
          "cd fakegitrepo && git add file.txt && git commit -a -m 'initial commit'",
      })
      cy.runBlockingShellCommand({
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
    }).then(() => {
      initializeGitRepositoryInDirectory()
      cy.contains("fake-git-repository-file-contents-71f64aabd056")
      cy.runBlockingShellCommand({
        command:
          "cd fakegitrepo && git add file.txt && git commit -a -m 'initial commit'",
      })
      cy.runBlockingShellCommand({
        command: "cd $HOME/fakegitrepo && echo 'file2-contents' > file2.txt",
      })
      cy.typeIntoTerminal(":edit %:h/file2.txt{enter}", { delay: 0 })
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

      // by default we are not looking at the full view in file mode
      cy.contains("Status").should("not.exist")

      // goto the next screen mode (the full view) so that we get a good
      // overall view for tests
      cy.typeIntoTerminal("+")
      cy.contains("Status")
      cy.contains("Filtering by")
      cy.contains("initial commit").should("not.exist")
    })
  })
})

function initializeGitRepositoryInDirectory(
  relativePath: string = "fakegitrepo",
) {
  cy.runBlockingShellCommand({
    command: `cd $HOME/${relativePath} && git init`,
  }).and((result) => {
    assert(result.type === "success", "Failed to initialize git repository")
  })
}
