describe("testing", () => {
  it("can start neovim with a file", () => {
    cy.visit("http://localhost:5173")
    cy.startNeovim()

    // wait until text on the start screen is visible
    cy.contains("If you see this text, Neovim is ready!")
  })
})
