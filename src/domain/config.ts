export type OsTarget = "windows" | "linux";

export type AppLaunchSpec = {
  command: string;
  args?: string[];
  desktop?: string[];
};

export type AllowlistEntry = {
  label: string;
  windows: AppLaunchSpec;
  linux: AppLaunchSpec;
};

export type HotkeysConfig = {
  ptt: string;
  confirm: string;
  cancel: string;
};

export type VozPcConfig = {
  locale: string;
  confirmationTimeoutMs: number;
  whisper: {
    model: string;
  };
  hotkeys: HotkeysConfig;
  allowlist: Record<string, AllowlistEntry>;
  aliases: Record<string, string[]>;
};
