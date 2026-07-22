import type { SttPort } from "../../src/ports/index.js";

const NOT_WIRED = "Whisper STT sidecar not wired — use mocked SttPort in tests";

export function createWhisperStt(): SttPort {
  return {
    async transcribe() {
      throw new Error(NOT_WIRED);
    },
  };
}
