import { readFile as readFileFromDisk } from "node:fs/promises";
import { join } from "node:path";

export function parseEnvFile(contents: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith("#")) continue;
    const withoutExport = line.startsWith("export ") ? line.slice("export ".length).trim() : line;
    const eq = withoutExport.indexOf("=");
    if (eq <= 0) continue;
    const key = withoutExport.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    result[key] = unquote(withoutExport.slice(eq + 1).trim());
  }

  return result;
}

function unquote(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

export function applyParsedEnv(
  parsed: Record<string, string>,
  env: NodeJS.ProcessEnv,
): void {
  for (const [key, value] of Object.entries(parsed)) {
    if (env[key] === undefined) {
      env[key] = value;
    }
  }
}

export async function loadEnvFile(options: {
  path: string;
  env?: NodeJS.ProcessEnv;
  readFile?: (path: string) => Promise<string>;
}): Promise<boolean> {
  const env = options.env ?? process.env;
  const read = options.readFile ?? ((filePath) => readFileFromDisk(filePath, "utf8"));
  try {
    const contents = await read(options.path);
    applyParsedEnv(parseEnvFile(contents), env);
    return true;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return false;
    }
    throw error;
  }
}

export async function loadProjectEnv(
  cwd: string = process.cwd(),
  env: NodeJS.ProcessEnv = process.env,
): Promise<boolean> {
  return loadEnvFile({ path: join(cwd, ".env"), env });
}
