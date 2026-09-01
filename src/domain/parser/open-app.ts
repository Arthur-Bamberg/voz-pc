import type { OpenAppIntent } from "../intent.js";
import { normalizeVoiceText } from "../normalize-voice.js";

const OPEN_VERBS = ["abrir", "abre", "abra", "abramos"];

const DEFAULT_ALIASES: Record<string, string[]> = {
  chrome: ["chrome", "google chrome", "google"],
  firefox: ["firefox", "mozilla"],
  files: ["arquivos", "arquivo", "pastas", "pasta", "explorer", "nautilus"],
  terminal: ["terminal", "console"],
  calculator: ["calculadora", "calc"],
};

function stripArticles(text: string): string {
  return text.replace(/\b(o|a|os|as|um|uma)\b/g, " ").replace(/\s+/g, " ").trim();
}

export function parseOpenApp(
  text: string,
  aliases: Record<string, string[]> = DEFAULT_ALIASES,
): OpenAppIntent | null {
  const normalized = stripArticles(normalizeVoiceText(text));

  for (const verb of OPEN_VERBS) {
    if (normalized.startsWith(`${verb} `)) {
      const remainder = normalized.slice(verb.length + 1).trim();
      if (!remainder) return null;

      for (const [appId, appAliases] of Object.entries(aliases)) {
        const candidates = [appId, ...appAliases].map((alias) => normalizeVoiceText(alias));
        if (candidates.includes(remainder)) {
          return { type: "open_app", appId };
        }
      }
      return null;
    }
  }

  return null;
}
