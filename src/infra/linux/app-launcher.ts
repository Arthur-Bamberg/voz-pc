import { createAppLauncher } from "../shared/app-launcher.js";
import type { VozPcConfig } from "../../domain/config.js";
import type { SpawnFn } from "../shared/app-launcher.js";

export function createLinuxAppLauncher(
  config: VozPcConfig,
  spawn?: SpawnFn,
) {
  return createAppLauncher({ config, platform: "linux", spawn });
}
