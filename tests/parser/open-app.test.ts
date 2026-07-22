import { describe, expect, it } from "vitest";
import { parseOpenApp } from "../../src/parser/open-app.js";

describe("parseOpenApp", () => {
  it("parses 'abrir chrome' into open_app intent", () => {
    const result = parseOpenApp("abrir chrome");
    expect(result).toEqual({ type: "open_app", appId: "chrome" });
  });

  it("parses 'abre o firefox' into open_app intent", () => {
    const result = parseOpenApp("abre o firefox");
    expect(result).toEqual({ type: "open_app", appId: "firefox" });
  });

  it("parses 'abrir arquivos' into files app", () => {
    expect(parseOpenApp("abrir arquivos")).toEqual({ type: "open_app", appId: "files" });
  });

  it("parses 'abrir terminal' into terminal app", () => {
    expect(parseOpenApp("abrir terminal")).toEqual({ type: "open_app", appId: "terminal" });
  });

  it("parses 'abrir calculadora' into calculator app", () => {
    expect(parseOpenApp("abrir calculadora")).toEqual({ type: "open_app", appId: "calculator" });
  });

  it("returns null for unknown app", () => {
    expect(parseOpenApp("abrir spotify")).toBeNull();
  });

  it("returns null for non-open phrases", () => {
    expect(parseOpenApp("fechar chrome")).toBeNull();
  });
});
