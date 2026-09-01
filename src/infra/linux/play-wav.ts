import type { RunCommand } from "../shared/run-command.js";

export function createLinuxPlayWav(runCommand: RunCommand): (path: string) => Promise<void> {
  return async (path) => {
    const result = await runCommand("pw-play", [path]);
    if (result.code !== 0) {
      throw new Error(`pw-play failed (${result.code}): ${result.stderr || result.stdout}`);
    }
  };
}
