import { describe, expect, it } from "vitest";
import { createSession } from "../../src/application/create-session.js";
import {
  createMockAudio,
  createMockClock,
  createMockHotkeys,
  createMockLauncher,
  createMockStt,
  createMockSttSequence,
  createMockTimer,
  createMockTts,
  flushAsync,
  loadTestConfig,
} from "../../src/infra/mocks/test-ports.js";
import type { SttPort, VoiceCommand } from "../../src/domain/ports.js";
import type { SessionDeps } from "../../src/application/create-session.js";

async function startEchoSession(stt: SttPort) {
  const config = await loadTestConfig();
  const observed: VoiceCommand[] = [];
  const hotkeys = createMockHotkeys();
  const deps: SessionDeps = {
    config,
    hotkeys,
    tts: createMockTts(),
    launcher: createMockLauncher(),
    audio: createMockAudio(),
    stt,
    timer: createMockTimer(),
    clock: createMockClock(),
    voiceCommandObserver: {
      observe(command) {
        observed.push(command);
      },
    },
  };
  const session = createSession(deps);
  session.start();
  return { session, hotkeys, observed };
}

async function ptt(hotkeys: ReturnType<typeof createMockHotkeys>) {
  hotkeys.emit("ptt_down");
  hotkeys.emit("ptt_up");
  await flushAsync();
}

describe("createSession voice command echo", () => {
  it("observes the open-app voice command after PTT", async () => {
    const { hotkeys, observed } = await startEchoSession(createMockStt("abrir chrome"));

    await ptt(hotkeys);

    expect(observed).toEqual([{ text: "abrir chrome", role: "open" }]);
  });

  it("observes the voice command even when the intent is unknown", async () => {
    const { hotkeys, observed } = await startEchoSession(createMockStt("tocar música"));

    await ptt(hotkeys);

    expect(observed).toEqual([{ text: "tocar música", role: "open" }]);
  });

  it("observes the confirmation voice command after confirmation PTT", async () => {
    const { hotkeys, observed } = await startEchoSession(
      createMockSttSequence(["abrir chrome", "sim"]),
    );

    await ptt(hotkeys);
    await ptt(hotkeys);

    expect(observed).toEqual([
      { text: "abrir chrome", role: "open" },
      { text: "sim", role: "confirmation" },
    ]);
  });

  it("observes an empty voice command after silent PTT", async () => {
    const { hotkeys, observed } = await startEchoSession(createMockStt(""));

    await ptt(hotkeys);

    expect(observed).toEqual([{ text: "", role: "open" }]);
  });

  it("does not invent a voice command when STT fails", async () => {
    const stt: SttPort = {
      async transcribe() {
        throw new Error("whisper-cli failed");
      },
    };
    const { hotkeys, observed } = await startEchoSession(stt);

    await ptt(hotkeys);

    expect(observed).toEqual([]);
  });

  it("does not invent a voice command when confirming with Enter", async () => {
    const { session, hotkeys, observed } = await startEchoSession(createMockStt("abrir chrome"));

    await ptt(hotkeys);
    hotkeys.emit("confirm");
    await flushAsync();

    expect(session.getState()).toBe("idle");
    expect(observed).toEqual([{ text: "abrir chrome", role: "open" }]);
  });

  it("observes an injected confirmation voice command", async () => {
    const { session, hotkeys, observed } = await startEchoSession(createMockStt("abrir chrome"));

    await ptt(hotkeys);
    await session.handleTranscript("não");

    expect(observed).toEqual([
      { text: "abrir chrome", role: "open" },
      { text: "não", role: "confirmation" },
    ]);
  });
});
