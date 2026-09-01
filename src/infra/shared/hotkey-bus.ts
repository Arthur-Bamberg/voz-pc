import type { HotkeyEvent, HotkeysPort } from "../../domain/ports.js";

export type HotkeyBus = HotkeysPort & {
  emit: (event: HotkeyEvent) => void;
};

export function createHotkeyBus(): HotkeyBus {
  const listeners = new Map<HotkeyEvent, Set<() => void>>();

  return {
    on(event, handler) {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event)!.add(handler);
    },
    off(event, handler) {
      listeners.get(event)?.delete(handler);
    },
    emit(event) {
      for (const handler of listeners.get(event) ?? []) {
        handler();
      }
    },
  };
}
