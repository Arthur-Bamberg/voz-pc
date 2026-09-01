import type { VoiceCommand, VoiceCommandObserverPort } from "../domain/ports.js";

export function formatVoiceCommandLine(command: VoiceCommand): string {
  const roleLabel = command.role === "confirmation" ? "confirmação" : "abertura";
  const text = command.text.length === 0 ? "(vazio)" : command.text;
  return `Comando de voz (${roleLabel}): ${text}`;
}

export function createStdoutVoiceCommandObserver(
  write: (line: string) => void = (line) => {
    console.log(line);
  },
): VoiceCommandObserverPort {
  return {
    observe(command) {
      write(formatVoiceCommandLine(command));
    },
  };
}
