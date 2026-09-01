import { describe, expect, it } from "vitest";
import { ensureSidecars } from "../../src/infra/shared/ensure-sidecars.js";

describe("ensureSidecars", () => {
  it("returns existing binaries and models without downloading", async () => {
    const downloaded: string[] = [];

    const paths = await ensureSidecars({
      appDataDir: "/data",
      platform: "linux",
      exists: async (path) => path.includes("/models/"),
      mkdir: async () => {},
      download: async (url) => {
        downloaded.push(url);
      },
      extractArchive: async () => {},
      findFile: async (dir, name) => {
        if (name === "whisper-cli") return `${dir}/whisper-cli`;
        if (name === "piper") return `${dir}/piper`;
        return null;
      },
    });

    expect(downloaded).toEqual([]);
    expect(paths).toEqual({
      whisperBin: "/data/sidecars/whisper-dist/whisper-cli",
      whisperModel: "/data/models/ggml-base.bin",
      piperBin: "/data/sidecars/piper/piper",
      piperModel: "/data/models/pt_BR-faber-medium.onnx",
    });
  });

  it("downloads missing binaries and models then extracts", async () => {
    const existing = new Set<string>();
    const downloaded: string[] = [];
    const extracted: string[] = [];

    const paths = await ensureSidecars({
      appDataDir: "/data",
      platform: "linux",
      exists: async (path) => existing.has(path),
      mkdir: async () => {},
      download: async (url, dest) => {
        downloaded.push(url);
        existing.add(dest);
      },
      extractArchive: async (archive, dest) => {
        extracted.push(`${archive}->${dest}`);
        if (dest.endsWith("whisper-dist")) existing.add(`${dest}/whisper-cli`);
        if (dest.endsWith("piper")) existing.add(`${dest}/piper`);
      },
      findFile: async (dir, name) => {
        const candidate = `${dir}/${name}`;
        return existing.has(candidate) ? candidate : null;
      },
    });

    expect(downloaded.length).toBeGreaterThan(0);
    expect(extracted.length).toBe(2);
    expect(paths.whisperBin).toBe("/data/sidecars/whisper-dist/whisper-cli");
    expect(paths.piperBin).toBe("/data/sidecars/piper/piper");
    expect(paths.whisperModel).toBe("/data/models/ggml-base.bin");
    expect(paths.piperModel).toBe("/data/models/pt_BR-faber-medium.onnx");
  });
});
