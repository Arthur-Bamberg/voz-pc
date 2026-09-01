import { homedir } from "node:os";
import { join } from "node:path";
import { stat } from "node:fs/promises";

export function xdgApplicationDirs(
  env: NodeJS.ProcessEnv = process.env,
  home: string = homedir(),
): string[] {
  const dataHome = env.XDG_DATA_HOME ?? join(home, ".local", "share");
  const dataDirs = (env.XDG_DATA_DIRS ?? "/usr/local/share:/usr/share").split(":").filter(Boolean);
  const extras = [
    "/var/lib/flatpak/exports/share",
    join(home, ".local", "share", "flatpak", "exports", "share"),
  ];
  const roots = [dataHome, ...dataDirs, ...extras];
  return [...new Set(roots.map((dir) => join(dir, "applications")))];
}

export async function linuxDesktopExists(
  desktopId: string,
  dirs: string[] = xdgApplicationDirs(),
): Promise<boolean> {
  const fileName = desktopId.endsWith(".desktop") ? desktopId : `${desktopId}.desktop`;
  for (const dir of dirs) {
    try {
      await stat(join(dir, fileName));
      return true;
    } catch {
      // try next directory
    }
  }
  return false;
}
