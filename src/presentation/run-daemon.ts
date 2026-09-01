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
import { getAppDataDir } from "../infra/shared/paths.js";
import { attachStdinHotkeys } from "../infra/shared/stdin-hotkeys.js";
import { createWhisperStt } from "../infra/shared/stt-whisper.js";
import { createSystemClock, createSystemTimer } from "../infra/shared/system-clock.js";
import { createPiperTts } from "../infra/shared/tts-piper.js";
import { createStdoutVoiceCommandObserver } from "./format-voice-command.js";

const HTTP_HOST = "127.0.0.1";
const HTTP_PORT = Number(process.env.VOZ_PC_PORT ?? 9847);

async function main(): Promise<void> {
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
  });

  const togglePtt = createPttToggle({
    getState: () => session.getState(),
    emit: (event) => bus.emit(event),
  });

  const server = await startHotkeyServer({
    host: HTTP_HOST,
    port: HTTP_PORT,
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
