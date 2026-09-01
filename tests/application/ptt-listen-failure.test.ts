import { describe, expect, it } from "vitest";
import { createSession } from "../../src/application/create-session.js";
import {
  createMockAudio,
  createMockClock,
  createMockHotkeys,
  createMockLauncher,
  createMockStt,
  createMockTimer,
  createMockTts,
  flushAsync,
  loadTestConfig,
} from "../../src/infra/mocks/test-ports.js";
import { MESSAGES } from "../../src/domain/messages.js";
import type { AudioCapturePort, SttPort } from "../../src/domain/ports.js";

describe("createSession listen failure", () => {
  it("returns to idle and speaks unknown when STT throws after PTT", async () => {
    const config = await loadTestConfig();
    const stt: SttPort = {
      async transcribe() {
        throw new Error("whisper-cli failed");
      },
    };
    const ports = {
      hotkeys: createMockHotkeys(),
      tts: createMockTts(),
      launcher: createMockLauncher(),
      audio: createMockAudio(),
      stt,
      timer: createMockTimer(),
      clock: createMockClock(),
    };
    const session = createSession({ config, ...ports });

    session.start();
    ports.hotkeys.emit("ptt_down");
    ports.hotkeys.emit("ptt_up");
    await flushAsync();

    expect(session.getState()).toBe("idle");
    expect(ports.tts.spoken).toEqual([MESSAGES.unknown]);
    expect(ports.launcher.launched).toEqual([]);
  });

  it("returns to idle and speaks unknown when capture fails to start", async () => {
    const config = await loadTestConfig();
    const audio: AudioCapturePort = {
      async start() {
        throw new Error("pw-record failed");
      },
      async stop() {
        return new Uint8Array();
      },
    };
    const ports = {
      hotkeys: createMockHotkeys(),
      tts: createMockTts(),
      launcher: createMockLauncher(),
      audio,
      stt: createMockStt("abrir calculadora"),
      timer: createMockTimer(),
      clock: createMockClock(),
    };
    const session = createSession({ config, ...ports });

    session.start();
    ports.hotkeys.emit("ptt_down");
    await flushAsync();

    expect(session.getState()).toBe("idle");
    expect(ports.tts.spoken).toEqual([MESSAGES.unknown]);
  });

  it("returns to idle and speaks unknown when STT throws during confirmation PTT", async () => {
    const config = await loadTestConfig();
    let calls = 0;
    const stt: SttPort = {
      async transcribe() {
        calls += 1;
        if (calls === 1) return "abrir calculadora";
        throw new Error("whisper-cli failed");
      },
    };
    const ports = {
      hotkeys: createMockHotkeys(),
      tts: createMockTts(),
      launcher: createMockLauncher(),
      audio: createMockAudio(),
      stt,
      timer: createMockTimer(),
      clock: createMockClock(),
    };
    const session = createSession({ config, ...ports });

    session.start();
    ports.hotkeys.emit("ptt_down");
    ports.hotkeys.emit("ptt_up");
    await flushAsync();
    expect(session.getState()).toBe("awaiting_confirmation");

    ports.hotkeys.emit("ptt_down");
    ports.hotkeys.emit("ptt_up");
    await flushAsync();

    expect(session.getState()).toBe("idle");
    expect(ports.tts.spoken).toEqual([
      MESSAGES.confirmation("Calculadora"),
      MESSAGES.unknown,
    ]);
    expect(ports.launcher.launched).toEqual([]);
  });
});
