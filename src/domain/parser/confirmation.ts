import type { ConfirmationResponse } from "../intent.js";
import { normalizeVoiceText } from "../normalize-voice.js";

const CONFIRM_ALIASES = ["sim", "confirmo", "pode abrir", "ok", "positivo", "isso"];
const CANCEL_ALIASES = ["nao", "não", "cancela", "cancelar", "negativo", "para"];

export function parseConfirmation(text: string): ConfirmationResponse | null {
  const normalized = normalizeVoiceText(text);

  if (CONFIRM_ALIASES.includes(normalized)) {
    return "confirm";
  }

  if (CANCEL_ALIASES.includes(normalized)) {
    return "cancel";
  }

  return null;
}
