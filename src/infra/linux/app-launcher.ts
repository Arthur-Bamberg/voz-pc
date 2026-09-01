import {
  createAppLauncher,
  defaultDetachedSpawn,
  resolveLaunchSpec,
  type SpawnFn,
} from "../shared/app-launcher.js";
import { linuxDesktopExists } from "./desktop.js";
import type { VozPcConfig } from "../../domain/config.js";
import type { AppLauncherPort } from "../../domain/ports.js";

export type LinuxDesktopExists = (desktopId: string) => Promise<boolean>;

export function createLinuxAppLauncher(
  config: VozPcConfig,
  spawn?: SpawnFn,
  desktopExists: LinuxDesktopExists = linuxDesktopExists,
): AppLauncherPort {
  const run = spawn ?? defaultDetachedSpawn;
  const fallback = createAppLauncher({ config, platform: "linux", spawn: run });

  return {
    async launch(appId) {
      const spec = resolveLaunchSpec(config, appId, "linux");
      if (!spec) {
        return fallback.launch(appId);
      }

      for (const desktopId of spec.desktop ?? []) {
        if (await desktopExists(desktopId)) {
          return run("gtk-launch", [desktopId]);
        }
      }

      return fallback.launch(appId);
    },
  };
}
