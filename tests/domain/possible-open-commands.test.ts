import { describe, expect, it } from "vitest";
import { listPossibleOpenCommands } from "../../src/domain/possible-open-commands.js";
import { loadTestConfig } from "../../src/infra/mocks/test-ports.js";

describe("listPossibleOpenCommands", () => {
  it("lists allowlist ids with open phrases for the adapter", async () => {
    const config = await loadTestConfig();
    const possible = listPossibleOpenCommands(config);
    const calculator = possible.find((item) => item.appId === "calculator");

    expect(calculator).toEqual({
      appId: "calculator",
      label: "Calculadora",
      phrases: ["abrir Calculadora", "calculadora", "calc"],
    });
    expect(possible.map((item) => item.appId)).toEqual([
      "chrome",
      "firefox",
      "files",
      "terminal",
      "calculator",
    ]);
  });
});
