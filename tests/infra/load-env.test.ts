import { describe, expect, it } from "vitest";
import {
  applyParsedEnv,
  loadEnvFile,
  parseEnvFile,
} from "../../src/infra/shared/load-env.js";

describe("parseEnvFile", () => {
  it("reads KEY=value pairs and ignores comments", () => {
    const parsed = parseEnvFile(`
# comment
GEMINI_API_KEY=abc123
VOZ_PC_PORT=9847
`);
    expect(parsed).toEqual({
      GEMINI_API_KEY: "abc123",
      VOZ_PC_PORT: "9847",
    });
  });

  it("strips surrounding quotes", () => {
    expect(parseEnvFile('GEMINI_API_KEY="abc 123"')).toEqual({
      GEMINI_API_KEY: "abc 123",
    });
  });
});

describe("applyParsedEnv", () => {
  it("does not override keys already in the environment", () => {
    const env: NodeJS.ProcessEnv = { GEMINI_API_KEY: "from-shell" };
    applyParsedEnv({ GEMINI_API_KEY: "from-file", VOZ_PC_PORT: "9847" }, env);
    expect(env).toEqual({ GEMINI_API_KEY: "from-shell", VOZ_PC_PORT: "9847" });
  });
});

describe("loadEnvFile", () => {
  it("loads a .env file into the environment", async () => {
    const env: NodeJS.ProcessEnv = {};
    const loaded = await loadEnvFile({
      path: "/tmp/voz-pc.env",
      env,
      readFile: async () => "GEMINI_API_KEY=from-dotenv\n",
    });
    expect(loaded).toBe(true);
    expect(env.GEMINI_API_KEY).toBe("from-dotenv");
  });

  it("returns false when the file is missing", async () => {
    const error = Object.assign(new Error("missing"), { code: "ENOENT" });
    const loaded = await loadEnvFile({
      path: "/tmp/missing.env",
      env: {},
      readFile: async () => {
        throw error;
      },
    });
    expect(loaded).toBe(false);
  });
});

