import { getAppDataDir as getWindowsAppDataDir } from "../windows/paths.js";
import { getAppDataDir as getLinuxAppDataDir } from "../linux/paths.js";

export function getAppDataDir(homeDir: string, platform: NodeJS.Platform): string {
  if (platform === "win32") {
    return getWindowsAppDataDir(homeDir);
  }
  return getLinuxAppDataDir(homeDir);
}

export { getWindowsAppDataDir, getLinuxAppDataDir };
