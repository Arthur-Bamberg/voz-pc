import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { VozPcConfig } from "../../domain/config.js";

export type FileReader = (path: string) => Promise<string>;

export type LoadConfigDeps = {
  appDataDir: string;
  defaultConfigPath?: string;
  readFile?: FileReader;
};

function isEnoent(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

function deepMerge<T extends Record<string, unknown>>(base: T, override: Partial<T>): T {
  const result = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const existing = result[key as keyof T];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      existing &&
      typeof existing === "object" &&
      !Array.isArray(existing)
    ) {
      result[key as keyof T] = deepMerge(
        existing as Record<string, unknown>,
        value as Record<string, unknown>,
      ) as T[keyof T];
    } else if (value !== undefined) {
      result[key as keyof T] = value as T[keyof T];
    }
  }

  return result;
}

export async function loadConfig(deps: LoadConfigDeps): Promise<VozPcConfig> {
  const read = deps.readFile ?? ((path: string) => readFile(path, "utf8"));
  const defaultPath = deps.defaultConfigPath ?? join(process.cwd(), "config.default.json");
  const defaults = JSON.parse(await read(defaultPath)) as VozPcConfig;

  const userConfigPath = join(deps.appDataDir, "config.json");

  try {
    const userConfig = JSON.parse(await read(userConfigPath)) as Partial<VozPcConfig>;
    return deepMerge(defaults, userConfig);
  } catch (error) {
    if (isEnoent(error)) {
      return defaults;
    }
    throw error;
  }
}
