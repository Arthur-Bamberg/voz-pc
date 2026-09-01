import type { SttPort } from "../../domain/ports.js";
import type { RunCommand } from "./run-command.js";

export type WhisperFs = {
  mkdtemp: (prefix: string) => Promise<string>;
  writeFile: (path: string, data: Uint8Array) => Promise<void>;
  readFile: (path: string) => Promise<string | Uint8Array>;
};

export type WhisperSttOptions = WhisperFs & {
  binPath: string;
  modelPath: string;
  language?: string;
  runCommand: RunCommand;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
};

export function parseWhisperTranscript(raw: string): string {
  return raw
    .split("\n")
    .map((line) =>
      line
        .replace(/\[\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}\]/g, "")
        .replace(/\[BLANK_AUDIO\]/gi, "")
        .trim(),
    )
    .filter((line) => line.length > 0 && !line.startsWith("whisper_") && !line.startsWith("main:"))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function isEnoent(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

export function createWhisperStt(options: WhisperSttOptions): SttPort {
  const language = options.language ?? "pt";

  return {
    async transcribe(audio) {
      const dir = await options.mkdtemp("voz-stt-");
      const wavPath = `${dir}/input.wav`;
      await options.writeFile(wavPath, audio);

      const result = await options.runCommand(
        options.binPath,
        ["-m", options.modelPath, "-f", wavPath, "-l", language, "-nt", "-np", "-otxt"],
        { cwd: options.cwd, env: options.env },
      );

      if (result.code !== 0) {
        throw new Error(`whisper-cli failed (${result.code}): ${result.stderr || result.stdout}`);
      }

      let raw = result.stdout;
      try {
        const txt = await options.readFile(`${wavPath}.txt`);
        raw = typeof txt === "string" ? txt : new TextDecoder().decode(txt);
      } catch (error) {
        if (!isEnoent(error)) throw error;
      }

      return parseWhisperTranscript(raw);
    },
  };
}
