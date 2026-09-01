import { describe, expect, it } from "vitest";
import { createSpawnAudioCapture } from "../../src/infra/shared/audio-capture.js";
import { linuxRecordArgs } from "../../src/infra/linux/audio-capture.js";

describe("linuxRecordArgs", () => {
  it("records 16kHz mono WAV via pw-record", () => {
    expect(linuxRecordArgs("/tmp/rec.wav")).toEqual({
      command: "pw-record",
      args: ["--rate=16000", "--channels=1", "--format=s16", "--container=wav", "/tmp/rec.wav"],
    });
  });
});

describe("createSpawnAudioCapture", () => {
  it("starts recorder and returns wav bytes on stop", async () => {
    let running = false;
    const files = new Map<string, Uint8Array>([["/tmp/rec.wav", new Uint8Array([82, 73, 70, 70])]]);

    const audio = createSpawnAudioCapture({
      wavPath: "/tmp/rec.wav",
      startRecorder: async () => {
        running = true;
        return {
          async stop() {
            running = false;
          },
        };
      },
      readFile: async (path) => {
        const data = files.get(path);
        if (!data) throw new Error(`missing ${path}`);
        return data;
      },
    });

    await audio.start();
    expect(running).toBe(true);

    const wav = await audio.stop();
    expect(running).toBe(false);
    expect(wav).toEqual(files.get("/tmp/rec.wav"));
  });

  it("throws if stop is called before start", async () => {
    const audio = createSpawnAudioCapture({
      wavPath: "/tmp/rec.wav",
      startRecorder: async () => ({ async stop() {} }),
      readFile: async () => new Uint8Array(),
    });

    await expect(audio.stop()).rejects.toThrow(/not recording/i);
  });
});
