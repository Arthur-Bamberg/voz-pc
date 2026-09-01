import type { TtsPort } from "../../domain/ports.js";
import type { RunCommand } from "./run-command.js";

export type PiperTtsOptions = {
  binPath: string;
  modelPath: string;
  mkdtemp: (prefix: string) => Promise<string>;
  runCommand: RunCommand;
  playWav: (path: string) => Promise<void>;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  espeakDataDir?: string;
};

export function createPiperTts(options: PiperTtsOptions): TtsPort {
  return {
    async speak(text) {
      const dir = await options.mkdtemp("voz-tts-");
      const wavPath = `${dir}/speech.wav`;

      const args = ["--model", options.modelPath, "--output_file", wavPath];
      if (options.espeakDataDir) {
        args.push("--espeak_data", options.espeakDataDir);
      }
      const result = await options.runCommand(options.binPath, args, {
        stdin: text,
        cwd: options.cwd,
        env: options.env,
      });

      if (result.code !== 0) {
        throw new Error(`piper failed (${result.code}): ${result.stderr || result.stdout}`);
      }

      await options.playWav(wavPath);
    },
  };
}
