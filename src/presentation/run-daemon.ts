import { readFile, writeFile, chmod } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { bootSession } from "../application/boot-session.js";
import { createPttToggle } from "../application/ptt-toggle.js";
import { loadConfig } from "../infra/config/load-config.js";
import { createLinuxAppLauncher } from "../infra/linux/app-launcher.js";
import { createLinuxAudioCapture } from "../infra/linux/audio-capture.js";
import { createLinuxPlayWav } from "../infra/linux/play-wav.js";
import { createWindowsAppLauncher } from "../infra/windows/app-launcher.js";
import { ensureSidecars } from "../infra/shared/ensure-sidecars.js";
import { createHotkeyBus } from "../infra/shared/hotkey-bus.js";
import { startHotkeyServer } from "../infra/shared/http-hotkeys.js";
import { createFsSidecarDeps, createTempDir } from "../infra/shared/node-fs.js";
import { createNodeRunCommand } from "../infra/shared/node-run-command.js";
import { loadProjectEnv } from "../infra/shared/load-env.js";
import { getAppDataDir } from "../infra/shared/paths.js";
import { attachStdinHotkeys } from "../infra/shared/stdin-hotkeys.js";
import { createWhisperStt } from "../infra/shared/stt-whisper.js";
import { createSystemClock, createSystemTimer } from "../infra/shared/system-clock.js";
import { createPiperTts } from "../infra/shared/tts-piper.js";
import { createStdoutVoiceCommandObserver } from "./format-voice-command.js";
import {
  createChatIntentAdapter,
  createGeminiChatComplete,
  createLoggingChatComplete,
  createLoggingIntentAdapter,
  readGeminiApiKey,
  readGeminiModel,
  readGeminiThinkingLevel,
} from "../infra/shared/intent-adapter.js";
import type { IntentAdapterPort } from "../domain/ports.js";

const HTTP_HOST = "127.0.0.1";

function createDaemonIntentAdapter(): IntentAdapterPort {
  const apiKey = readGeminiApiKey();
  const model = readGeminiModel();
  const thinkingLevel = readGeminiThinkingLevel();
  if (!apiKey) {
    console.log(
      "IA de adaptação desligada: defina GEMINI_API_KEY no .env para validar typos contra a allowlist e sim/não.",
    );
    return {
      async adaptOpenApp() {
        return null;
      },
      async adaptConfirmation() {
        return null;
      },
    };
  }

  console.log(
    `IA de adaptação: Gemini ${model} thinking ${thinkingLevel} (typos de abertura e de sim/não quando o parser não fecha)`,
  );
  return createLoggingIntentAdapter(
    createChatIntentAdapter({
      complete: createLoggingChatComplete(
        createGeminiChatComplete({ apiKey, model, thinkingLevel }),
        (line) => {
          console.log(line);
        },
      ),
    }),
    (line) => {
      console.log(line);
    },
  );
}

async function main(): Promise<void> {
  await loadProjectEnv();
  const httpPort = Number(process.env.VOZ_PC_PORT ?? 9847);

  if (process.platform === "win32") {
    console.error("Este daemon de fase 1 valida o loop no Fedora. Windows entra no smoke com o mesmo core; áudio ainda é pw-record/pw-play.");
  }

  const appDataDir = getAppDataDir(homedir(), process.platform);
  console.log(`Dados do app: ${appDataDir}`);
  console.log("Preparando sidecars Whisper + Piper (download na 1ª vez)...");

  const sidecars = await ensureSidecars(createFsSidecarDeps(appDataDir, process.platform));
  await chmod(sidecars.whisperBin, 0o755).catch(() => undefined);
  await chmod(sidecars.piperBin, 0o755).catch(() => undefined);
  const piperDir = dirname(sidecars.piperBin);
  const whisperDir = dirname(sidecars.whisperBin);
  const config = await loadConfig({ appDataDir });
  const runCommand = createNodeRunCommand();
  const bus = createHotkeyBus();
  const launcher =
    process.platform === "win32" ? createWindowsAppLauncher(config) : createLinuxAppLauncher(config);

  const libPath = [piperDir, whisperDir, process.env.LD_LIBRARY_PATH].filter(Boolean).join(":");

  const session = await bootSession({
    config,
    stt: createWhisperStt({
      binPath: sidecars.whisperBin,
      modelPath: sidecars.whisperModel,
      cwd: whisperDir,
      env: { ...process.env, LD_LIBRARY_PATH: libPath },
      runCommand,
      mkdtemp: createTempDir,
      writeFile,
      readFile: (path) => readFile(path, "utf8"),
    }),
    tts: createPiperTts({
      binPath: sidecars.piperBin,
      modelPath: sidecars.piperModel,
      cwd: piperDir,
      espeakDataDir: join(piperDir, "espeak-ng-data"),
      env: { ...process.env, LD_LIBRARY_PATH: libPath },
      runCommand,
      mkdtemp: createTempDir,
      playWav: createLinuxPlayWav(runCommand),
    }),
    launcher,
    audio: createLinuxAudioCapture(),
    hotkeys: bus,
    timer: createSystemTimer(),
    clock: createSystemClock(),
    voiceCommandObserver: createStdoutVoiceCommandObserver(),
    intentAdapter: createDaemonIntentAdapter(),
  });

  const togglePtt = createPttToggle({
    getState: () => session.getState(),
    emit: (event) => bus.emit(event),
  });

  const server = await startHotkeyServer({
    host: HTTP_HOST,
    port: httpPort,
    bus,
    togglePtt,
  });

  let detachStdin = () => {};
  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    session.stop();
    detachStdin();
    await server.close();
    process.exit(0);
  };

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    detachStdin = attachStdinHotkeys(bus, process.stdin, {
      togglePtt,
      onQuit: () => {
        void shutdown();
      },
    });
  }

  console.log("");
  console.log("Voz PC pronto. Fale: abrir calculadora | abrir chrome | abrir firefox | abrir arquivos | abrir terminal");
  console.log("Espaço: gravar / parar   Enter: confirmar   Esc: cancelar   q: sair");
  console.log(`Atalho GNOME: curl -s -X POST ${server.url}/ptt/toggle`);
  console.log("");

  process.on("SIGINT", () => {
    void shutdown();
  });
  process.on("SIGTERM", () => {
    void shutdown();
  });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
