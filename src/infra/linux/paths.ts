import { join } from "node:path";

export function getAppDataDir(homeDir: string): string {
  return join(homeDir, ".config", "voz-pc");
}
