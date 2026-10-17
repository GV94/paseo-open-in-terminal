import { defineRpc } from "@getpaseo/plugin";
import { z } from "zod";
import { TERMINAL_IDS } from "./terminals";

export const openTerminalRpc = defineRpc({
  name: "terminal.open",
  input: z.object({ directory: z.string().min(1) }),
  output: z.object({ terminal: z.enum(TERMINAL_IDS) }),
});

export const installedTerminalsRpc = defineRpc({
  name: "terminal.installed",
  input: z.object({}),
  output: z.object({ terminals: z.array(z.enum(TERMINAL_IDS)) }),
});
