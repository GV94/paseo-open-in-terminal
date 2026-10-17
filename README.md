# Open in Terminal for Paseo

A [Paseo](https://paseo.sh) plugin that opens the current workspace or worktree in your terminal app on macOS. It adds a terminal button to each workspace header and an "Open in terminal" item to the Command Center (⌘K).

Supported terminals: iTerm2, Warp, Ghostty, WezTerm, kitty, Alacritty and Terminal. Pick one, and choose between new tab and new window, under Settings → Plugins → Open in Terminal. kitty, Alacritty and Terminal always open a window.

## Install

Plugins must be enabled under Settings → Plugins on the daemon. Then:

```bash
paseo plugin add git:GV94/paseo-open-in-terminal
```

Or paste `git:GV94/paseo-open-in-terminal` into Settings → Plugins → Plugin source.

## How each terminal is opened

| Terminal  | Method                                                                 |
| --------- | ---------------------------------------------------------------------- |
| iTerm2    | AppleScript: new tab or window with the default profile, then `cd`     |
| Warp      | `warp://action/new_tab?path=…` or `new_window`                         |
| Ghostty   | AppleScript (1.3+), falling back to `open -a Ghostty <dir>`            |
| WezTerm   | `wezterm cli spawn --cwd`, or `wezterm start --cwd` if it isn't running |
| kitty     | `kitty --single-instance --directory`                                  |
| Alacritty | `alacritty --working-directory`                                        |
| Terminal  | `open -a Terminal <dir>`                                               |

## Development

```bash
npm install
npm run typecheck
paseo plugin install "$PWD"
paseo plugin reload open-in-terminal
```

## License

MIT
