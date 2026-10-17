import { useQuery } from "@tanstack/react-query";
import { useRpc, useSettings, type PluginSurfaceProps } from "@getpaseo/plugin/client";
import { SettingsCard, SettingsRow, SettingsSection, SettingsSelect } from "@getpaseo/plugin/client/ui";
import { preferences } from "../shared/preferences";
import { installedTerminalsRpc } from "../shared/rpc";
import { TERMINAL_LABELS, WINDOW_ONLY, type TerminalId } from "../shared/terminals";

const OPEN_OPTIONS = [
  { label: "New tab", value: "tab" },
  { label: "New window", value: "window" },
] as const;

export function TerminalSettings(_props: PluginSurfaceProps) {
  const settings = useSettings(preferences);
  const listInstalled = useRpc(installedTerminalsRpc);
  const installed = useQuery({
    queryKey: ["installed-terminals"],
    queryFn: () => listInstalled({}),
  });

  if (settings.status !== "ready") {
    return (
      <SettingsSection title="Terminal">
        <SettingsCard>
          <SettingsRow
            label={settings.status === "loading" ? "Loading…" : "Settings unavailable"}
            error={"error" in settings ? settings.error : undefined}
          />
        </SettingsCard>
      </SettingsSection>
    );
  }

  const terminals = installed.data?.terminals ?? [];
  const autoLabel = terminals[0] ? `Automatic (${TERMINAL_LABELS[terminals[0]]})` : "Automatic";
  const terminalOptions = [
    { label: autoLabel, value: "auto" },
    ...terminals.map((id) => ({ label: TERMINAL_LABELS[id], value: id })),
  ];
  // Keep a saved choice visible even if that app has since been removed.
  if (settings.values.terminal !== "auto" && !terminals.includes(settings.values.terminal)) {
    const id = settings.values.terminal;
    terminalOptions.push({ label: `${TERMINAL_LABELS[id]} (not installed)`, value: id });
  }
  const effective: TerminalId | undefined =
    settings.values.terminal === "auto" ? terminals[0] : settings.values.terminal;

  return (
    <SettingsSection title="Terminal">
      <SettingsCard>
        <SettingsSelect
          label="Open workspaces in"
          hint={installed.isError ? "Could not list installed terminals" : undefined}
          value={settings.values.terminal}
          options={terminalOptions}
          disabled={settings.saving}
          onValueChange={(terminal) =>
            void settings.save(
              { ...settings.values, terminal: terminal as typeof settings.values.terminal },
              settings.revision,
            )
          }
        />
        <SettingsSelect
          label="Open as"
          hint={
            effective && WINDOW_ONLY.has(effective)
              ? `${TERMINAL_LABELS[effective]} always opens a new window`
              : undefined
          }
          value={settings.values.open}
          options={[...OPEN_OPTIONS]}
          disabled={settings.saving}
          onValueChange={(open) =>
            void settings.save({ ...settings.values, open: open as "tab" | "window" }, settings.revision)
          }
          error={settings.saveError}
        />
      </SettingsCard>
    </SettingsSection>
  );
}
