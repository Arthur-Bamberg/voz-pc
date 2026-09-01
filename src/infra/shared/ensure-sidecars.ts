import { join } from "node:path";

export type SidecarPaths = {
  whisperBin: string;
  whisperModel: string;
  piperBin: string;
  piperModel: string;
};

export type EnsureSidecarsDeps = {
  appDataDir: string;
  platform: NodeJS.Platform;
  exists: (path: string) => Promise<boolean>;
  mkdir: (path: string) => Promise<void>;
  download: (url: string, dest: string) => Promise<void>;
  extractArchive: (archive: string, dest: string) => Promise<void>;
  findFile: (dir: string, name: string) => Promise<string | null>;
};

export const MODEL_URLS = {
  whisperBase: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin",
  piperVoice:
    "https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx",
  piperVoiceJson:
    "https://huggingface.co/rhasspy/piper-voices/resolve/main/pt/pt_BR/faber/medium/pt_BR-faber-medium.onnx.json",
} as const;

export const ARCHIVE_URLS = {
  linux: {
    whisper: "https://github.com/ggml-org/whisper.cpp/releases/download/v1.9.1/whisper-bin-ubuntu-x64.tar.gz",
    piper: "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz",
  },
  win32: {
    whisper: "https://github.com/ggml-org/whisper.cpp/releases/download/v1.9.1/whisper-bin-x64.zip",
    piper: "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip",
  },
} as const;

function archiveUrls(platform: NodeJS.Platform): { whisper: string; piper: string } {
  if (platform === "win32") return ARCHIVE_URLS.win32;
  return ARCHIVE_URLS.linux;
}

function sidecarLayout(appDataDir: string, platform: NodeJS.Platform) {
  const archiveExt = platform === "win32" ? "zip" : "tar.gz";
  return {
    whisperDist: join(appDataDir, "sidecars", "whisper-dist"),
    whisperArchive: join(appDataDir, "sidecars", `whisper.${archiveExt}`),
    whisperModel: join(appDataDir, "models", "ggml-base.bin"),
    piperDir: join(appDataDir, "sidecars", "piper"),
    piperArchive: join(appDataDir, "sidecars", `piper.${archiveExt}`),
    piperModel: join(appDataDir, "models", "pt_BR-faber-medium.onnx"),
    piperModelJson: join(appDataDir, "models", "pt_BR-faber-medium.onnx.json"),
    sidecarsDir: join(appDataDir, "sidecars"),
    modelsDir: join(appDataDir, "models"),
  };
}

async function resolveBin(
  deps: EnsureSidecarsDeps,
  distDir: string,
  archivePath: string,
  url: string,
  binName: string,
): Promise<string> {
  const existing = await deps.findFile(distDir, binName);
  if (existing) return existing;

  await deps.download(url, archivePath);
  await deps.extractArchive(archivePath, distDir);
  const found = await deps.findFile(distDir, binName);
  if (!found) {
    throw new Error(`${binName} not found after extracting sidecar archive`);
  }
  return found;
}

export async function ensureSidecars(deps: EnsureSidecarsDeps): Promise<SidecarPaths> {
  const layout = sidecarLayout(deps.appDataDir, deps.platform);
  const urls = archiveUrls(deps.platform);

  await deps.mkdir(layout.sidecarsDir);
  await deps.mkdir(layout.modelsDir);

  const whisperBin = await resolveBin(
    deps,
    layout.whisperDist,
    layout.whisperArchive,
    urls.whisper,
    "whisper-cli",
  );
  const piperBin = await resolveBin(deps, layout.piperDir, layout.piperArchive, urls.piper, "piper");

  if (!(await deps.exists(layout.whisperModel))) {
    await deps.download(MODEL_URLS.whisperBase, layout.whisperModel);
  }

  if (!(await deps.exists(layout.piperModel))) {
    await deps.download(MODEL_URLS.piperVoice, layout.piperModel);
  }

  if (!(await deps.exists(layout.piperModelJson))) {
    await deps.download(MODEL_URLS.piperVoiceJson, layout.piperModelJson);
  }

  return {
    whisperBin,
    whisperModel: layout.whisperModel,
    piperBin,
    piperModel: layout.piperModel,
  };
}
