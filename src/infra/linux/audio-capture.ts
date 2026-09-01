import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSpawnAudioCapture } from "../shared/audio-capture.js";
import type { AudioCapturePort } from "../../domain/ports.js";

export function linuxRecordArgs(wavPath: string): { command: string; args: string[] } {
  return {
    command: "pw-record",
    args: ["--rate=16000", "--channels=1", "--format=s16", "--container=wav", wavPath],
  };
}

export function createLinuxAudioCapture(wavPath = join(tmpdir(), `voz-pc-${process.pid}.wav`)): AudioCapturePort {
  return createSpawnAudioCapture({
    wavPath,
    readFile: (path) => readFile(path),
    async startRecorder() {
      const { command, args } = linuxRecordArgs(wavPath);
      const child = spawn(command, args, { stdio: "ignore" });
      return {
        stop() {
          return new Promise((resolve, reject) => {
            child.once("error", reject);
            child.once("exit", () => resolve());
            child.kill("SIGINT");
          });
        },
      };
    },
  });
}
