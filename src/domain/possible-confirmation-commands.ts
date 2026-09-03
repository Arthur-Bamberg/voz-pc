import { CANCEL_ALIASES, CONFIRM_ALIASES } from "./parser/confirmation.js";
import type { PossibleConfirmationCommand } from "./ports.js";

export function listPossibleConfirmationCommands(): PossibleConfirmationCommand[] {
  return [
    { response: "confirm", phrases: [...CONFIRM_ALIASES] },
    { response: "cancel", phrases: [...CANCEL_ALIASES] },
  ];
}
