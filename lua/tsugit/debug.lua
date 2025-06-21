local M = {}

--- Variant of vim.notify that does not display the messages to the user until
--- they execute `:messages`. Displaying the messages might disturb the user or
--- interfere with tests.
---@param message string
function M.add_debug_message(message)
  vim.api.nvim_exec2(string.format("echomsg '%s'", message), {})
end

return M
