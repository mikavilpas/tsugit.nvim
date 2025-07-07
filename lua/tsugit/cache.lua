local M = {}

---@module "snacks.terminal"

--- issue: The snacks terminal seems to have some issue that causes duplicate
--- lazygits to be opened
---
--- solution: Provides a cache for the lazygits that are known to tsugit. We
--- can use this to detect if a lazygit has already been opened, and avoiding
--- opening a new one if it has. This essentially duplicates the snacks
--- terminal's cache.
---@type table<string, snacks.terminal>
M.lazygit_cache = setmetatable({}, {
  -- `v` means weak values, which allows garbage collecting them when they have
  -- no other references, see :help lua-weaktable
  --
  -- `k` is the same thing but for keys
  __mode = "kv",
})

---@param key string
---@param lazygit unknown
function M.add_lazygit(key, lazygit)
  assert(
    not M.lazygit_cache[key],
    "tsugit.nvim: lazygit already exists for key: " .. key
  )
  M.lazygit_cache[key] = lazygit
  lazygit.tsugit_key = key
end

---@param key string
function M.delete_lazygit(key)
  M.lazygit_cache[key] = nil
end

return M
