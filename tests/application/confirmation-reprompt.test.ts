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
import type { AudioCapturePort, SttPort } from "../../src/domain/ports.js";

async function startSession(stt: SttPort, audio: AudioCapturePort = createMockAudio()) {
  const config = await loadTestConfig();
  const ports = {
    hotkeys: createMockHotkeys(),
    tts: createMockTts(),
    launcher: createMockLauncher(),
    audio,
    stt,
    timer: createMockTimer(),
    clock: createMockClock(),
  };
  const session = createSession({ config, ...ports });
  session.start();
  return { session, ports };
}

async function ptt(hotkeys: ReturnType<typeof createMockHotkeys>): Promise<void> {
  hotkeys.emit("ptt_down");
  hotkeys.emit("ptt_up");
  await flushAsync();
}

describe("createSession confirmation re-presentation", () => {
  it("re-presents confirmation when the spoken reply is not sim or não", async () => {
    const { session, ports } = await startSession(createMockSttSequence(["abrir chrome", "cim"]));

    await ptt(ports.hotkeys);
    await ptt(ports.hotkeys);

    expect(session.getState()).toBe("awaiting_confirmation");
    expect(ports.launcher.launched).toEqual([]);
    expect(ports.tts.spoken).toEqual([
      MESSAGES.confirmation("Chrome"),
      MESSAGES.confirmation("Chrome"),
    ]);
  });

  it("re-presents confirmation when an injected reply is not sim or não", async () => {
    const { session, ports } = await startSession(createMockSttSequence(["abrir chrome"]));

    await ptt(ports.hotkeys);
    await session.handleTranscript("talvez");

    expect(session.getState()).toBe("awaiting_confirmation");
    expect(ports.launcher.launched).toEqual([]);
    expect(ports.tts.spoken).toEqual([
      MESSAGES.confirmation("Chrome"),
      MESSAGES.confirmation("Chrome"),
    ]);
  });

  it("re-presents confirmation when STT fails during confirmation PTT", async () => {
    let calls = 0;
    const { session, ports } = await startSession({
      async transcribe() {
        calls += 1;
        if (calls === 1) return "abrir chrome";
        throw new Error("whisper-cli failed");
      },
    });

    await ptt(ports.hotkeys);
    await ptt(ports.hotkeys);

    expect(session.getState()).toBe("awaiting_confirmation");
    expect(ports.launcher.launched).toEqual([]);
    expect(ports.tts.spoken).toEqual([
      MESSAGES.confirmation("Chrome"),
      MESSAGES.confirmation("Chrome"),
    ]);
  });

  it("re-presents confirmation when capture fails to start during confirmation PTT", async () => {
    let starts = 0;
    const { session, ports } = await startSession(createMockSttSequence(["abrir chrome"]), {
      async start() {
        starts += 1;
        if (starts > 1) throw new Error("pw-record failed");
      },
      async stop() {
        return new Uint8Array([1, 2, 3]);
      },
    });

    await ptt(ports.hotkeys);
    ports.hotkeys.emit("ptt_down");
    await flushAsync();

    expect(session.getState()).toBe("awaiting_confirmation");
    expect(ports.launcher.launched).toEqual([]);
    expect(ports.tts.spoken).toEqual([
      MESSAGES.confirmation("Chrome"),
      MESSAGES.confirmation("Chrome"),
    ]);
  });

  it("restarts the confirmation timeout when the intent is presented again", async () => {
    const { session, ports } = await startSession(createMockSttSequence(["abrir chrome", "cim"]));

    await ptt(ports.hotkeys);
    await ports.timer.advance(25_000);
    await ptt(ports.hotkeys);
    await ports.timer.advance(10_000);

    expect(session.getState()).toBe("awaiting_confirmation");
    expect(ports.launcher.launched).toEqual([]);
    expect(ports.tts.spoken).not.toContain(MESSAGES.cancelled);

    await ports.timer.advance(20_000);

    expect(session.getState()).toBe("idle");
    expect(ports.tts.spoken).toContain(MESSAGES.cancelled);
  });

  it("still launches after a re-presented confirmation is accepted", async () => {
    const { session, ports } = await startSession(
      createMockSttSequence(["abrir chrome", "cim", "sim"]),
    );

    await ptt(ports.hotkeys);
    await ptt(ports.hotkeys);
    await ptt(ports.hotkeys);

    expect(session.getState()).toBe("idle");
    expect(ports.launcher.launched).toEqual(["chrome"]);
    expect(ports.tts.spoken).toEqual([
      MESSAGES.confirmation("Chrome"),
      MESSAGES.confirmation("Chrome"),
      MESSAGES.success("Chrome"),
    ]);
  });
});
