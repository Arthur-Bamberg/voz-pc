export type OpenAppIntent = {
  type: "open_app";
  appId: string;
};

export type Intent = OpenAppIntent;

export type ConfirmationResponse = "confirm" | "cancel";
