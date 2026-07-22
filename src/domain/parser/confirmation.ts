import type { ConfirmationResponse } from "../domain/intent.js";

const CONFIRM_ALIASES = ["sim", "confirmo", "pode abrir", "ok", "positivo", "isso"];
const CANCEL_ALIASES = ["nao", "não", "cancela", "cancelar", "negativo", "para"];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

export function parseConfirmation(text: string): ConfirmationResponse | null {
  const normalized = normalize(text);

  if (CONFIRM_ALIASES.includes(normalized)) {
    return "confirm";
  }

  if (CANCEL_ALIASES.includes(normalized)) {
    return "cancel";
  }

  return null;
}
