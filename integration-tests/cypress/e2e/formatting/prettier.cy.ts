import type {
  MyStartNeovimServerArguments,
  NeovimContext,
} from "../../support/tui-sandbox.ts"
import {
  initializeGitRepositoryInDirectory,
  waitForFormattingToHaveCompleted,
} from "../test-utils.js"

const fakeGitRepoFileText = "fake-git-repository-file-contents-71f64aabd056"

const startNeovimWithPrettierd = (
  args?: MyStartNeovimServerArguments,
): Cypress.Chainable<NeovimContext> =>
  cy.startNeovim({
    ...args,
    startupScriptModifications: ["use_prettierd_for_formatting.lua"],
  })

describe("conform integration for commit message formatting", () => {
  it("can reformat a COMMIT_EDITMSG file with prettierd", () => {
    cy.visit("/")

    startNeovimWithPrettierd({
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

      waitForFormattingToHaveCompleted(nvim)
      nvim.runExCommand({ command: `1,8yank` })
      nvim.clipboard.system().should(
        "equal",
        [
          // the subject line should be formatted when it's <72 chars
          "test",
          "",
          "- list",
          "",
          "Long line long line long line long line long long line long line line",
          "should wrap here",
          "",
          "# Please enter the commit message for your changes. Lines starting",
          "",
        ].join("\n"),
      )
    })
  })

  it("can reformat a COMMIT_EDITMSG file with a custom commentChar", () => {
    // git allows customizing the comment character used in commit messages.
    cy.visit("/")

    startNeovimWithPrettierd({
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
      nvim.runExCommand({ command: `normal! itest` })
      nvim.runExCommand({ command: `normal! o ` })
      nvim.runExCommand({ command: `normal! o-  list` })
      nvim.runExCommand({ command: `normal! o` })
      nvim.runExCommand({ command: `normal! gg` })
      cy.typeIntoTerminal(":w{enter}")

      waitForFormattingToHaveCompleted(nvim)

      nvim.runExCommand({ command: `1,5yank` })
      nvim.clipboard
        .system()
        .should(
          "equal",
          [
            "test",
            "",
            "- list",
            "",
            "; Please enter the commit message for your changes. Lines starting",
            "",
          ].join("\n"),
        )
    })
  })

  const longSubject =
    "chore: this is a very long subject line that should not be wrapped by the formatter"
  assert(longSubject.length > 72)

  it("formats in long mode when the commit subject is long", () => {
    cy.visit("/")

    startNeovimWithPrettierd({
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

      // set the first line to contain longSubject
      nvim.runLuaCode({
        luaCode: `vim.api.nvim_buf_set_lines(0, 0, 1, false, { "${longSubject}" })`,
      })

      nvim.runExCommand({ command: `normal! o ` })
      nvim.runExCommand({ command: `normal! o-  list` })
      nvim.runExCommand({ command: `normal! o` })
      nvim.runExCommand({ command: `normal! gg` })
      cy.typeIntoTerminal(":w{enter}")

      waitForFormattingToHaveCompleted(nvim)

      nvim.runExCommand({ command: `1,3yank` })
      nvim.clipboard
        .system()
        .should("equal", [longSubject, " ", "- list", ""].join("\n"))
    })
  })

  it("preserves a long git trailer on a single line even when it exceeds the wrap width", () => {
    // With --print-width=72 --prose-wrap=always, prettier would split a
    // "Fixes: <long-url>" line at the space after "Fixes:", breaking
    // GitHub's closing-keyword linking. The conform integration extracts
    // the trailer block before prettier runs and re-appends it intact.
    const trailerUrl =
      "https://example.com/very-long-organization-name/some-repo/issues/12345-long-slug"
    const trailerLine = `Fixes: ${trailerUrl}`
    assert(trailerLine.length > 72)

    cy.visit("/")

    startNeovimWithPrettierd({
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
      cy.contains("main")

      cy.typeIntoTerminal("C") // commit
      nvim.waitForLuaCode({
        luaAssertion: `return vim.api.nvim_buf_get_name(0) == vim.fn.expand('%:h') .. '/.git/COMMIT_EDITMSG'`,
      })
      cy.contains("# Please enter the commit message for your changes.")

      // Set up: subject, blank, body, blank, trailer — inserted via
      // nvim_buf_set_lines so neovim's textwidth=72 auto-wrap doesn't split
      // the long trailer line as we construct the test message. We want to
      // test the prettier-wrap protection, not the typing-path wrap.
      nvim.runLuaCode({
        luaCode: `vim.api.nvim_buf_set_lines(0, 0, 0, false, { "test subject", "", "body text", "", ${JSON.stringify(trailerLine)} })`,
      })
      cy.typeIntoTerminal(":w{enter}")

      waitForFormattingToHaveCompleted(nvim)

      nvim.runExCommand({ command: `1,6yank` })
      nvim.clipboard
        .system()
        .should(
          "equal",
          ["test subject", "", "body text", "", trailerLine, "", ""].join("\n"),
        )
    })
  })

  it("preserves a trailer block of multiple consecutive trailers", () => {
    // Git trailer blocks can contain multiple lines (Fixes:, Signed-off-by:,
    // Co-authored-by:, etc.). The whole last paragraph should be protected
    // as a unit — every line must match the trailer pattern.
    const fixesLine =
      "Fixes: https://example.com/very-long-organization-name/some-repo/issues/12345-long-slug"
    const coauthorLine =
      "Co-authored-by: Alice Example <alice@very-long-organization-name.example.com>"
    assert(fixesLine.length > 72)
    assert(coauthorLine.length > 72)

    cy.visit("/")

    startNeovimWithPrettierd({
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
      cy.contains("main")

      cy.typeIntoTerminal("C") // commit
      nvim.waitForLuaCode({
        luaAssertion: `return vim.api.nvim_buf_get_name(0) == vim.fn.expand('%:h') .. '/.git/COMMIT_EDITMSG'`,
      })
      cy.contains("# Please enter the commit message for your changes.")

      nvim.runLuaCode({
        luaCode: `vim.api.nvim_buf_set_lines(0, 0, 0, false, { "test subject", "", "body text", "", ${JSON.stringify(fixesLine)}, ${JSON.stringify(coauthorLine)} })`,
      })
      cy.typeIntoTerminal(":w{enter}")

      waitForFormattingToHaveCompleted(nvim)

      nvim.runExCommand({ command: `1,7yank` })
      nvim.clipboard
        .system()
        .should(
          "equal",
          [
            "test subject",
            "",
            "body text",
            "",
            fixesLine,
            coauthorLine,
            "",
            "",
          ].join("\n"),
        )
    })
  })

  it("preserves a trailer that appears in the middle of the message (e.g. from a squashed commit)", () => {
    // When a commit is squashed from several smaller commits, each of which
    // had its own trailer, the resulting message can contain trailer lines
    // in the middle — not just at the end. Those middle trailers should
    // also survive prettier's prose wrap so GitHub's keyword linking works.
    const trailerLine =
      "Fixes: https://example.com/very-long-organization-name/some-repo/issues/12345-long-slug"
    assert(trailerLine.length > 72)

    cy.visit("/")

    startNeovimWithPrettierd({
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
      cy.contains("main")

      cy.typeIntoTerminal("C") // commit
      nvim.waitForLuaCode({
        luaAssertion: `return vim.api.nvim_buf_get_name(0) == vim.fn.expand('%:h') .. '/.git/COMMIT_EDITMSG'`,
      })
      cy.contains("# Please enter the commit message for your changes.")

      nvim.runLuaCode({
        luaCode: `vim.api.nvim_buf_set_lines(0, 0, 0, false, { "squash subject", "", "first sub-message body", "", ${JSON.stringify(trailerLine)}, "", "second sub-message body" })`,
      })

      // assert the current line of the cursor
      const expectedLine = "8" as const
      nvim
        .runExCommand({ command: "echo line('.')" })
        .should("eql", { value: expectedLine })

      cy.typeIntoTerminal(":w{enter}")

      waitForFormattingToHaveCompleted(nvim)

      nvim.runExCommand({ command: `1,8yank` })
      nvim.clipboard
        .system()
        .should(
          "equal",
          [
            "squash subject",
            "",
            "first sub-message body",
            "",
            trailerLine,
            "",
            "second sub-message body",
            "",
            "",
          ].join("\n"),
        )

      // the cursor must be on the same line as before formatting
      nvim
        .runExCommand({ command: "echo line('.')" })
        .should("eql", { value: expectedLine })
    })
  })

  it("preserves a fenced code block whose contents include lines starting with the git comment char", () => {
    // A fenced code block in the body can contain a line starting with
    // the git comment char (e.g. a shell comment `# foo` in a ```sh
    // block). A naive "first `#` line from the top is the start of git
    // instructions" scan would mistake it for the start of the
    // instructions and snip the buffer mid-fence — prettier then sees
    // an unclosed fence and auto-closes it, and the `#` line ends up
    // outside any fence, rendering as a markdown heading.
    const commitLines = [
      "subject",
      "",
      "```sh",
      "# comment inside fenced code block",
      "```",
    ]

    cy.visit("/")

    startNeovimWithPrettierd({
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
      cy.contains("main")

      cy.typeIntoTerminal("C") // commit
      nvim.waitForLuaCode({
        luaAssertion: `return vim.api.nvim_buf_get_name(0) == vim.fn.expand('%:h') .. '/.git/COMMIT_EDITMSG'`,
      })
      cy.contains("# Please enter the commit message for your changes.")

      const luaTable = commitLines.map((l) => JSON.stringify(l)).join(", ")
      nvim.runLuaCode({
        luaCode: `vim.api.nvim_buf_set_lines(0, 0, 0, false, { ${luaTable} })`,
      })
      cy.typeIntoTerminal(":w{enter}")

      waitForFormattingToHaveCompleted(nvim)

      nvim.runExCommand({ command: `1,${commitLines.length}yank` })
      nvim.clipboard.system().should("equal", [...commitLines, ""].join("\n"))
    })
  })
})
