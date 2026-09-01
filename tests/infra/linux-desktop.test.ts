import { describe, expect, it } from "vitest";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { linuxDesktopExists, xdgApplicationDirs } from "../../src/infra/linux/desktop.js";

describe("xdgApplicationDirs", () => {
  it("includes user, system, and Flatpak application dirs", () => {
    const dirs = xdgApplicationDirs(
      { XDG_DATA_HOME: "/home/user/.local/share", XDG_DATA_DIRS: "/usr/share" },
      "/home/user",
    );

    expect(dirs).toContain("/home/user/.local/share/applications");
    expect(dirs).toContain("/usr/share/applications");
    expect(dirs).toContain("/var/lib/flatpak/exports/share/applications");
    expect(dirs).toContain("/home/user/.local/share/flatpak/exports/share/applications");
  });
});

describe("linuxDesktopExists", () => {
  it("finds a desktop id in the given application dirs", async () => {
    const dir = await mkdtemp(join(tmpdir(), "voz-desktop-"));
    await writeFile(join(dir, "com.google.Chrome.desktop"), "[Desktop Entry]\n");

    await expect(linuxDesktopExists("com.google.Chrome", [dir])).resolves.toBe(true);
    await expect(linuxDesktopExists("org.mozilla.firefox", [dir])).resolves.toBe(false);
  });
});
