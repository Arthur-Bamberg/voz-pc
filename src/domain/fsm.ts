export type SessionState =
  | "idle"
  | "recording"
  | "recording_confirmation"
  | "awaiting_confirmation";

export type PendingIntent = {
  type: "open_app";
  appId: string;
};
