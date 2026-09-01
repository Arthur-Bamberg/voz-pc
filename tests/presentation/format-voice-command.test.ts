import { describe, expect, it } from "vitest";
import {
  createStdoutVoiceCommandObserver,
  formatVoiceCommandLine,
} from "../../src/presentation/format-voice-command.js";

describe("formatVoiceCommandLine", () => {
  it("labels an open voice command for the daemon operator", () => {
    expect(formatVoiceCommandLine({ text: "abrir chrome", role: "open" })).toBe(
      "Comando de voz (abertura): abrir chrome",
    );
  });

  it("labels a confirmation voice command for the daemon operator", () => {
    expect(formatVoiceCommandLine({ text: "sim", role: "confirmation" })).toBe(
      "Comando de voz (confirmação): sim",
    );
  });

  it("marks an empty voice command as vazio", () => {
    expect(formatVoiceCommandLine({ text: "", role: "open" })).toBe(
      "Comando de voz (abertura): (vazio)",
    );
  });
});

describe("createStdoutVoiceCommandObserver", () => {
  it("writes the formatted line when a voice command is observed", () => {
    const lines: string[] = [];
    const observer = createStdoutVoiceCommandObserver((line) => {
      lines.push(line);
    });

    observer.observe({ text: "abrir chrome", role: "open" });

    expect(lines).toEqual(["Comando de voz (abertura): abrir chrome"]);
  });
});
