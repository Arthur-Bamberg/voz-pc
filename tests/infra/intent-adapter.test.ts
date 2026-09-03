import { describe, expect, it } from "vitest";
import {
  buildAdaptConfirmationSystemPrompt,
  buildAdaptOpenAppSystemPrompt,
  buildAdaptOpenAppUserPrompt,
  createChatIntentAdapter,
  createLoggingIntentAdapter,
  createLoggingChatComplete,
  createGeminiChatComplete,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_GEMINI_THINKING_LEVEL,
  describeCaughtError,
  parseAdaptedAppId,
  parseAdaptedConfirmation,
  readGeminiModel,
  readGeminiThinkingLevel,
} from "../../src/infra/shared/intent-adapter.js";
import type { PossibleConfirmationCommand, PossibleOpenCommand } from "../../src/domain/ports.js";

describe("describeCaughtError", () => {
  it("keeps a TimeoutError name so the operator sees aborts", () => {
    const error = new Error("The operation was aborted due to timeout");
    error.name = "TimeoutError";
    expect(describeCaughtError(error)).toBe(
      "TimeoutError: The operation was aborted due to timeout",
    );
  });
});

describe("parseAdaptedConfirmation", () => {
  it("reads confirm or cancel from JSON", () => {
    expect(parseAdaptedConfirmation('{"response":"confirm"}')).toBe("confirm");
    expect(parseAdaptedConfirmation('{"response":"cancel"}')).toBe("cancel");
  });

  it("returns null when the model declines to map", () => {
    expect(parseAdaptedConfirmation('{"response":null}')).toBeNull();
  });
});

describe("parseAdaptedAppId", () => {
  it("reads an allowlist appId from JSON", () => {
    expect(parseAdaptedAppId('{"appId":"calculator"}')).toBe("calculator");
  });

  it("returns null when the model declines to map", () => {
    expect(parseAdaptedAppId('{"appId":null}')).toBeNull();
  });

  it("reads appId from a fenced JSON payload", () => {
    expect(parseAdaptedAppId('```json\n{"appId":"chrome"}\n```')).toBe("chrome");
  });

  it("returns null for invalid JSON", () => {
    expect(parseAdaptedAppId("não sei")).toBeNull();
  });
});

const possible: PossibleOpenCommand[] = [
  {
    appId: "calculator",
    label: "Calculadora",
    phrases: ["abrir Calculadora", "calculadora", "calc"],
  },
  {
    appId: "chrome",
    label: "Chrome",
    phrases: ["abrir Chrome", "chrome"],
  },
];

const confirmationPossible: PossibleConfirmationCommand[] = [
  { response: "confirm", phrases: ["sim", "confirmo"] },
  { response: "cancel", phrases: ["nao", "não", "cancela"] },
];

describe("cached adapt prompts", () => {
  it("keeps possible commands in the cached system prompt and the transcript in the user turn", () => {
    const system = buildAdaptOpenAppSystemPrompt(possible);
    const user = buildAdaptOpenAppUserPrompt("Abrei o calculador.");

    expect(system).toContain("calculator");
    expect(system).toContain("abrir Calculadora");
    expect(system).toContain("chrome");
    expect(system).not.toContain("Abrei o calculador.");
    expect(user).toContain("Abrei o calculador.");
    expect(user).not.toContain("calculator");
  });

  it("keeps confirmation options in the cached system prompt and the transcript in the user turn", () => {
    const system = buildAdaptConfirmationSystemPrompt(confirmationPossible);
    const user = buildAdaptOpenAppUserPrompt("cim");

    expect(system).toContain("confirm");
    expect(system).toContain("sim");
    expect(system).toContain("cancel");
    expect(system).toContain("não");
    expect(system).not.toContain("cim");
    expect(user).toContain("cim");
  });
});

