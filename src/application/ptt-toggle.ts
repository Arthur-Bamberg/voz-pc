import type { HotkeyEvent } from "../domain/ports.js";
import type { SessionState } from "../domain/fsm.js";

export type PttToggleDeps = {
  getState: () => SessionState;
  emit: (event: HotkeyEvent) => void;
};

export function createPttToggle(deps: PttToggleDeps): () => void {
  return () => {
    const state = deps.getState();
    if (state === "idle" || state === "awaiting_confirmation") {
      deps.emit("ptt_down");
      return;
    }
    if (state === "recording" || state === "recording_confirmation") {
      deps.emit("ptt_up");
    }
  };
}
