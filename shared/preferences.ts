import { defineSettings } from "@getpaseo/plugin";
import { z } from "zod";
import { TERMINAL_IDS } from "./terminals";

export const preferences = defineSettings({
  id: "terminal",
  scope: "host",
  version: 1,
  schema: z.object({
    // "auto" picks the first installed terminal in TERMINAL_IDS order.
    terminal: z.enum(["auto", ...TERMINAL_IDS]).default("auto"),
    open: z.enum(["tab", "window"]).default("tab"),
  }),
});
