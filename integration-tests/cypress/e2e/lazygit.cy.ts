const lazygit = {
  filesPane: "Stash:",
  branchesPane: "Checkout:",
} as const

describe("testing", () => {
  it("can toggle lazygit on/off", () => {
    cy.visit("/")
    cy.startNeovim()

    // wait until text on the start screen is visible
    cy.contains("If you see this text, Neovim is ready!")

    cy.typeIntoTerminal("{rightarrow}")

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
