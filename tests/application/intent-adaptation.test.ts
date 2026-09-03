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
import { MESSAGES } from "../../src/domain/messages.js";
import type { IntentAdapterPort, PossibleOpenCommand } from "../../src/domain/ports.js";

describe("createSession intent adaptation", () => {
  it("adapts a misheard open voice command onto an allowlist app before confirmation", async () => {
    const config = await loadTestConfig();
    const received: Array<{ command: string; possible: PossibleOpenCommand[] }> = [];
    const intentAdapter: IntentAdapterPort = {
      async adaptOpenApp(voiceCommand, possible) {
        received.push({ command: voiceCommand, possible });
        return "calculator";
      },
      async adaptConfirmation() {
        return null;
      },
    };
    const ports = {
      hotkeys: createMockHotkeys(),
      tts: createMockTts(),
      launcher: createMockLauncher(),
      audio: createMockAudio(),
      stt: createMockStt("abrir a coupla dore"),
      timer: createMockTimer(),
      clock: createMockClock(),
      intentAdapter,
    };
    const session = createSession({ config, ...ports });

    session.start();
    ports.hotkeys.emit("ptt_down");
    ports.hotkeys.emit("ptt_up");
    await flushAsync();

    expect(session.getState()).toBe("awaiting_confirmation");
    expect(ports.tts.spoken).toEqual([MESSAGES.confirmation("Calculadora")]);
    expect(ports.launcher.launched).toEqual([]);
    expect(received).toHaveLength(1);
    expect(received[0]?.command).toBe("abrir a coupla dore");
    expect(received[0]?.possible.map((item) => item.appId)).toContain("calculator");
  });

  it("does not ask the adapter when the parser already extracted an intent", async () => {
    const config = await loadTestConfig();
    let calls = 0;
    const ports = {
      hotkeys: createMockHotkeys(),
      tts: createMockTts(),
      launcher: createMockLauncher(),
      audio: createMockAudio(),
      stt: createMockStt("abrir chrome"),
      timer: createMockTimer(),
      clock: createMockClock(),
      intentAdapter: {
        async adaptOpenApp() {
          calls += 1;
          return "calculator";
        },
        async adaptConfirmation() {
          return null;
        },
      },
    };
    const session = createSession({ config, ...ports });

    session.start();
    ports.hotkeys.emit("ptt_down");
    ports.hotkeys.emit("ptt_up");
    await flushAsync();

    expect(calls).toBe(0);
    expect(session.getState()).toBe("awaiting_confirmation");
    expect(ports.tts.spoken).toEqual([MESSAGES.confirmation("Chrome")]);
  });

  it("speaks unknown when the adapter cannot map the voice command", async () => {
    const config = await loadTestConfig();
    const ports = {
      hotkeys: createMockHotkeys(),
      tts: createMockTts(),
      launcher: createMockLauncher(),
      audio: createMockAudio(),
      stt: createMockStt("abrir a coupla dore"),
      timer: createMockTimer(),
      clock: createMockClock(),
      intentAdapter: {
        async adaptOpenApp() {
          return null;
        },
        async adaptConfirmation() {
          return null;
        },
      },
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

  it("does not ask the adapter when the voice command is empty", async () => {
    const config = await loadTestConfig();
    let calls = 0;
    const ports = {
      hotkeys: createMockHotkeys(),
      tts: createMockTts(),
      launcher: createMockLauncher(),
      audio: createMockAudio(),
      stt: createMockStt(""),
      timer: createMockTimer(),
      clock: createMockClock(),
      intentAdapter: {
        async adaptOpenApp() {
          calls += 1;
          return "calculator";
        },
        async adaptConfirmation() {
          return null;
        },
      },
    };
    const session = createSession({ config, ...ports });

    session.start();
    ports.hotkeys.emit("ptt_down");
    ports.hotkeys.emit("ptt_up");
    await flushAsync();

    expect(calls).toBe(0);
    expect(session.getState()).toBe("idle");
    expect(ports.tts.spoken).toEqual([MESSAGES.unknown]);
  });

  it("speaks unknown when the adapter returns an id outside the allowlist", async () => {
    const config = await loadTestConfig();
    const ports = {
      hotkeys: createMockHotkeys(),
      tts: createMockTts(),
      launcher: createMockLauncher(),
      audio: createMockAudio(),
      stt: createMockStt("abrir a coupla dore"),
      timer: createMockTimer(),
      clock: createMockClock(),
      intentAdapter: {
        async adaptOpenApp() {
          return "spotify";
        },
        async adaptConfirmation() {
          return null;
        },
      },
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

  it("speaks unknown when the adapter throws", async () => {
    const config = await loadTestConfig();
    const ports = {
      hotkeys: createMockHotkeys(),
      tts: createMockTts(),
      launcher: createMockLauncher(),
      audio: createMockAudio(),
      stt: createMockStt("abrir a coupla dore"),
      timer: createMockTimer(),
      clock: createMockClock(),
      intentAdapter: {
        async adaptOpenApp() {
          throw new Error("gemini down");
        },
        async adaptConfirmation() {
          return null;
        },
      },
    };
    const session = createSession({ config, ...ports });

    session.start();
    ports.hotkeys.emit("ptt_down");
    ports.hotkeys.emit("ptt_up");
    await flushAsync();

    expect(session.getState()).toBe("idle");
    expect(ports.tts.spoken).toEqual([MESSAGES.unknown]);
  });

  it("adapts a misheard confirmation reply onto sim before launching", async () => {
    const config = await loadTestConfig();
    const received: string[] = [];
    const ports = {
      hotkeys: createMockHotkeys(),
      tts: createMockTts(),
      launcher: createMockLauncher(),
      audio: createMockAudio(),
      stt: createMockSttSequence(["abrir chrome", "cim"]),
      timer: createMockTimer(),
      clock: createMockClock(),
      intentAdapter: {
        async adaptOpenApp() {
          return null;
        },
        async adaptConfirmation(voiceCommand: string) {
          received.push(voiceCommand);
          return "confirm" as const;
        },
      },
    };
    const session = createSession({ config, ...ports });

    session.start();
    ports.hotkeys.emit("ptt_down");
    ports.hotkeys.emit("ptt_up");
    await flushAsync();
    ports.hotkeys.emit("ptt_down");
    ports.hotkeys.emit("ptt_up");
    await flushAsync();

    expect(session.getState()).toBe("idle");
    expect(ports.launcher.launched).toEqual(["chrome"]);
    expect(ports.tts.spoken).toEqual([
      MESSAGES.confirmation("Chrome"),
      MESSAGES.success("Chrome"),
    ]);
    expect(received).toEqual(["cim"]);
  });

  it("does not ask the confirmation adapter when the reply is already sim or não", async () => {
    const config = await loadTestConfig();
    let calls = 0;
    const ports = {
      hotkeys: createMockHotkeys(),
      tts: createMockTts(),
      launcher: createMockLauncher(),
      audio: createMockAudio(),
      stt: createMockSttSequence(["abrir chrome", "sim"]),
      timer: createMockTimer(),
      clock: createMockClock(),
      intentAdapter: {
        async adaptOpenApp() {
          return null;
        },
        async adaptConfirmation() {
          calls += 1;
          return "cancel" as const;
        },
      },
    };
    const session = createSession({ config, ...ports });

    session.start();
    ports.hotkeys.emit("ptt_down");
    ports.hotkeys.emit("ptt_up");
    await flushAsync();
    ports.hotkeys.emit("ptt_down");
    ports.hotkeys.emit("ptt_up");
    await flushAsync();

    expect(calls).toBe(0);
    expect(ports.launcher.launched).toEqual(["chrome"]);
  });

  it("re-presents confirmation when the adapter cannot map the spoken reply", async () => {
    const config = await loadTestConfig();
    const ports = {
      hotkeys: createMockHotkeys(),
      tts: createMockTts(),
      launcher: createMockLauncher(),
      audio: createMockAudio(),
      stt: createMockSttSequence(["abrir chrome", "talvez"]),
      timer: createMockTimer(),
      clock: createMockClock(),
      intentAdapter: {
        async adaptOpenApp() {
          return null;
        },
        async adaptConfirmation() {
          return null;
        },
      },
    };
    const session = createSession({ config, ...ports });

    session.start();
    ports.hotkeys.emit("ptt_down");
    ports.hotkeys.emit("ptt_up");
    await flushAsync();
    ports.hotkeys.emit("ptt_down");
    ports.hotkeys.emit("ptt_up");
    await flushAsync();

    expect(session.getState()).toBe("awaiting_confirmation");
    expect(ports.launcher.launched).toEqual([]);
    expect(ports.tts.spoken).toEqual([
      MESSAGES.confirmation("Chrome"),
      MESSAGES.confirmation("Chrome"),
    ]);
  });

  it("does not ask the confirmation adapter when the spoken reply is empty", async () => {
    const config = await loadTestConfig();
    let calls = 0;
    const ports = {
      hotkeys: createMockHotkeys(),
      tts: createMockTts(),
      launcher: createMockLauncher(),
      audio: createMockAudio(),
      stt: createMockSttSequence(["abrir chrome", ""]),
      timer: createMockTimer(),
      clock: createMockClock(),
      intentAdapter: {
        async adaptOpenApp() {
          return null;
        },
        async adaptConfirmation() {
          calls += 1;
          return "confirm" as const;
        },
      },
    };
    const session = createSession({ config, ...ports });

    session.start();
    ports.hotkeys.emit("ptt_down");
    ports.hotkeys.emit("ptt_up");
    await flushAsync();
    ports.hotkeys.emit("ptt_down");
    ports.hotkeys.emit("ptt_up");
    await flushAsync();

    expect(calls).toBe(0);
    expect(session.getState()).toBe("awaiting_confirmation");
    expect(ports.tts.spoken).toEqual([
      MESSAGES.confirmation("Chrome"),
      MESSAGES.confirmation("Chrome"),
    ]);
  });
});
