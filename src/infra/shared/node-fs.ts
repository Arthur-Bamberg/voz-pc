import { mkdir, readdir, stat, mkdtemp } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import type { EnsureSidecarsDeps } from "./ensure-sidecars.js";

export function createTempDir(prefix: string): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix));
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function findFile(dir: string, name: string): Promise<string | null> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isFile() && (entry.name === name || entry.name === `${name}.exe`)) {
        return full;
      }
      if (entry.isDirectory()) {
        const nested = await findFile(full, name);
        if (nested) return nested;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export async function downloadToFile(url: string, dest: string): Promise<void> {
  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok || !response.body) {
    throw new Error(`Download failed (${response.status}): ${url}`);
  }
  await pipeline(Readable.fromWeb(response.body as import("node:stream/web").ReadableStream), createWriteStream(dest));
}

export function runExtractArchive(archive: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = archive.endsWith(".zip")
      ? ["unzip", "-o", archive, "-d", dest]
      : ["tar", "-xf", archive, "-C", dest];
    const command = args[0];
    const rest = args.slice(1);
    if (!command) {
      reject(new Error("extract command missing"));
      return;
    }
    const child = spawn(command, rest);
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} failed extracting ${archive} (${code})`));
    });
  });
}

export function createFsSidecarDeps(
  appDataDir: string,
  platform: NodeJS.Platform = process.platform,
): EnsureSidecarsDeps {
  return {
    appDataDir,
    platform,
    exists: pathExists,
    mkdir: (path) => mkdir(path, { recursive: true }).then(() => undefined),
    download: downloadToFile,
    extractArchive: async (archive, dest) => {
      await mkdir(dest, { recursive: true });
      await runExtractArchive(archive, dest);
    },
    findFile,
  };
}
