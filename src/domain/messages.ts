export const MESSAGES = {
  ready: "Voz PC pronto.",
  confirmation: (label: string) => `Quer abrir ${label}?`,
  success: (label: string) => `Abrindo ${label}.`,
  launchFailed: (label: string) => `Não consegui abrir ${label}.`,
  cancelled: "Cancelado.",
  unknown: "Não entendi.",
} as const;
