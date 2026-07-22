import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { getAppDataDir as getWindowsAppDataDir } from "../../adapters/windows/paths.js";
import { getAppDataDir as getLinuxAppDataDir } from "../../adapters/linux/paths.js";

describe("getAppDataDir adapters", () => {
  it("resolves Windows app data dir", () => {
    expect(getWindowsAppDataDir("C:\\Users\\Alice")).toBe(
      join("C:\\Users\\Alice", "AppData", "Roaming", "voz-pc"),
    );
  });

  it("resolves Linux app data dir", () => {
    expect(getLinuxAppDataDir("/home/alice")).toBe("/home/alice/.config/voz-pc");
  });
});
