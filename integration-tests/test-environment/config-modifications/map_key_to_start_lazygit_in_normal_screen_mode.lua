vim.keymap.set("n", "<leader>lF", function()
  local current_file_path = vim.api.nvim_buf_get_name(0)

  require("tsugit").toggle_for_file(
    current_file_path,
    {},
    { "--screen-mode", "normal" }
  )
end)
