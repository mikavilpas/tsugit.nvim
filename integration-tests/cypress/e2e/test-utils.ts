import type { RunLuaCodeOutput } from "@tui-sandbox/library/src/server/types"
import type { MyTestDirectoryFile } from "../../MyTestDirectory"

export function initializeGitRepositoryInDirectory(
  relativePath: MyTestDirectoryFile = "fakegitrepo",
): void {
  cy.nvim_runBlockingShellCommand({
    command: `git init`,
    cwdRelative: relativePath,
  }).and((result) => {
    assert(result.type === "success", "Failed to initialize git repository")
  })
}

export function assertCurrentBufferName(
  name: MyTestDirectoryFile,
): Cypress.Chainable<RunLuaCodeOutput> {
  return cy
    .nvim_runLuaCode({ luaCode: `return vim.api.nvim_buf_get_name(0)` })
    .then((result) => {
      expect(result.value).to.match(new RegExp(name))
    })
}
