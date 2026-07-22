import { describe, expect, it } from "vitest";
import { createSession } from "../../src/session/create-session.js";
import {
  createTestPorts,
  flushAsync,
  loadTestConfig,
} from "../../adapters/mocks/test-ports.js";
import { MESSAGES } from "../../src/domain/messages.js";

describe("createSession happy path", () => {
  it("completes open_app flow with voice confirmation", async () => {
    const config = await loadTestConfig();
    const ports = createTestPorts("abrir chrome");
    const session = createSession({ config, ...ports });

    session.start();
    ports.hotkeys.emit("ptt_down");
    ports.hotkeys.emit("ptt_up");
    await flushAsync();

    expect(session.getState()).toBe("awaiting_confirmation");
    expect(ports.tts.spoken).toContain(MESSAGES.confirmation("Chrome"));

    await session.handleTranscript("sim");

    expect(session.getState()).toBe("idle");
    expect(ports.launcher.launched).toEqual(["chrome"]);
    expect(ports.tts.spoken).toContain(MESSAGES.success("Chrome"));
  });

  it("completes open_app flow with Enter hotkey", async () => {
    const config = await loadTestConfig();
    const ports = createTestPorts("abrir firefox");
    const session = createSession({ config, ...ports });

    session.start();
    ports.hotkeys.emit("ptt_down");
    ports.hotkeys.emit("ptt_up");
    await flushAsync();

    expect(session.getState()).toBe("awaiting_confirmation");
    ports.hotkeys.emit("confirm");
    await flushAsync();

    expect(session.getState()).toBe("idle");
    expect(ports.launcher.launched).toEqual(["firefox"]);
    expect(ports.tts.spoken).toContain(MESSAGES.success("Firefox"));
  });
});
