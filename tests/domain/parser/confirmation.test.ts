import { describe, expect, it } from "vitest";
import { parseConfirmation } from "../../../src/domain/parser/confirmation.js";

describe("parseConfirmation", () => {
  it("parses 'sim' as confirm", () => {
    expect(parseConfirmation("sim")).toBe("confirm");
  });

  it("parses Whisper confirmation with punctuation", () => {
    expect(parseConfirmation("Sim.")).toBe("confirm");
    expect(parseConfirmation("não!")).toBe("cancel");
  });

  it("parses 'não' as cancel", () => {
    expect(parseConfirmation("não")).toBe("cancel");
  });

  it("parses confirmation aliases", () => {
    expect(parseConfirmation("confirmo")).toBe("confirm");
    expect(parseConfirmation("pode abrir")).toBe("confirm");
    expect(parseConfirmation("cancela")).toBe("cancel");
    expect(parseConfirmation("negativo")).toBe("cancel");
  });

  it("returns null for unrelated text", () => {
    expect(parseConfirmation("abrir chrome")).toBeNull();
  });
});
