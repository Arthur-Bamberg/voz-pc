import type { AudioCapturePort } from "../../domain/ports.js";

export type RecorderHandle = {
  stop: () => Promise<void>;
};

export type SpawnAudioCaptureOptions = {
  wavPath: string;
  startRecorder: () => Promise<RecorderHandle>;
  readFile: (path: string) => Promise<Uint8Array>;
};

export function createSpawnAudioCapture(options: SpawnAudioCaptureOptions): AudioCapturePort {
  let handle: RecorderHandle | null = null;

  return {
    async start() {
      if (handle) return;
      handle = await options.startRecorder();
    },
    async stop() {
      if (!handle) {
        throw new Error("Audio capture is not recording");
      }
      await handle.stop();
      handle = null;
      return options.readFile(options.wavPath);
    },
  };
}