describe("createChatIntentAdapter", () => {
  it("sends the cached system prompt and the transcript separately", async () => {
    const turns: Array<{ system: string; user: string }> = [];
    const adapter = createChatIntentAdapter({
      complete: async (turn) => {
        turns.push(turn);
        return '{"appId":"calculator"}';
      },
    });

    const appId = await adapter.adaptOpenApp("Abrei o calculador.", possible);

    expect(appId).toBe("calculator");
    expect(turns).toHaveLength(1);
    expect(turns[0]?.system).toContain("abrir Calculadora");
    expect(turns[0]?.system).not.toContain("Abrei o calculador.");
    expect(turns[0]?.user).toContain("Abrei o calculador.");
  });

  it("reuses the same system prompt when possible commands do not change", async () => {
    const systems: string[] = [];
    const adapter = createChatIntentAdapter({
      complete: async ({ system }) => {
        systems.push(system);
        return '{"appId":"calculator"}';
      },
    });

    await adapter.adaptOpenApp("Abrei o calculador.", possible);
    await adapter.adaptOpenApp("abrir a coupla dore", possible);

    expect(systems).toHaveLength(2);
    expect(systems[0]).toBe(systems[1]);
  });

  it("returns null when the model appId is not a possible command", async () => {
    const adapter = createChatIntentAdapter({
      async complete() {
        return '{"appId":"spotify"}';
      },
    });

    await expect(adapter.adaptOpenApp("abrir spotify", possible)).resolves.toBeNull();
  });

  it("maps a confirmation typo onto confirm using the cached options", async () => {
    const turns: Array<{ system: string; user: string }> = [];
    const adapter = createChatIntentAdapter({
      complete: async (turn) => {
        turns.push(turn);
        return '{"response":"confirm"}';
      },
    });

    await expect(adapter.adaptConfirmation("cim", confirmationPossible)).resolves.toBe("confirm");
    expect(turns).toHaveLength(1);
    expect(turns[0]?.system).toContain("sim");
    expect(turns[0]?.system).not.toContain("cim");
    expect(turns[0]?.user).toContain("cim");
  });

  it("returns null when the model confirmation is not an option", async () => {
    const adapter = createChatIntentAdapter({
      async complete() {
        return '{"response":"maybe"}';
      },
    });

    await expect(adapter.adaptConfirmation("talvez", confirmationPossible)).resolves.toBeNull();
  });
});

describe("createGeminiChatComplete", () => {
  it("defaults to gemini-3.6-flash with MINIMAL thinking", () => {
    expect(DEFAULT_GEMINI_MODEL).toBe("gemini-3.6-flash");
    expect(DEFAULT_GEMINI_THINKING_LEVEL).toBe("MINIMAL");
  });

  it("posts the configured thinking level", async () => {
    const bodies: unknown[] = [];
    const complete = createGeminiChatComplete({
      apiKey: "test-key",
      thinkingLevel: "LOW",
      fetch: async (_input, init) => {
        bodies.push(JSON.parse(String(init?.body)));
        return new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: '{"appId":"calculator"}' }] } }],
          }),
          { status: 200 },
        );
      },
    });

    await complete({ system: "comandos possíveis", user: "Abrei o calculador." });
    expect(bodies).toEqual([
      {
        systemInstruction: { parts: [{ text: "comandos possíveis" }] },
        contents: [{ role: "user", parts: [{ text: "Abrei o calculador." }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: "LOW" },
        },
      },
    ]);
  });

  it("posts system instruction and transcript to Gemini generateContent", async () => {
    const bodies: unknown[] = [];
    const complete = createGeminiChatComplete({
      apiKey: "test-key",
      model: DEFAULT_GEMINI_MODEL,
      fetch: async (input, init) => {
        expect(String(input)).toBe(
          `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_MODEL}:generateContent`,
        );
        expect((init?.headers as Record<string, string>)["x-goog-api-key"]).toBe("test-key");
        bodies.push(JSON.parse(String(init?.body)));
        return new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: '{"appId":"calculator"}' }] } }],
          }),
          { status: 200 },
        );
      },
    });

    await expect(
      complete({ system: "comandos possíveis", user: "Abrei o calculador." }),
    ).resolves.toBe('{"appId":"calculator"}');
    expect(bodies).toEqual([
      {
        systemInstruction: { parts: [{ text: "comandos possíveis" }] },
        contents: [{ role: "user", parts: [{ text: "Abrei o calculador." }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: "MINIMAL" },
        },
      },
    ]);
  });

  it("includes HTTP status and body when Gemini rejects the request", async () => {
    const complete = createGeminiChatComplete({
      apiKey: "test-key",
      fetch: async () =>
        new Response(JSON.stringify({ error: { message: "API key not valid" } }), { status: 400 }),
    });

    await expect(
      complete({ system: "comandos possíveis", user: "Abrei o calculador." }),
    ).rejects.toThrow("gemini failed (400): {\"error\":{\"message\":\"API key not valid\"}}");
  });
});

