import type { TtsPort } from "../../src/ports/index.js";

const NOT_WIRED = "Piper TTS sidecar not wired — use mocked TtsPort in tests";

export function createPiperTts(): TtsPort {
  return {
    async speak() {
      throw new Error(NOT_WIRED);
    },
  };
}
