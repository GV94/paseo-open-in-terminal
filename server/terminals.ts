import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { execCommand } from "@getpaseo/plugin/server";
import { TERMINAL_IDS, type TerminalId } from "../shared/terminals";

type OpenMode = "tab" | "window";

const APP_NAMES: Record<TerminalId, string> = {
  iterm: "iTerm",
  warp: "Warp",
  ghostty: "Ghostty",
  wezterm: "WezTerm",
  kitty: "kitty",
  alacritty: "Alacritty",
  terminal: "Terminal",
};

const APP_DIRS = [
  "/Applications",
  join(homedir(), "Applications"),
  "/System/Applications/Utilities",
];

function appPath(id: TerminalId): string | undefined {
  return APP_DIRS.map((dir) => join(dir, `${APP_NAMES[id]}.app`)).find((path) => existsSync(path));
}

export function installedTerminals(): TerminalId[] {
  if (process.platform !== "darwin") return [];
  return TERMINAL_IDS.filter((id) => appPath(id) !== undefined);
}

// Paths reach AppleScript through argv, never through the script text.
function osascript(lines: string[], args: string[]) {
  return execCommand("osascript", [...lines.flatMap((line) => ["-e", line]), ...args]);
}

const ITERM_SCRIPT = [
  "on run argv",
  'tell application "iTerm"',
  "activate",
  'if item 2 of argv is "tab" and (count of windows) > 0 then',
  "tell current window to set t to (create tab with default profile)",
  "set s to current session of t",
  "else",
  "set w to (create window with default profile)",
  "set s to current session of w",
  "end if",
  'tell s to write text "cd " & quoted form of (item 1 of argv) & " && clear"',
  "end tell",
  "end run",
];

// Needs Ghostty 1.3 or later, which added AppleScript.
const GHOSTTY_SCRIPT = [
  "on run argv",
  'tell application "Ghostty"',
  "activate",
  "set cfg to new surface configuration",
  "set initial working directory of cfg to item 1 of argv",
  'if item 2 of argv is "tab" and (count of windows) > 0 then',
  "new tab in front window with configuration cfg",
  "else",
  "new window with configuration cfg",
  "end if",
  "end tell",
  "end run",
];

const LAUNCHERS: Record<TerminalId, (directory: string, mode: OpenMode) => Promise<unknown>> = {
  async iterm(directory, mode) {
    await osascript(ITERM_SCRIPT, [directory, mode]);
  },
  async warp(directory, mode) {
    const action = mode === "tab" ? "new_tab" : "new_window";
    await execCommand("open", [`warp://action/${action}?path=${encodeURIComponent(directory)}`]);
  },
  async ghostty(directory, mode) {
    try {
      await osascript(GHOSTTY_SCRIPT, [directory, mode]);
    } catch {
      // Older Ghostty: opening a folder with the app gives a new tab there.
      await execCommand("open", ["-a", appPath("ghostty")!, directory]);
    }
  },
  async wezterm(directory, mode) {
    const app = appPath("wezterm")!;
    const cli = join(app, "Contents/MacOS/wezterm");
    const spawnArgs = ["cli", "spawn", ...(mode === "window" ? ["--new-window"] : []), "--cwd", directory];
    try {
      // Only succeeds when a WezTerm window is already running.
      await execCommand(cli, spawnArgs, { timeout: 5000 });
      await execCommand("open", ["-a", app]);
    } catch {
      await execCommand("open", ["-na", app, "--args", "start", "--cwd", directory]);
    }
  },
  async kitty(directory) {
    await execCommand("open", ["-na", appPath("kitty")!, "--args", "--single-instance", "--directory", directory]);
  },
  async alacritty(directory) {
    await execCommand("open", ["-na", appPath("alacritty")!, "--args", "--working-directory", directory]);
  },
  async terminal(directory) {
    await execCommand("open", ["-a", appPath("terminal")!, directory]);
  },
};

export async function openTerminal(
  choice: TerminalId | "auto",
  mode: OpenMode,
  directory: string,
): Promise<TerminalId> {
  if (process.platform !== "darwin") throw new Error("Open in Terminal only supports macOS");
  if (!directory.startsWith("/")) throw new Error(`Not an absolute path: ${directory}`);
  const installed = installedTerminals();
  const terminal = choice === "auto" ? installed[0] : choice;
  if (!terminal || !installed.includes(terminal)) {
    throw new Error(`${choice === "auto" ? "No supported terminal" : APP_NAMES[choice]} is not installed`);
  }
  await LAUNCHERS[terminal](directory, mode);
  return terminal;
}
