# Changelog

## [7.1.3](https://github.com/mikavilpas/tsugit.nvim/compare/v7.1.2...v7.1.3) (2025-11-08)


### Bug Fixes

* formatting in-progress commit messages weirdly ([#414](https://github.com/mikavilpas/tsugit.nvim/issues/414)) ([33b5cc4](https://github.com/mikavilpas/tsugit.nvim/commit/33b5cc4b6ace95390179b198692df00c28e7496e))

## [7.1.2](https://github.com/mikavilpas/tsugit.nvim/compare/v7.1.1...v7.1.2) (2025-11-07)


### Bug Fixes

* conform integration should not wrap long commit subjects ([#412](https://github.com/mikavilpas/tsugit.nvim/issues/412)) ([84b9d4e](https://github.com/mikavilpas/tsugit.nvim/commit/84b9d4ebcf189df2ea4d4cb2d36f71a71ddf487a))
* only lock snacks.nvim and flatten.nvim versions in tests ([#409](https://github.com/mikavilpas/tsugit.nvim/issues/409)) ([e79fa54](https://github.com/mikavilpas/tsugit.nvim/commit/e79fa54fa029906bd6140a38895d29dbc14ab170))

## [7.1.1](https://github.com/mikavilpas/tsugit.nvim/compare/v7.1.0...v7.1.1) (2025-10-18)


### Bug Fixes

* force_quit not working and showing an error ([#379](https://github.com/mikavilpas/tsugit.nvim/issues/379)) ([f811663](https://github.com/mikavilpas/tsugit.nvim/commit/f811663a60a7aa85b75e2bb2327e1f17482c6ad3))

## [7.1.0](https://github.com/mikavilpas/tsugit.nvim/compare/v7.0.0...v7.1.0) (2025-10-04)


### Features

* allow toggle_for_file to accept additional lazygit args ([#359](https://github.com/mikavilpas/tsugit.nvim/issues/359)) ([c35e39a](https://github.com/mikavilpas/tsugit.nvim/commit/c35e39afcdf4923ce1124f214f9f345f3afcddad))

## [7.0.0](https://github.com/mikavilpas/tsugit.nvim/compare/v6.4.1...v7.0.0) (2025-09-03)


### ⚠ BREAKING CHANGES

* don't warm up the next lazygit for a single file path ([#51](https://github.com/mikavilpas/tsugit.nvim/issues/51))

### Features

* add a keybinding to open lazygit for the current file ([#46](https://github.com/mikavilpas/tsugit.nvim/issues/46)) ([2ab3c04](https://github.com/mikavilpas/tsugit.nvim/commit/2ab3c0401e0466e53c9bf4f77aacaf33b31c5799))
* add issue reproduction script ([#147](https://github.com/mikavilpas/tsugit.nvim/issues/147)) ([6715fbb](https://github.com/mikavilpas/tsugit.nvim/commit/6715fbb5aeb3ccdea1258eca99eaaaeaaa0fe0c5))
* allow configuring the toggle key ([#48](https://github.com/mikavilpas/tsugit.nvim/issues/48)) ([4c25d43](https://github.com/mikavilpas/tsugit.nvim/commit/4c25d43bf25f08fdcbafd0d207868ec72e9241ac))
* allow disabling all/some automatically created keys ([c5af7e5](https://github.com/mikavilpas/tsugit.nvim/commit/c5af7e581341bf575ba29414997c7bfd98dc1571))
* allow toggle_for_file() to use the current buffer's file path ([0524d39](https://github.com/mikavilpas/tsugit.nvim/commit/0524d39c28e64e3cbbd2204e0acfbe812ee32f72))
* can force quit lazygit ([3a70bed](https://github.com/mikavilpas/tsugit.nvim/commit/3a70bed63c967fee9d95d3dc1f293575c7c39dbd))
* can toggle and close lazygit ([#28](https://github.com/mikavilpas/tsugit.nvim/issues/28)) ([ea0ee82](https://github.com/mikavilpas/tsugit.nvim/commit/ea0ee824d652ea097a67906f5903339906dd469b))
* can write lazygit commit messages in neovim with flatten.nvim ([#36](https://github.com/mikavilpas/tsugit.nvim/issues/36)) ([352c2bd](https://github.com/mikavilpas/tsugit.nvim/commit/352c2bda37a1e40b00d7c0235f85221f198526d4))
* format COMMIT_EDITMSG files as markdown with conform.nvim ([ec70e19](https://github.com/mikavilpas/tsugit.nvim/commit/ec70e19ca7fc5a450aa6806c531ac900a8d3d4ac))
* open lazygit when COMMIT_EDITMSG is closed ([#30](https://github.com/mikavilpas/tsugit.nvim/issues/30)) ([a97fc05](https://github.com/mikavilpas/tsugit.nvim/commit/a97fc058e1d56358fd7665e44c362befa582f89b))
* support git worktrees ([afa2959](https://github.com/mikavilpas/tsugit.nvim/commit/afa2959a90b0fbee7b0a95bdc2f3b4302924dedd))


### Bug Fixes

* close all lazygit windows when opening a new one ([993dbb3](https://github.com/mikavilpas/tsugit.nvim/commit/993dbb3cefbc8a786a476eb27653f82228bee668))
* closing lazygit when any neovim `TermClose` event fires ([0f52e3f](https://github.com/mikavilpas/tsugit.nvim/commit/0f52e3f67602b077ce6146d2bfeb926772b0a7b9))
* displaying a blank lazygit after the second commit ([#80](https://github.com/mikavilpas/tsugit.nvim/issues/80)) ([55144b2](https://github.com/mikavilpas/tsugit.nvim/commit/55144b2defa21aa421247730ba043ef42870cfae))
* displaying an empty lazygit after `force_quit` ([9614686](https://github.com/mikavilpas/tsugit.nvim/commit/96146864a0b24abf067e141300ffadede89a04fa))
* flickering of the screen when closing with the force_quit key ([#95](https://github.com/mikavilpas/tsugit.nvim/issues/95)) ([d740d75](https://github.com/mikavilpas/tsugit.nvim/commit/d740d75690c4fc505859ae5a7b94ea6443032faa))
* forgetting term_opts in warming up the next instance ([8b506f4](https://github.com/mikavilpas/tsugit.nvim/commit/8b506f474499c243de0e3d518cd1a61bea78a5ed))
* hanging neovim on quit ([036b48e](https://github.com/mikavilpas/tsugit.nvim/commit/036b48eb9f5ce456473839a4394ab5e0bb9fd8f7))
* make sure lazygit is closed when a file is opened behind it ([2d989cc](https://github.com/mikavilpas/tsugit.nvim/commit/2d989cc9dd68bc8db44eaf49e6d9581b94e1ebe9))
* not automatically restarting lazygit after `force_quit` ([444553b](https://github.com/mikavilpas/tsugit.nvim/commit/444553b0eee004ecda0c4ab2801faebe57a78a4f))
* not warming up the next instance of lazygit ([#143](https://github.com/mikavilpas/tsugit.nvim/issues/143)) ([6d514f5](https://github.com/mikavilpas/tsugit.nvim/commit/6d514f56313d7886ea9699d844a4e77a252d0a9f))
* only being able to hide lazygit once ([728d263](https://github.com/mikavilpas/tsugit.nvim/commit/728d263c83e542d17f263ccb2edeb1436a618b31))
* plugin cache miss for some existing lazygits ([#227](https://github.com/mikavilpas/tsugit.nvim/issues/227)) ([59444c0](https://github.com/mikavilpas/tsugit.nvim/commit/59444c0a2670dd0437a974c29b2b07f6b7b57fc8))
* possibly reopening file history lazygit 999 times ([ebc4822](https://github.com/mikavilpas/tsugit.nvim/commit/ebc4822f9787ee64e67a7b184d9c0c78bf4dc5f7))
* snacks not closing anymore due to new changes ([#112](https://github.com/mikavilpas/tsugit.nvim/issues/112)) ([20e1352](https://github.com/mikavilpas/tsugit.nvim/commit/20e1352654df8ce5ba921d7f80768ac0d979fdfa))
* sometimes focusing on the wrong split after closing lazygit ([1be4abb](https://github.com/mikavilpas/tsugit.nvim/commit/1be4abb08957cd6aad9d3172002e8dfee1615618))
* starting duplicate lazygits ([e0ab30b](https://github.com/mikavilpas/tsugit.nvim/commit/e0ab30b7c733dd4e8e572c98670effdea8a83696))


### Performance Improvements

* don't warm up the next lazygit for a single file path ([#51](https://github.com/mikavilpas/tsugit.nvim/issues/51)) ([d8d2136](https://github.com/mikavilpas/tsugit.nvim/commit/d8d213636e921b6a0fbc0b9713ffcd9955122005))
* only hide lazygit on WinLeave once ([#74](https://github.com/mikavilpas/tsugit.nvim/issues/74)) ([4decc8b](https://github.com/mikavilpas/tsugit.nvim/commit/4decc8b10c3d68cdd2a4bf77d6f732d2b175a5c4))
* **tests:** massively speed up lazygit test by not using cy.exec() ([#31](https://github.com/mikavilpas/tsugit.nvim/issues/31)) ([0442824](https://github.com/mikavilpas/tsugit.nvim/commit/0442824fac0ce7ba514c4dbe8cef384472443d0c))

## Changelog
