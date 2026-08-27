export type SttPort = {
  transcribe: (audio: Uint8Array) => Promise<string>;
};

export type TtsPort = {
  speak: (text: string) => Promise<void>;
};

export type LaunchResult = {
  ok: boolean;
  error?: string;
};

export type AppLauncherPort = {
  launch: (appId: string) => Promise<LaunchResult>;
};

export type HotkeyEvent = "ptt_down" | "ptt_up" | "confirm" | "cancel";

export type HotkeysPort = {
  on: (event: HotkeyEvent, handler: () => void) => void;
  off: (event: HotkeyEvent, handler: () => void) => void;
};

export type AudioCapturePort = {
  start: () => Promise<void>;
  stop: () => Promise<Uint8Array>;
};

export type TimerPort = {
  setTimeout: (callback: () => void, ms: number) => () => void;
};

export type ClockPort = {
  now: () => number;
};
