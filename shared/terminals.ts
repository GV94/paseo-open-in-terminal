export const TERMINAL_IDS = [
  "iterm",
  "warp",
  "ghostty",
  "wezterm",
  "kitty",
  "alacritty",
  "terminal",
] as const;

export type TerminalId = (typeof TERMINAL_IDS)[number];

export const TERMINAL_LABELS: Record<TerminalId, string> = {
  iterm: "iTerm2",
  warp: "Warp",
  ghostty: "Ghostty",
  wezterm: "WezTerm",
  kitty: "kitty",
  alacritty: "Alacritty",
  terminal: "Terminal",
};

// These have no tab API that works without extra setup, so they always open a window.
export const WINDOW_ONLY: ReadonlySet<TerminalId> = new Set(["kitty", "alacritty", "terminal"]);
