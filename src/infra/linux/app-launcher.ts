import { createAppLauncher } from "../shared/app-launcher.js";
import type { VozPcConfig } from "../../src/config/types.js";
import type { SpawnFn } from "../shared/app-launcher.js";

export function createLinuxAppLauncher(
  config: VozPcConfig,
  spawn?: SpawnFn,
) {
  return createAppLauncher({ config, platform: "linux", spawn });
}
