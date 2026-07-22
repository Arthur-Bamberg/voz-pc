export const MESSAGES = {
  confirmation: (label: string) => `Quer abrir ${label}?`,
  success: (label: string) => `Abrindo ${label}.`,
  cancelled: "Cancelado.",
  unknown: "Não entendi.",
} as const;
