import type { PluginButtonRegistration, PluginClientContext } from "@getpaseo/plugin/client";
import { TerminalSettings } from "./client/settings";
import { openTerminalRpc } from "./shared/rpc";

export default function contribute(client: PluginClientContext) {
  client.addSettingsScreen({
    id: "terminal",
    title: "Terminal",
    icon: "SquareTerminal",
    Component: TerminalSettings,
  });
  client.addCommandCenterItem({
    id: "open-in-terminal",
    title: "Open in terminal",
    icon: "SquareTerminal",
    keywords: ["terminal", "worktree", "iterm", "warp", "ghostty", "wezterm", "kitty", "alacritty"],
    context: "workspace",
    async onSelect({ rpc, workspace }) {
      await rpc(openTerminalRpc, { directory: workspace.directory });
    },
  });
  client.addCommandCenterItem({
    id: "settings",
    title: "Open in terminal: choose terminal",
    icon: "Settings",
    context: "global",
    onSelect({ openSettings }) {
      openSettings("terminal");
    },
  });

  // One header button per workspace, kept in sync with the workspace directory.
  const buttons = new Map<string, PluginButtonRegistration>();
  let release: (() => Promise<void>) | undefined;
  let stopped = false;

  const register = (workspaceId: string, directory: string | undefined) => {
    if (stopped) return;
    buttons.get(workspaceId)?.remove();
    buttons.delete(workspaceId);
    if (!directory) return;
    buttons.set(
      workspaceId,
      client.addHeaderButton({
        id: "open-in-terminal",
        workspaceId,
        button: {
          title: "Open in terminal",
          icon: "SquareTerminal",
          behavior: {
            kind: "action",
            async onPress() {
              await client.rpc(openTerminalRpc, { directory });
            },
          },
        },
      }),
    );
  };
  const clear = () => {
    for (const button of buttons.values()) button.remove();
    buttons.clear();
  };

  void client.paseo.workspaces
    .list({ subscribe: {} })
    .then(({ subscription }) => {
      release = () => subscription.release();
      if (stopped) return release();
      subscription.subscribe({
        snapshot: ({ entries }) => {
          clear();
          for (const workspace of entries) register(workspace.id, workspace.workspaceDirectory);
        },
        update: (message) => {
          if (message.type !== "workspace_update") return;
          const update = message.payload;
          if (update.kind === "remove") register(update.id, undefined);
          else register(update.workspace.id, update.workspace.workspaceDirectory);
        },
      });
      return undefined;
    })
    // Without the subscription only the header buttons are missing; ⌘K still works.
    .catch(() => undefined);

  return () => {
    stopped = true;
    void release?.();
    clear();
  };
}
