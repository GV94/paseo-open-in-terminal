import type { PluginServerContext } from "@getpaseo/plugin/server";
import { installedTerminals, openTerminal } from "./server/terminals";
import { preferences } from "./shared/preferences";
import { installedTerminalsRpc, openTerminalRpc } from "./shared/rpc";

export default function contribute(server: PluginServerContext) {
  const settings = server.registerSettings(preferences);

  server.handle(openTerminalRpc, async ({ directory }) => {
    const current = await settings.read();
    // Stored settings that fail validation fall back to the defaults.
    const values = current.status === "ready" ? current.values : preferences.schema.parse({});
    return { terminal: await openTerminal(values.terminal, values.open, directory) };
  });
  server.handle(installedTerminalsRpc, () => ({ terminals: installedTerminals() }));

  return () => {};
}
