import { describe, expect, it } from "vitest";
import { createSession } from "../../src/application/create-session.js";
import {
  createMockAudio,
  createMockClock,
  createMockHotkeys,
  createMockLauncher,
  createMockSttSequence,
  createMockTimer,
  createMockTts,
  flushAsync,
  loadTestConfig,
} from "../../src/infra/mocks/test-ports.js";
import { MESSAGES } from "../../src/domain/messages.js";

describe("createSession PTT voice confirmation", () => {
  it("confirms via PTT-recorded sim after open_app prompt", async () => {
    const config = await loadTestConfig();
    const ports = {
      hotkeys: createMockHotkeys(),
      tts: createMockTts(),
      launcher: createMockLauncher(),
      audio: createMockAudio(),
      stt: createMockSttSequence(["abrir chrome", "sim"]),
      timer: createMockTimer(),
      clock: createMockClock(),
    };
    const session = createSession({ config, ...ports });

    session.start();

    ports.hotkeys.emit("ptt_down");
    ports.hotkeys.emit("ptt_up");
    await flushAsync();

    expect(session.getState()).toBe("awaiting_confirmation");
    expect(ports.tts.spoken).toContain(MESSAGES.confirmation("Chrome"));

    ports.hotkeys.emit("ptt_down");
    expect(session.getState()).toBe("recording_confirmation");

    ports.hotkeys.emit("ptt_up");
    await flushAsync();

    expect(session.getState()).toBe("idle");
    expect(ports.launcher.launched).toEqual(["chrome"]);
    expect(ports.tts.spoken).toContain(MESSAGES.success("Chrome"));
  });
});
