/**
 * Presentation façade (TS): composition entry for the desktop shell.
 * Native tray/hotkeys/audio live in `src-tauri/` and call into application use cases.
 */
export { createSession } from "../application/create-session.js";
export type { Session, SessionDeps } from "../application/create-session.js";
export { bootSession } from "../application/boot-session.js";
