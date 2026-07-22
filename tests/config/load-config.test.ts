import { describe, expect, it } from "vitest";
import { loadConfig } from "../../src/config/load-config.js";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const defaultConfigPath = join(process.cwd(), "config.default.json");
const defaultConfig = await readFile(defaultConfigPath, "utf8");

describe("loadConfig", () => {
  it("merges defaults with user config from app data dir", async () => {
    const appDataDir = "/tmp/voz-pc-test-config";
    const config = await loadConfig({
      appDataDir,
      readFile: async (path) => {
        if (path === defaultConfigPath) {
          return defaultConfig;
        }
        if (path === join(appDataDir, "config.json")) {
          return JSON.stringify({
            hotkeys: { ptt: "Ctrl+Alt+V" },
          });
        }
        throw new Error(`unexpected read: ${path}`);
      },
      defaultConfigPath,
    });

    expect(config.confirmationTimeoutMs).toBe(30000);
    expect(config.hotkeys.ptt).toBe("Ctrl+Alt+V");
    expect(config.hotkeys.confirm).toBe("Enter");
    expect(config.allowlist.chrome.label).toBe("Chrome");
    expect(config.whisper.model).toBe("base");
  });

  it("uses defaults when user config is missing", async () => {
    const config = await loadConfig({
      appDataDir: "/tmp/voz-pc-missing",
      readFile: async (path) => {
        if (path === defaultConfigPath) {
          return defaultConfig;
        }
        throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      },
      defaultConfigPath,
    });

    expect(config.hotkeys.ptt).toBe("Ctrl+Shift+Space");
    expect(config.allowlist.calculator.linux.command).toBe("gnome-calculator");
  });
});
