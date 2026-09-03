import { describe, expect, it } from "vitest";
import { listPossibleConfirmationCommands } from "../../src/domain/possible-confirmation-commands.js";

describe("listPossibleConfirmationCommands", () => {
  it("lists confirm and cancel phrases for the adapter", () => {
    const possible = listPossibleConfirmationCommands();

    expect(possible).toEqual([
      {
        response: "confirm",
        phrases: ["sim", "confirmo", "pode abrir", "ok", "positivo", "isso"],
      },
      {
        response: "cancel",
        phrases: ["nao", "não", "cancela", "cancelar", "negativo", "para"],
      },
    ]);
  });
});
