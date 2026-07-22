import { describe, expect, it } from "vitest";
import { createWhisperStt } from "../../adapters/shared/stt-whisper.js";
import { createPiperTts } from "../../adapters/shared/tts-piper.js";

describe("sidecar stubs", () => {
  it("whisper STT stub throws not wired", async () => {
    const stt = createWhisperStt();
    await expect(stt.transcribe(new Uint8Array())).rejects.toThrow(/not wired/i);
  });

  it("piper TTS stub throws not wired", async () => {
    const tts = createPiperTts();
    await expect(tts.speak("teste")).rejects.toThrow(/not wired/i);
  });
});
