import { describe, expect, it } from "vitest";
import { createSession } from "../../src/session/create-session.js";
import {
  createMockAudio,
  createMockClock,
  createMockHotkeys,
  createMockStt,
  createMockTimer,
  createMockTts,
  flushAsync,
  loadTestConfig,
} from "../../adapters/mocks/test-ports.js";
import { MESSAGES } from "../../src/domain/messages.js";
import type { AppLauncherPort } from "../../src/ports/index.js";

describe("createSession launch failure", () => {
  it("speaks launchFailed when launcher returns not ok", async () => {
    const config = await loadTestConfig();
    const launcher: AppLauncherPort = {
      async launch() {
        return { ok: false, error: "spawn failed" };
      },
    };
    const ports = {
      hotkeys: createMockHotkeys(),
      tts: createMockTts(),
      launcher,
      audio: createMockAudio(),
      stt: createMockStt("abrir chrome"),
      timer: createMockTimer(),
      clock: createMockClock(),
    };
    const session = createSession({ config, ...ports });

    session.start();
    ports.hotkeys.emit("ptt_down");
    ports.hotkeys.emit("ptt_up");
    await flushAsync();
    ports.hotkeys.emit("confirm");
    await flushAsync();

    expect(ports.tts.spoken).toContain(MESSAGES.launchFailed("Chrome"));
    expect(session.getState()).toBe("idle");
  });
});
