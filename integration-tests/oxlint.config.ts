import mikaConfig from "@mikavilpas/oxlint-config"
import { defineConfig } from "oxlint"

// oxlint-disable-next-line import/no-default-export
export default defineConfig({
  extends: [mikaConfig],
  jsPlugins: [
    // https://github.com/levibuzolic/eslint-plugin-no-only-tests#oxlint
    "eslint-plugin-no-only-tests",
  ],
  env: {
    builtin: true,
    es2026: true,
  },
  ignorePatterns: ["**/cypress.config.ts", "**/test-environment/", "dist/", "cypress/support/tui-sandbox.ts"],
  rules: {
    "no-only-tests/no-only-tests": "error",
  },
  overrides: [
    {
      files: ["integration-tests/cypress/e2e/utils/*.ts", "integration-tests/cypress/e2e/*.cy.ts"],
      rules: {
        "no-unused-expressions": "off",
        // cypress does not support the node: protocol
        "unicorn/prefer-node-protocol": "off",
      },
    },
    {
      files: ["cypress/e2e/blink-ripgrep/*.cy.ts"],
      // cypress knows how to import its own files
      rules: { "import/unambiguous": "allow" },
    },
  ],
})
