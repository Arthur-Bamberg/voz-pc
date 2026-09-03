import type { OpenAppIntent } from "../intent.js";
import { normalizeVoiceText } from "../normalize-voice.js";

const OPEN_VERBS = ["abrir", "abramos", "abrei", "abre", "abra", "abri"];

const DEFAULT_ALIASES: Record<string, string[]> = {
  chrome: ["chrome", "google chrome", "google", "crom", "crome", "cromi", "cro"],
  firefox: ["firefox", "mozilla"],
  files: ["arquivos", "arquivo", "pastas", "pasta", "explorer", "nautilus"],
  terminal: ["terminal", "console"],
  calculator: ["calculadora", "calc"],
};

const FUNCTION_WORDS = /\b(o|a|os|as|um|uma|de|da|do|dos|das)\b/g;
const MIN_PREFIX = 3;

function stripFunctionWords(text: string): string {
  return text.replace(FUNCTION_WORDS, " ").replace(/\s+/g, " ").trim();
}

function tokenFitsAlias(token: string, alias: string): boolean {
  if (token === alias) return true;
  if (token.length >= MIN_PREFIX && alias.startsWith(token)) return true;
  if (alias.length >= MIN_PREFIX && token.startsWith(alias)) return true;
  return false;
}

function matchAppId(remainder: string, aliases: Record<string, string[]>): string | null {
  const tokens = remainder.split(/\s+/).filter(Boolean);
  const glued = tokens.join("");
  if (glued.length > 0 && !tokens.includes(glued)) {
    tokens.push(glued);
  }
  const hits = new Set<string>();

  for (const [appId, appAliases] of Object.entries(aliases)) {
    const candidates = [appId, ...appAliases].map((alias) => normalizeVoiceText(alias));
    const matched = candidates.some((candidate) => {
      if (candidate.includes(" ")) {
        return remainder.includes(candidate);
      }
      return tokens.some((token) => tokenFitsAlias(token, candidate));
    });
    if (matched) hits.add(appId);
  }

  return hits.size === 1 ? ([...hits][0] ?? null) : null;
}

function mergeAliases(
  defaults: Record<string, string[]>,
  extra: Record<string, string[]>,
): Record<string, string[]> {
  const merged: Record<string, string[]> = { ...defaults };
  for (const [appId, phrases] of Object.entries(extra)) {
    merged[appId] = [...new Set([...(merged[appId] ?? []), ...phrases])];
  }
  return merged;
}

export function parseOpenApp(
  text: string,
  aliases: Record<string, string[]> = DEFAULT_ALIASES,
): OpenAppIntent | null {
  const normalized = stripFunctionWords(normalizeVoiceText(text));
  const resolvedAliases = mergeAliases(DEFAULT_ALIASES, aliases);

  for (const verb of OPEN_VERBS) {
    if (normalized === verb) return null;
    if (!normalized.startsWith(`${verb} `)) continue;

    const remainder = normalized.slice(verb.length + 1).trim();
    if (!remainder) return null;

    const appId = matchAppId(remainder, resolvedAliases);
    if (appId) return { type: "open_app", appId };
    return null;
  }

  return null;
}
