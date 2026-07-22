export type AppendFile = (path: string, data: string) => Promise<void>;
export type StatFile = (path: string) => Promise<{ size: number }>;
export type RenameFile = (from: string, to: string) => Promise<void>;
export type UnlinkFile = (path: string) => Promise<void>;

export type RotatingLogDeps = {
  filePath: string;
  maxBytes?: number;
  appendFile: AppendFile;
  stat: StatFile;
  rename: RenameFile;
  unlink: UnlinkFile;
};

export type RotatingLog = {
  write: (line: string) => Promise<void>;
};

export function createRotatingLog(deps: RotatingLogDeps): RotatingLog {
  const maxBytes = deps.maxBytes ?? 256 * 1024;

  async function rotate(): Promise<void> {
    const rotated = `${deps.filePath}.1`;
    try {
      await deps.unlink(rotated);
    } catch {
      // previous rotated file may not exist
    }
    await deps.rename(deps.filePath, rotated);
  }

  return {
    async write(line) {
      const entry = `${line}\n`;
      try {
        const { size } = await deps.stat(deps.filePath);
        if (size + entry.length > maxBytes) {
          await rotate();
        }
      } catch {
        // file does not exist yet
      }
      await deps.appendFile(deps.filePath, entry);
    },
  };
}
