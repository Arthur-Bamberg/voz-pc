export type { Intent, OpenAppIntent, ConfirmationResponse } from "./domain/intent.js";
export type { SessionState, PendingIntent } from "./domain/fsm.js";
export { MESSAGES } from "./domain/messages.js";

export { parseOpenApp } from "./parser/open-app.js";
export { parseConfirmation } from "./parser/confirmation.js";

export { loadConfig } from "./config/load-config.js";
export type { VozPcConfig, AllowlistEntry, HotkeysConfig } from "./config/types.js";

export { getAppDataDir } from "../adapters/shared/paths.js";
export { getAppDataDir as getWindowsAppDataDir } from "../adapters/windows/paths.js";
export { getAppDataDir as getLinuxAppDataDir } from "../adapters/linux/paths.js";

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
} from "./ports/index.js";

export { createSession } from "./session/create-session.js";
export type { Session, SessionDeps } from "./session/create-session.js";

export { createRotatingLog } from "./diag/rotating-log.js";
export type { RotatingLog, RotatingLogDeps } from "./diag/rotating-log.js";
