import type {
  AppLauncherPort,
  AudioCapturePort,
  ClockPort,
  HotkeyEvent,
  HotkeysPort,
  SttPort,
  TimerPort,
  TtsPort,
} from "../../domain/ports.js";
import type { VozPcConfig } from "../../domain/config.js";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export function createMockHotkeys(): HotkeysPort & {
  emit: (event: HotkeyEvent) => void;
} {
  const listeners = new Map<HotkeyEvent, Set<() => void>>();

  return {
    on(event, handler) {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event)!.add(handler);
    },
    off(event, handler) {
      listeners.get(event)?.delete(handler);
    },
    emit(event) {
      for (const handler of listeners.get(event) ?? []) {
        handler();
      }
    },
  };
}

export function createMockTts(): TtsPort & { spoken: string[] } {
  const spoken: string[] = [];
  return {
    spoken,
    async speak(text) {
      spoken.push(text);
    },
  };
}

export function createMockLauncher(): AppLauncherPort & { launched: string[] } {
  const launched: string[] = [];
  return {
    launched,
    async launch(appId) {
      launched.push(appId);
      return { ok: true };
    },
  };
}

export function createMockAudio(buffer: Uint8Array = new Uint8Array([1, 2, 3])): AudioCapturePort {
  return {
    async start() {},
    async stop() {
      return buffer;
    },
  };
}

export function createMockStt(transcript: string): SttPort {
  return {
    async transcribe() {
      return transcript;
    },
  };
}

export function createMockSttSequence(transcripts: string[]): SttPort {
  let index = 0;
  return {
    async transcribe() {
      const transcript = transcripts[index] ?? transcripts[transcripts.length - 1] ?? "";
      index += 1;
      return transcript;
    },
  };
}

export function createMockTimer(): TimerPort & {
  advance: (ms: number) => Promise<void>;
} {
  let now = 0;
  const timers: Array<{ at: number; callback: () => void; cleared: boolean }> = [];

  return {
    setTimeout(callback, ms) {
      const entry = { at: now + ms, callback, cleared: false };
      timers.push(entry);
      return () => {
        entry.cleared = true;
      };
    },
    async advance(ms) {
      now += ms;
      const due = timers.filter((t) => !t.cleared && t.at <= now);
      for (const timer of due) {
        timer.cleared = true;
        await timer.callback();
      }
    },
  };
}

export function createMockClock(start = 0): ClockPort {
  let now = start;
  return {
    now: () => now,
  };
}

export async function loadTestConfig(): Promise<VozPcConfig> {
  const raw = await readFile(join(process.cwd(), "config.default.json"), "utf8");
  return JSON.parse(raw) as VozPcConfig;
}

export type TestPorts = {
  hotkeys: ReturnType<typeof createMockHotkeys>;
  tts: ReturnType<typeof createMockTts>;
  launcher: ReturnType<typeof createMockLauncher>;
  audio: AudioCapturePort;
  stt: SttPort;
  timer: ReturnType<typeof createMockTimer>;
  clock: ClockPort;
};

export function createTestPorts(transcript: string): TestPorts {
  return {
    hotkeys: createMockHotkeys(),
    tts: createMockTts(),
    launcher: createMockLauncher(),
    audio: createMockAudio(),
    stt: createMockStt(transcript),
    timer: createMockTimer(),
    clock: createMockClock(),
  };
}

export async function flushAsync(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
}
