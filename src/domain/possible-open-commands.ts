import type { VozPcConfig } from "./config.js";
import type { PossibleOpenCommand } from "./ports.js";

export function listPossibleOpenCommands(config: VozPcConfig): PossibleOpenCommand[] {
  return Object.entries(config.allowlist).map(([appId, entry]) => {
    const aliases = config.aliases[appId] ?? [];
    return {
      appId,
      label: entry.label,
      phrases: [`abrir ${entry.label}`, ...aliases],
    };
  });
}
