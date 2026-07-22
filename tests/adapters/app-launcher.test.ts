import { describe, expect, it } from "vitest";
import { resolveLaunchSpec } from "../../adapters/shared/app-launcher.js";
import { createWindowsAppLauncher } from "../../adapters/windows/app-launcher.js";
import { createLinuxAppLauncher } from "../../adapters/linux/app-launcher.js";
import { loadTestConfig } from "../../adapters/mocks/test-ports.js";

describe("resolveLaunchSpec", () => {
  it("resolves windows commands from config", async () => {
    const config = await loadTestConfig();
    expect(resolveLaunchSpec(config, "chrome", "windows")).toEqual({ command: "chrome" });
    expect(resolveLaunchSpec(config, "files", "windows")).toEqual({ command: "explorer" });
  });

  it("resolves linux commands from config", async () => {
    const config = await loadTestConfig();
    expect(resolveLaunchSpec(config, "chrome", "linux")).toEqual({ command: "google-chrome" });
    expect(resolveLaunchSpec(config, "terminal", "linux")).toEqual({ command: "gnome-terminal" });
  });

  it("returns null for unknown app ids", async () => {
    const config = await loadTestConfig();
    expect(resolveLaunchSpec(config, "spotify", "linux")).toBeNull();
  });
});

describe("AppLauncher adapters", () => {
  it("windows launcher spawns configured command", async () => {
    const config = await loadTestConfig();
    const spawned: Array<{ command: string; args: string[] }> = [];
    const launcher = createWindowsAppLauncher(config, async (command, args) => {
      spawned.push({ command, args });
      return { ok: true };
    });

    const result = await launcher.launch("calculator");

    expect(result.ok).toBe(true);
    expect(spawned).toEqual([{ command: "calc", args: [] }]);
  });

  it("linux launcher spawns configured command", async () => {
    const config = await loadTestConfig();
    const spawned: Array<{ command: string; args: string[] }> = [];
    const launcher = createLinuxAppLauncher(config, async (command, args) => {
      spawned.push({ command, args });
      return { ok: true };
    });

    const result = await launcher.launch("calculator");

    expect(result.ok).toBe(true);
    expect(spawned).toEqual([{ command: "gnome-calculator", args: [] }]);
  });

  it("rejects unknown logical ids", async () => {
    const config = await loadTestConfig();
    const launcher = createLinuxAppLauncher(config, async () => ({ ok: true }));
    const result = await launcher.launch("spotify");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("App não está na allowlist: spotify");
  });
});
