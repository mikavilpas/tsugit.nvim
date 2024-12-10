local assert = require("luassert")
local stub = require("luassert.stub")
local keymaps = require("tsugit.keymaps")
local match = require("luassert.match")

---@module "snacks.win"

describe("create_keymaps", function()
  local snapshot
  local vim_keymap_set_stub

  ---@type snacks.win
  ---@diagnostic disable-next-line: missing-fields
  local fake_win = {}

  before_each(function()
    snapshot = assert:snapshot()
    vim_keymap_set_stub = stub(vim.keymap, "set")
  end)

  after_each(function()
    snapshot:revert()
  end)

  it(
    "does not create any keymaps if the user has disabled all of them",
    function()
      -- the user can opt out of automatically creating keymaps by setting the
      -- config setting for them to `false`
      keymaps.create_keymaps({ keys = false }, fake_win)

      assert.stub(vim_keymap_set_stub).not_called_with()
    end
  )

  describe("the toggle key", function()
    it("maps the toggle key", function()
      keymaps.create_keymaps({ keys = { toggle = "<right>" } }, fake_win)

      assert
        .stub(vim_keymap_set_stub).was
        .called_with(match.is_table(), "<right>", match.is_function(), match.is_table())
    end)

    it("allows disabling the toggle key", function()
      keymaps.create_keymaps({ keys = { toggle = false } }, fake_win)

      assert
        .stub(vim_keymap_set_stub).was
        .not_called_with(match.is_table(), "<right>", match.is_function(), match.is_table())
    end)
  end)

  describe("the force_quit key", function()
    it("maps the force_quit key", function()
      keymaps.create_keymaps({ keys = { force_quit = "<left>" } }, fake_win)

      assert
        .stub(vim_keymap_set_stub).was
        .called_with(match.is_table(), "<left>", match.is_function(), match.is_table())
    end)

    it("allows disabling the force_quit key", function()
      keymaps.create_keymaps({ keys = { force_quit = false } }, fake_win)

      assert
        .stub(vim_keymap_set_stub).was
        .not_called_with(match.is_table(), "<left>", match.is_function(), match.is_table())
    end)
  end)
end)
