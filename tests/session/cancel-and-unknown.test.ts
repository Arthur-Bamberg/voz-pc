import { describe, expect, it } from "vitest";
import { createSession } from "../../src/session/create-session.js";
import {
  createTestPorts,
  flushAsync,
  loadTestConfig,
} from "../../adapters/mocks/test-ports.js";
import { MESSAGES } from "../../src/domain/messages.js";

async function startOpenAppFlow(transcript: string) {
  const config = await loadTestConfig();
  const ports = createTestPorts(transcript);
  const session = createSession({ config, ...ports });
  session.start();
  ports.hotkeys.emit("ptt_down");
  ports.hotkeys.emit("ptt_up");
  await flushAsync();
  return { config, ports, session };
}

describe("createSession cancel paths", () => {
  it("cancels with voice 'não'", async () => {
    const { ports, session } = await startOpenAppFlow("abrir chrome");

    expect(session.getState()).toBe("awaiting_confirmation");
    await session.handleTranscript("não");

    expect(session.getState()).toBe("idle");
    expect(ports.launcher.launched).toEqual([]);
    expect(ports.tts.spoken).toContain(MESSAGES.cancelled);
  });

  it("cancels with Esc hotkey", async () => {
    const { ports, session } = await startOpenAppFlow("abrir chrome");

    ports.hotkeys.emit("cancel");
    await flushAsync();

    expect(session.getState()).toBe("idle");
    expect(ports.launcher.launched).toEqual([]);
    expect(ports.tts.spoken).toContain(MESSAGES.cancelled);
  });

  it("cancels after confirmation timeout", async () => {
    const { ports, session } = await startOpenAppFlow("abrir chrome");

    await ports.timer.advance(30000);

    expect(session.getState()).toBe("idle");
    expect(ports.launcher.launched).toEqual([]);
    expect(ports.tts.spoken).toContain(MESSAGES.cancelled);
  });

  it("ignores Esc outside awaiting confirmation", async () => {
    const config = await loadTestConfig();
    const ports = createTestPorts("abrir chrome");
    const session = createSession({ config, ...ports });
    session.start();

    ports.hotkeys.emit("cancel");
    await flushAsync();

    expect(session.getState()).toBe("idle");
    expect(ports.launcher.launched).toEqual([]);
    expect(ports.tts.spoken).toEqual([]);
  });
});

describe("createSession unknown intent", () => {
  it("speaks unknown message and stays idle", async () => {
    const config = await loadTestConfig();
    const ports = createTestPorts("tocar música");
    const session = createSession({ config, ...ports });
    session.start();

    ports.hotkeys.emit("ptt_down");
    ports.hotkeys.emit("ptt_up");
    await flushAsync();

    expect(session.getState()).toBe("idle");
    expect(ports.launcher.launched).toEqual([]);
    expect(ports.tts.spoken).toEqual([MESSAGES.unknown]);
  });
});

describe("createSession allowlist enforcement", () => {
  it("passes logical app id to launcher", async () => {
    const { ports, session } = await startOpenAppFlow("abrir terminal");

    ports.hotkeys.emit("confirm");
    await flushAsync();

    expect(ports.launcher.launched).toEqual(["terminal"]);
    expect(session.getState()).toBe("idle");
  });

  it("rejects apps not in allowlist config", async () => {
    const config = await loadTestConfig();
    const ports = createTestPorts("abrir spotify");
    const session = createSession({ config, ...ports });
    session.start();

    ports.hotkeys.emit("ptt_down");
    ports.hotkeys.emit("ptt_up");
    await flushAsync();

    expect(session.getState()).toBe("idle");
    expect(ports.launcher.launched).toEqual([]);
    expect(ports.tts.spoken).toEqual([MESSAGES.unknown]);
  });
});
