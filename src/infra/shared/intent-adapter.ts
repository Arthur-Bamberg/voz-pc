import type {
  IntentAdapterPort,
  PossibleConfirmationCommand,
  PossibleOpenCommand,
} from "../../domain/ports.js";

function extractJsonObject(raw: string): string | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? raw).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  return candidate.slice(start, end + 1);
}

function parseAdaptedJson(raw: string): Record<string, unknown> | null {
  const json = extractJsonObject(raw);
  if (!json) return null;
  try {
    const parsed: unknown = JSON.parse(json);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

export function parseAdaptedAppId(raw: string): string | null {
  const parsed = parseAdaptedJson(raw);
  if (typeof parsed?.appId === "string" && parsed.appId.length > 0) {
    return parsed.appId;
  }
  return null;
}

export function parseAdaptedConfirmation(raw: string): "confirm" | "cancel" | null {
  const parsed = parseAdaptedJson(raw);
  if (parsed?.response === "confirm" || parsed?.response === "cancel") {
    return parsed.response;
  }
  return null;
}

export function buildAdaptOpenAppSystemPrompt(possible: PossibleOpenCommand[]): string {
  const lines = possible.map((item) => `- appId: ${item.appId} | ${item.phrases.join(" | ")}`);
  return [
    "Valide se a transcrição de voz, mesmo com typo ou erro de fala, é um dos comandos possíveis.",
    "Se for, responda {\"appId\":\"<id da lista>\"}. Se não for nenhum desses comandos, {\"appId\":null}.",
    "Não chute o app mais comum. Não explique.",
    "Comandos possíveis (somente estes):",
    ...lines,
  ].join("\n");
}

export function buildAdaptConfirmationSystemPrompt(
  possible: PossibleConfirmationCommand[],
): string {
  const lines = possible.map((item) => `- ${item.response}: ${item.phrases.join(" | ")}`);
  return [
    "Valide se a transcrição de voz, mesmo com typo ou erro de fala, é uma das opções.",
    "Se for aceite, responda {\"response\":\"confirm\"}. Se for recusa, {\"response\":\"cancel\"}. Se não for nenhuma, {\"response\":null}.",
    "Não chute. Não explique.",
    "Opções (somente estas):",
    ...lines,
  ].join("\n");
}

export function buildAdaptOpenAppUserPrompt(voiceCommand: string): string {
  return `Transcrição: ${JSON.stringify(voiceCommand)}`;
}

export type ChatTurn = {
  system: string;
  user: string;
};

export type ChatComplete = (turn: ChatTurn) => Promise<string>;

function cachedPrompt<T>(build: (value: T) => string): (value: T) => string {
  let cachedKey = "";
  let cachedSystem = "";
  return (value) => {
    const key = JSON.stringify(value);
    if (key !== cachedKey) {
      cachedKey = key;
      cachedSystem = build(value);
    }
    return cachedSystem;
  };
}

export function createChatIntentAdapter(options: { complete: ChatComplete }): IntentAdapterPort {
  const openSystem = cachedPrompt(buildAdaptOpenAppSystemPrompt);
  const confirmationSystem = cachedPrompt(buildAdaptConfirmationSystemPrompt);

  return {
    async adaptOpenApp(voiceCommand, possible) {
      const raw = await options.complete({
        system: openSystem(possible),
        user: buildAdaptOpenAppUserPrompt(voiceCommand),
      });
      const appId = parseAdaptedAppId(raw);
      if (!appId) return null;
      if (!possible.some((item) => item.appId === appId)) return null;
      return appId;
    },
    async adaptConfirmation(voiceCommand, possible) {
      const raw = await options.complete({
        system: confirmationSystem(possible),
        user: buildAdaptOpenAppUserPrompt(voiceCommand),
      });
      const response = parseAdaptedConfirmation(raw);
      if (!response) return null;
      if (!possible.some((item) => item.response === response)) return null;
      return response;
    },
  };
}

export function describeCaughtError(error: unknown): string {
  if (!(error instanceof Error)) return String(error).replace(/\s+/g, " ").slice(0, 400);
  const label = error.name && error.name !== "Error" ? `${error.name}: ${error.message}` : error.message;
  return label.replace(/\s+/g, " ").slice(0, 400);
}

export function createLoggingChatComplete(
  inner: ChatComplete,
  write: (line: string) => void,
): ChatComplete {
  return async (turn) => {
    try {
      const raw = await inner(turn);
      const text = raw.trim().length === 0 ? "(vazio)" : raw.trim();
      write(`Adaptação (IA): ${text}`);
      return raw;
    } catch (error) {
      write(`Adaptação (IA): (falhou) ${describeCaughtError(error)}`);
      throw error;
    }
  };
}

export function createLoggingIntentAdapter(
  inner: IntentAdapterPort,
  write: (line: string) => void,
): IntentAdapterPort {
  return {
    async adaptOpenApp(voiceCommand, possible) {
      const appId = await inner.adaptOpenApp(voiceCommand, possible);
      if (appId) {
        const label = possible.find((item) => item.appId === appId)?.label ?? appId;
        write(`Adaptação: abrir ${label} — Enter confirma, Esc cancela`);
      } else {
        write("Adaptação: (não mapeou)");
      }
      return appId;
    },
    async adaptConfirmation(voiceCommand, possible) {
      const response = await inner.adaptConfirmation(voiceCommand, possible);
      if (response === "confirm") write("Adaptação: sim");
      if (response === "cancel") write("Adaptação: não");
      if (!response) write("Adaptação: (não mapeou)");
      return response;
    },
  };
}

export const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";
export const DEFAULT_GEMINI_THINKING_LEVEL = "MINIMAL";
const GEMINI_GENERATE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

export function createGeminiChatComplete(options: {
  apiKey: string;
  model?: string;
  thinkingLevel?: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
}): ChatComplete {
  const fetchImpl = options.fetch ?? fetch;
  const model = options.model ?? DEFAULT_GEMINI_MODEL;
  const thinkingLevel = options.thinkingLevel ?? DEFAULT_GEMINI_THINKING_LEVEL;
  const timeoutMs = options.timeoutMs ?? 30_000;

  return async ({ system, user }) => {
    const response = await fetchImpl(`${GEMINI_GENERATE_URL}/${model}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": options.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel },
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const rawBody = await response.text();
    if (!response.ok) {
      throw new Error(
        `gemini failed (${response.status}): ${rawBody.replace(/\s+/g, " ").slice(0, 400)}`,
      );
    }
    const data = JSON.parse(rawBody) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    return data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  };
}

export function readGeminiApiKey(env: NodeJS.ProcessEnv = process.env): string | undefined {
  return env.GEMINI_API_KEY ?? env.GOOGLE_API_KEY ?? env.VOZ_PC_GEMINI_API_KEY;
}

export function readGeminiModel(env: NodeJS.ProcessEnv = process.env): string {
  const model = env.VOZ_PC_LLM_MODEL?.trim();
  return model && model.length > 0 ? model : DEFAULT_GEMINI_MODEL;
}

export function readGeminiThinkingLevel(env: NodeJS.ProcessEnv = process.env): string {
  const level = env.VOZ_PC_LLM_THINKING_LEVEL?.trim();
  return level && level.length > 0 ? level.toUpperCase() : DEFAULT_GEMINI_THINKING_LEVEL;
}