describe("readGeminiModel", () => {
  it("reads VOZ_PC_LLM_MODEL and falls back to the default", () => {
    expect(readGeminiModel({ VOZ_PC_LLM_MODEL: "gemini-3.5-flash-lite" })).toBe(
      "gemini-3.5-flash-lite",
    );
    expect(readGeminiModel({})).toBe(DEFAULT_GEMINI_MODEL);
    expect(readGeminiModel({ VOZ_PC_LLM_MODEL: "  " })).toBe(DEFAULT_GEMINI_MODEL);
  });
});

describe("readGeminiThinkingLevel", () => {
  it("reads VOZ_PC_LLM_THINKING_LEVEL in uppercase and falls back to MINIMAL", () => {
    expect(readGeminiThinkingLevel({ VOZ_PC_LLM_THINKING_LEVEL: "low" })).toBe("LOW");
    expect(readGeminiThinkingLevel({})).toBe(DEFAULT_GEMINI_THINKING_LEVEL);
    expect(readGeminiThinkingLevel({ VOZ_PC_LLM_THINKING_LEVEL: "" })).toBe(
      DEFAULT_GEMINI_THINKING_LEVEL,
    );
  });
});

describe("createLoggingIntentAdapter", () => {
  it("writes the adapted intent so the operator can confirm with Enter", async () => {
    const lines: string[] = [];
    const adapter = createLoggingIntentAdapter(
      {
        async adaptOpenApp() {
          return "calculator";
        },
        async adaptConfirmation() {
          return null;
        },
      },
      (line) => {
        lines.push(line);
      },
    );

    await expect(adapter.adaptOpenApp("Abrei o calculador.", possible)).resolves.toBe(
      "calculator",
    );
    expect(lines).toEqual([
      "Adaptação: abrir Calculadora — Enter confirma, Esc cancela",
    ]);
  });

  it("writes the adapted confirmation for the operator", async () => {
    const lines: string[] = [];
    const adapter = createLoggingIntentAdapter(
      {
        async adaptOpenApp() {
          return null;
        },
        async adaptConfirmation() {
          return "confirm";
        },
      },
      (line) => {
        lines.push(line);
      },
    );

    await expect(adapter.adaptConfirmation("cim", confirmationPossible)).resolves.toBe(
      "confirm",
    );
    expect(lines).toEqual(["Adaptação: sim"]);
  });

  it("writes when adaptation does not map a confirmation reply", async () => {
    const lines: string[] = [];
    const adapter = createLoggingIntentAdapter(
      {
        async adaptOpenApp() {
          return null;
        },
        async adaptConfirmation() {
          return null;
        },
      },
      (line) => {
        lines.push(line);
      },
    );

    await expect(adapter.adaptConfirmation("talvez", confirmationPossible)).resolves.toBeNull();
    expect(lines).toEqual(["Adaptação: (não mapeou)"]);
  });

  it("writes when adaptation does not map an open voice command", async () => {
    const lines: string[] = [];
    const adapter = createLoggingIntentAdapter(
      {
        async adaptOpenApp() {
          return null;
        },
        async adaptConfirmation() {
          return null;
        },
      },
      (line) => {
        lines.push(line);
      },
    );

    await expect(adapter.adaptOpenApp("Abrir cromni.", possible)).resolves.toBeNull();
    expect(lines).toEqual(["Adaptação: (não mapeou)"]);
  });
});

describe("createLoggingChatComplete", () => {
  it("writes the raw model return for the operator", async () => {
    const lines: string[] = [];
    const complete = createLoggingChatComplete(async () => '{"appId":"chrome"}', (line) => {
      lines.push(line);
    });

    await expect(
      complete({ system: "comandos possíveis", user: "Abrir cromni." }),
    ).resolves.toBe('{"appId":"chrome"}');
    expect(lines).toEqual(['Adaptação (IA): {"appId":"chrome"}']);
  });

  it("marks an empty model return as vazio", async () => {
    const lines: string[] = [];
    const complete = createLoggingChatComplete(async () => "   ", (line) => {
      lines.push(line);
    });

    await expect(complete({ system: "comandos possíveis", user: "Abrir cromni." })).resolves.toBe(
      "   ",
    );
    expect(lines).toEqual(["Adaptação (IA): (vazio)"]);
  });

  it("writes when the model call fails", async () => {
    const lines: string[] = [];
    const complete = createLoggingChatComplete(
      async () => {
        throw new Error("gemini down");
      },
      (line) => {
        lines.push(line);
      },
    );

    await expect(complete({ system: "comandos possíveis", user: "Abrir cromni." })).rejects.toThrow(
      "gemini down",
    );
    expect(lines).toEqual(["Adaptação (IA): (falhou) gemini down"]);
  });
});

