import { describe, expect, it } from "vitest";
import { createRotatingLog } from "../../src/diag/rotating-log.js";

describe("createRotatingLog", () => {
  it("appends lines and rotates when max bytes exceeded", async () => {
    const files = new Map<string, string>();
    const logPath = "/tmp/voz-pc/diag.log";

    const appendFile = async (path: string, data: string) => {
      files.set(path, (files.get(path) ?? "") + data);
    };
    const stat = async (path: string) => ({ size: (files.get(path) ?? "").length });
    const rename = async (from: string, to: string) => {
      files.set(to, files.get(from) ?? "");
      files.delete(from);
    };
    const unlink = async (path: string) => {
      files.delete(path);
    };

    const log = createRotatingLog({
      filePath: logPath,
      maxBytes: 20,
      appendFile,
      stat,
      rename,
      unlink,
    });

    await log.write("linha 1");
    await log.write("linha 2 longa o suficiente");

    expect(files.get(logPath)).toBe("linha 2 longa o suficiente\n");
    expect(files.get(`${logPath}.1`)).toBe("linha 1\n");
  });
});
