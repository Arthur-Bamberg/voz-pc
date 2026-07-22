import { describe, expect, it } from "vitest";
import { createSession } from "../src/session/create-session.js";
import {
  createTestPorts,
  flushAsync,
  loadTestConfig,
} from "../adapters/mocks/test-ports.js";
import { MESSAGES } from "../src/domain/messages.js";

describe("e2e happy path", () => {
  it("runs full voice flow with mocked ports", async () => {
    const config = await loadTestConfig();
    const ports = createTestPorts("abrir calculadora");
    const session = createSession({ config, ...ports });

    session.start();

    // PTT press and release
    ports.hotkeys.emit("ptt_down");
    expect(session.getState()).toBe("recording");

    ports.hotkeys.emit("ptt_up");
    await flushAsync();

    expect(session.getState()).toBe("awaiting_confirmation");
    expect(ports.tts.spoken).toEqual([MESSAGES.confirmation("Calculadora")]);
    expect(ports.launcher.launched).toEqual([]);

    // Confirm with Enter
    ports.hotkeys.emit("confirm");
    await flushAsync();

    expect(session.getState()).toBe("idle");
    expect(ports.launcher.launched).toEqual(["calculator"]);
    expect(ports.tts.spoken).toEqual([
      MESSAGES.confirmation("Calculadora"),
      MESSAGES.success("Calculadora"),
    ]);

    session.stop();
  });
});
