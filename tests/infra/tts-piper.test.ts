import { describe, expect, it } from "vitest";
import { createPiperTts } from "../../src/infra/shared/tts-piper.js";

describe("createPiperTts", () => {
  it("synthesizes wav with piper and plays it", async () => {
    const files = new Map<string, string>();
    const played: string[] = [];
    const ran: Array<{ command: string; args: string[]; stdin?: string }> = [];

    const tts = createPiperTts({
      binPath: "/sidecars/piper",
      modelPath: "/models/pt_BR-faber-medium.onnx",
      mkdtemp: async () => "/tmp/voz-tts",
      playWav: async (path) => {
        played.push(path);
      },
      runCommand: async (command, args, options) => {
        ran.push({ command, args, stdin: options?.stdin });
        files.set(args[args.indexOf("--output_file") + 1], "wav");
        return { stdout: "", stderr: "", code: 0 };
      },
    });

    await tts.speak("Quer abrir Calculadora?");

    expect(ran).toEqual([
      {
        command: "/sidecars/piper",
        args: ["--model", "/models/pt_BR-faber-medium.onnx", "--output_file", "/tmp/voz-tts/speech.wav"],
        stdin: "Quer abrir Calculadora?",
      },
    ]);
    expect(played).toEqual(["/tmp/voz-tts/speech.wav"]);
    expect(files.has("/tmp/voz-tts/speech.wav")).toBe(true);
  });

  it("throws when piper exits non-zero", async () => {
    const tts = createPiperTts({
      binPath: "piper",
      modelPath: "voice.onnx",
      mkdtemp: async () => "/tmp/voz-tts",
      playWav: async () => {},
      runCommand: async () => ({ stdout: "", stderr: "bad model", code: 2 }),
    });

    await expect(tts.speak("oi")).rejects.toThrow(/piper/i);
  });
});
