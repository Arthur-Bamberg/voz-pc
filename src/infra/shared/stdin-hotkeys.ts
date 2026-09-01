import type { Readable } from "node:stream";
import type { HotkeyBus } from "./hotkey-bus.js";

export type StdinHotkeyOptions = {
  togglePtt: () => void;
  onQuit?: () => void;
};

export function attachStdinHotkeys(
  bus: HotkeyBus,
  input: Readable,
  options: StdinHotkeyOptions,
): () => void {
  const onData = (chunk: Buffer | string) => {
    const text = typeof chunk === "string" ? chunk : chunk.toString("utf8");
    for (const char of text) {
      if (char === " ") {
        options.togglePtt();
      } else if (char === "\r" || char === "\n") {
        bus.emit("confirm");
      } else if (char === "\x1b") {
        bus.emit("cancel");
      } else if (char === "q" || char === "Q" || char === "\x03") {
        options.onQuit?.();
      }
    }
  };

  input.on("data", onData);
  return () => {
    input.off("data", onData);
  };
}
