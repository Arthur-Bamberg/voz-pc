import type { ClockPort, TimerPort } from "../../domain/ports.js";

export function createSystemTimer(): TimerPort {
  return {
    setTimeout(callback, ms) {
      const handle = setTimeout(callback, ms);
      return () => clearTimeout(handle);
    },
  };
}

export function createSystemClock(): ClockPort {
  return {
    now: () => Date.now(),
  };
}
