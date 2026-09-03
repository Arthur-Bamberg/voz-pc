import type {
  AppLauncherPort,
  AudioCapturePort,
  ClockPort,
  HotkeyEvent,
  HotkeysPort,
  SttPort,
  TimerPort,
  TtsPort,
  VoiceCommandObserverPort,
  VoiceCommandRole,
  IntentAdapterPort,
} from "../domain/ports.js";
import type { VozPcConfig } from "../domain/config.js";
import type { SessionState } from "../domain/fsm.js";
import { MESSAGES } from "../domain/messages.js";
import { parseOpenApp } from "../domain/parser/open-app.js";
import { parseConfirmation } from "../domain/parser/confirmation.js";
import { listPossibleOpenCommands } from "../domain/possible-open-commands.js";
import { listPossibleConfirmationCommands } from "../domain/possible-confirmation-commands.js";

export type SessionDeps = {
  config: VozPcConfig;
  stt: SttPort;
  tts: TtsPort;
  launcher: AppLauncherPort;
  hotkeys: HotkeysPort;
  audio: AudioCapturePort;
  timer: TimerPort;
  clock: ClockPort;
  voiceCommandObserver?: VoiceCommandObserverPort;
  intentAdapter?: IntentAdapterPort;
};

export type Session = {
  getState: () => SessionState;
  start: () => void;
  stop: () => void;
  handleTranscript: (text: string) => Promise<void>;
};

export function createSession(deps: SessionDeps): Session {
  let state: SessionState = "idle";
  let pendingAppId: string | null = null;
  let clearConfirmationTimer: (() => void) | null = null;

  const handlers = new Map<HotkeyEvent, () => void>();

  function getLabel(appId: string): string {
    return deps.config.allowlist[appId]?.label ?? appId;
  }

  function isAllowed(appId: string): boolean {
    return appId in deps.config.allowlist;
  }

  function clearTimer(): void {
    clearConfirmationTimer?.();
    clearConfirmationTimer = null;
  }

  async function resetToIdle(): Promise<void> {
    clearTimer();
    pendingAppId = null;
    state = "idle";
  }

  function armConfirmationTimer(): void {
    clearTimer();
    clearConfirmationTimer = deps.timer.setTimeout(async () => {
      if (state === "awaiting_confirmation") {
        await deps.tts.speak(MESSAGES.cancelled);
        await resetToIdle();
      }
    }, deps.config.confirmationTimeoutMs);
  }

  async function restoreConfirmation(): Promise<void> {
    if (!pendingAppId) {
      await failListen();
      return;
    }
    state = "awaiting_confirmation";
    await deps.tts.speak(MESSAGES.confirmation(getLabel(pendingAppId)));
    armConfirmationTimer();
  }

  async function failListen(): Promise<void> {
    await resetToIdle();
    await deps.tts.speak(MESSAGES.unknown);
  }

  async function startCapture(nextState: SessionState): Promise<void> {
    state = nextState;
    try {
      await deps.audio.start();
    } catch {
      if (nextState === "recording_confirmation") {
        await restoreConfirmation();
        return;
      }
      await failListen();
    }
  }

  function observeVoiceCommand(text: string, role: VoiceCommandRole): void {
    deps.voiceCommandObserver?.observe({ text, role });
  }

  async function onPttDown(): Promise<void> {
    if (state === "idle") {
      await startCapture("recording");
      return;
    }

    if (state === "awaiting_confirmation") {
      await startCapture("recording_confirmation");
    }
  }

  async function onPttUp(): Promise<void> {
    if (state !== "recording" && state !== "recording_confirmation") return;

    const wasConfirming = state === "recording_confirmation";
    try {
      const audio = await deps.audio.stop();
      const text = await deps.stt.transcribe(audio);
      observeVoiceCommand(text, wasConfirming ? "confirmation" : "open");

      if (wasConfirming) {
        state = "awaiting_confirmation";
        await applyConfirmationReply(text);
        return;
      }

      await handleOpenAppTranscript(text);
    } catch {
      if (wasConfirming) {
        await restoreConfirmation();
        return;
      }
      await failListen();
    }
  }

  async function applyConfirmationReply(text: string): Promise<void> {
    let response = parseConfirmation(text);

    if (!response && text.trim() && deps.intentAdapter) {
      try {
        const adapted = await deps.intentAdapter.adaptConfirmation(
          text,
          listPossibleConfirmationCommands(),
        );
        if (adapted === "confirm" || adapted === "cancel") {
          response = adapted;
        }
      } catch {
        response = null;
      }
    }

    if (response === "confirm") {
      await confirmLaunch();
    } else if (response === "cancel") {
      await cancelLaunch();
    } else {
      await restoreConfirmation();
    }
  }

  async function handleOpenAppTranscript(text: string): Promise<void> {
    let intent = parseOpenApp(text, deps.config.aliases);

    if ((!intent || !isAllowed(intent.appId)) && text.trim() && deps.intentAdapter) {
      try {
        const appId = await deps.intentAdapter.adaptOpenApp(
          text,
          listPossibleOpenCommands(deps.config),
        );
        if (appId && isAllowed(appId)) {
          intent = { type: "open_app", appId };
        } else {
          intent = null;
        }
      } catch {
        intent = null;
      }
    }

    if (!intent || !isAllowed(intent.appId)) {
      await deps.tts.speak(MESSAGES.unknown);
      state = "idle";
      return;
    }

    pendingAppId = intent.appId;
    await restoreConfirmation();
  }

  async function handleTranscript(text: string): Promise<void> {
    if (state === "recording") {
      observeVoiceCommand(text, "open");
      await handleOpenAppTranscript(text);
      return;
    }

    if (state === "awaiting_confirmation") {
      observeVoiceCommand(text, "confirmation");
      await applyConfirmationReply(text);
    }
  }

  async function confirmLaunch(): Promise<void> {
    if (state !== "awaiting_confirmation" || !pendingAppId) return;
    const appId = pendingAppId;
    const label = getLabel(appId);
    clearTimer();
    state = "idle";
    pendingAppId = null;

    const result = await deps.launcher.launch(appId);
    if (result.ok) {
      await deps.tts.speak(MESSAGES.success(label));
    } else {
      await deps.tts.speak(MESSAGES.launchFailed(label));
    }
  }

  async function cancelLaunch(): Promise<void> {
    if (state !== "awaiting_confirmation") return;
    clearTimer();
    await deps.tts.speak(MESSAGES.cancelled);
    await resetToIdle();
  }

  function bindHotkeys(): void {
    const pttDown = () => {
      void onPttDown();
    };
    const pttUp = () => {
      void onPttUp();
    };
    const confirm = () => {
      if (state === "awaiting_confirmation") {
        void confirmLaunch();
      }
    };
    const cancel = () => {
      if (state === "awaiting_confirmation") {
        void cancelLaunch();
      }
    };

    handlers.set("ptt_down", pttDown);
    handlers.set("ptt_up", pttUp);
    handlers.set("confirm", confirm);
    handlers.set("cancel", cancel);

    for (const [event, handler] of handlers) {
      deps.hotkeys.on(event, handler);
    }
  }

  function unbindHotkeys(): void {
    for (const [event, handler] of handlers) {
      deps.hotkeys.off(event, handler);
    }
    handlers.clear();
  }

  return {
    getState: () => state,
    start: () => {
      bindHotkeys();
    },
    stop: () => {
      unbindHotkeys();
      clearTimer();
    },
    handleTranscript,
  };
}
