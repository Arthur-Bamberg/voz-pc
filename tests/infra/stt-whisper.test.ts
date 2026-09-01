import { describe, expect, it } from "vitest";
import { createWhisperStt } from "../../src/infra/shared/stt-whisper.js";
import { parseWhisperTranscript } from "../../src/infra/shared/stt-whisper.js";

describe("parseWhisperTranscript", () => {
  it("strips timestamps and blank-audio markers", () => {
    const raw = `[00:00:00.000 --> 00:00:01.800]  Abrir calculadora.\n[BLANK_AUDIO]`;
    expect(parseWhisperTranscript(raw)).toBe("Abrir calculadora.");
  });
});

describe("createWhisperStt", () => {
  it("writes wav, runs whisper-cli, and returns transcript from txt output", async () => {
    const files = new Map<string, Uint8Array | string>();
    const ran: Array<{ command: string; args: string[] }> = [];

    const stt = createWhisperStt({
      binPath: "/sidecars/whisper-cli",
      modelPath: "/models/ggml-base.bin",
      mkdtemp: async () => "/tmp/voz-stt",
      writeFile: async (path, data) => {
        files.set(path, data);
      },
      readFile: async (path) => {
        const value = files.get(path);
        if (value === undefined) throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
        return value;
      },
      runCommand: async (command, args) => {
        ran.push({ command, args });
        const wav = args[args.indexOf("-f") + 1];
        files.set(`${wav}.txt`, " abrir calculadora.\n");
        return { stdout: "", stderr: "", code: 0 };
      },
    });

    const audio = new Uint8Array([1, 2, 3, 4]);
    const text = await stt.transcribe(audio);

    expect(text).toBe("abrir calculadora.");
    expect(files.get("/tmp/voz-stt/input.wav")).toEqual(audio);
    expect(ran).toEqual([
      {
        command: "/sidecars/whisper-cli",
        args: ["-m", "/models/ggml-base.bin", "-f", "/tmp/voz-stt/input.wav", "-l", "pt", "-nt", "-np", "-otxt"],
      },
    ]);
  });

  it("falls back to stdout when txt file is missing", async () => {
    const stt = createWhisperStt({
      binPath: "whisper-cli",
      modelPath: "ggml-base.bin",
      mkdtemp: async () => "/tmp/voz-stt",
      writeFile: async () => {},
      readFile: async () => {
        throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      },
      runCommand: async () => ({
        stdout: "abrir firefox",
        stderr: "",
        code: 0,
      }),
    });

    await expect(stt.transcribe(new Uint8Array([0]))).resolves.toBe("abrir firefox");
  });

  it("throws when whisper-cli exits non-zero", async () => {
    const stt = createWhisperStt({
      binPath: "whisper-cli",
      modelPath: "ggml-base.bin",
      mkdtemp: async () => "/tmp/voz-stt",
      writeFile: async () => {},
      readFile: async () => {
        throw Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      },
      runCommand: async () => ({ stdout: "", stderr: "missing model", code: 1 }),
    });

    await expect(stt.transcribe(new Uint8Array([0]))).rejects.toThrow(/whisper-cli/i);
  });
});
