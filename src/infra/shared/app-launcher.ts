import type { AppLaunchSpec, VozPcConfig } from "../../domain/config.js";
import type { AppLauncherPort } from "../../domain/ports.js";

export type SpawnFn = (
  command: string,
  args: string[],
) => Promise<{ ok: boolean; error?: string }>;

export type CreateAppLauncherOptions = {
  config: VozPcConfig;
  platform: "windows" | "linux";
  spawn?: SpawnFn;
};

export function resolveLaunchSpec(
  config: VozPcConfig,
  appId: string,
  platform: "windows" | "linux",
): AppLaunchSpec | null {
  const entry = config.allowlist[appId];
  if (!entry) return null;
  return entry[platform];
}

export function createAppLauncher(options: CreateAppLauncherOptions): AppLauncherPort {
  const spawn =
    options.spawn ??
    (async (command, args) => {
      const { spawn: nodeSpawn } = await import("node:child_process");
      return new Promise((resolve) => {
        const child = nodeSpawn(command, args, { detached: true, stdio: "ignore" });
        child.on("error", (error) => resolve({ ok: false, error: error.message }));
        child.unref();
        resolve({ ok: true });
      });
    });

  return {
    async launch(appId) {
      const spec = resolveLaunchSpec(options.config, appId, options.platform);
      if (!spec) {
        return { ok: false, error: `App não está na allowlist: ${appId}` };
      }

      const args = spec.args ?? [];
      return spawn(spec.command, args);
    },
  };
}
