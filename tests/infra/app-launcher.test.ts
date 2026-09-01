import { describe, expect, it } from "vitest";
import { resolveLaunchSpec } from "../../src/infra/shared/app-launcher.js";
import { createWindowsAppLauncher } from "../../src/infra/windows/app-launcher.js";
import { createLinuxAppLauncher } from "../../src/infra/linux/app-launcher.js";
import { loadTestConfig } from "../../src/infra/mocks/test-ports.js";

describe("resolveLaunchSpec", () => {
  it("resolves windows commands from config", async () => {
    const config = await loadTestConfig();
    expect(resolveLaunchSpec(config, "chrome", "windows")).toEqual({ command: "chrome" });
    expect(resolveLaunchSpec(config, "files", "windows")).toEqual({ command: "explorer" });
  });

  it("resolves linux commands from config", async () => {
    const config = await loadTestConfig();
    expect(resolveLaunchSpec(config, "chrome", "linux")).toEqual({
      command: "google-chrome",
      desktop: ["com.google.Chrome", "google-chrome", "google-chrome-stable"],
    });
    expect(resolveLaunchSpec(config, "terminal", "linux")).toEqual({
      command: "gnome-terminal",
      desktop: ["org.gnome.Ptyxis", "org.gnome.Terminal", "org.gnome.Console"],
    });
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
    const launcher = createLinuxAppLauncher(
      config,
      async (command, args) => {
        spawned.push({ command, args });
        return { ok: true };
      },
      async () => false,
    );

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

  it("launches via gtk-launch when a linux desktop id is present", async () => {
    const config = await loadTestConfig();
    config.allowlist.chrome.linux = {
      ...config.allowlist.chrome.linux,
      desktop: ["com.google.Chrome"],
    };
    const spawned: Array<{ command: string; args: string[] }> = [];
    const launcher = createLinuxAppLauncher(
      config,
      async (command, args) => {
        spawned.push({ command, args });
        return { ok: true };
      },
      async (desktopId) => desktopId === "com.google.Chrome",
    );

    const result = await launcher.launch("chrome");

    expect(result.ok).toBe(true);
    expect(spawned).toEqual([{ command: "gtk-launch", args: ["com.google.Chrome"] }]);
  });

  it("falls back to the linux command when no desktop file is present", async () => {
    const config = await loadTestConfig();
    config.allowlist.firefox.linux = {
      ...config.allowlist.firefox.linux,
      desktop: ["org.mozilla.firefox"],
    };
    const spawned: Array<{ command: string; args: string[] }> = [];
    const launcher = createLinuxAppLauncher(
      config,
      async (command, args) => {
        spawned.push({ command, args });
        return { ok: true };
      },
      async () => false,
    );

    const result = await launcher.launch("firefox");

    expect(result.ok).toBe(true);
    expect(spawned).toEqual([{ command: "firefox", args: [] }]);
  });

  it("uses the first desktop id that exists", async () => {
    const config = await loadTestConfig();
    config.allowlist.terminal.linux = {
      ...config.allowlist.terminal.linux,
      desktop: ["org.gnome.Terminal", "org.gnome.Ptyxis"],
    };
    const spawned: Array<{ command: string; args: string[] }> = [];
    const launcher = createLinuxAppLauncher(
      config,
      async (command, args) => {
        spawned.push({ command, args });
        return { ok: true };
      },
      async (desktopId) => desktopId === "org.gnome.Ptyxis",
    );

    const result = await launcher.launch("terminal");

    expect(result.ok).toBe(true);
    expect(spawned).toEqual([{ command: "gtk-launch", args: ["org.gnome.Ptyxis"] }]);
  });
});
