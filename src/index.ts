export type { Intent, OpenAppIntent, ConfirmationResponse } from "./domain/intent.js";
export type { SessionState, PendingIntent } from "./domain/fsm.js";
export { MESSAGES } from "./domain/messages.js";
export type { VozPcConfig, AllowlistEntry, HotkeysConfig, AppLaunchSpec } from "./domain/config.js";

export { parseOpenApp } from "./domain/parser/open-app.js";
export { parseConfirmation } from "./domain/parser/confirmation.js";

export type {
  SttPort,
  TtsPort,
  AppLauncherPort,
  HotkeysPort,
  AudioCapturePort,
  TimerPort,
  ClockPort,
  LaunchResult,
  HotkeyEvent,
  VoiceCommand,
  VoiceCommandRole,
  VoiceCommandObserverPort,
} from "./domain/ports.js";

export { createSession } from "./application/create-session.js";
export type { Session, SessionDeps } from "./application/create-session.js";
export { bootSession } from "./application/boot-session.js";
export { createPttToggle } from "./application/ptt-toggle.js";

export { loadConfig } from "./infra/config/load-config.js";
export { getAppDataDir } from "./infra/shared/paths.js";
export { getAppDataDir as getWindowsAppDataDir } from "./infra/windows/paths.js";
export { getAppDataDir as getLinuxAppDataDir } from "./infra/linux/paths.js";
export { createWindowsAppLauncher } from "./infra/windows/app-launcher.js";
export { createLinuxAppLauncher } from "./infra/linux/app-launcher.js";
export { createWhisperStt, parseWhisperTranscript } from "./infra/shared/stt-whisper.js";
export { createPiperTts } from "./infra/shared/tts-piper.js";
export { ensureSidecars } from "./infra/shared/ensure-sidecars.js";
export type { SidecarPaths } from "./infra/shared/ensure-sidecars.js";
export { createLinuxAudioCapture } from "./infra/linux/audio-capture.js";
export { createRotatingLog } from "./infra/diag/rotating-log.js";
export type { RotatingLog, RotatingLogDeps } from "./infra/diag/rotating-log.js";
