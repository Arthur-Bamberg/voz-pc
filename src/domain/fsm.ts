export type SessionState =
  | "idle"
  | "recording"
  | "awaiting_confirmation";

export type PendingIntent = {
  type: "open_app";
  appId: string;
};
