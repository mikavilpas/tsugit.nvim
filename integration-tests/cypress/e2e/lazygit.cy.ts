const lazygit = {
  filesPane: "Stash:",
  branchesPane: "Checkout:",
  donateMessage: "Donate",
} as const

describe("testing", () => {
  it("can toggle lazygit on/off", () => {
    cy.visit("/")
    cy.startNeovim()

    // wait until text on the start screen is visible
    cy.contains("If you see this text, Neovim is ready!")

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

  it("can open lazygit after COMMIT_EDITMSG is closed", () => {
    cy.visit("/")

    cy.startNeovim({ filename: "fakegitrepo/file.txt" }).then(() => {
      cy.contains("fake-git-repository-file-contents-71f64aabd056")
      initializeGitRepositoryInCurrentDirectory()
      cy.typeIntoTerminal(":e %:h/.git/COMMIT_EDITMSG{enter}", { delay: 0 })
      cy.typeIntoTerminal("itest commit message{esc}", { delay: 0 })
      cy.typeIntoTerminal(":write | bdelete{enter}", { delay: 0 })

      cy.contains(lazygit.donateMessage)
    })
  })
})

function initializeGitRepositoryInCurrentDirectory() {
  // this is massively more performant than using cy.exec()
  cy.typeIntoTerminal(":!cd %:h/ && git init{enter}", { delay: 0 })
  cy.contains("Initialized empty Git repository")
  cy.typeIntoTerminal("{enter}")
}
