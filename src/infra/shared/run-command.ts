export type CommandResult = {
  stdout: string;
  stderr: string;
  code: number;
};

export type RunCommand = (
  command: string,
  args: string[],
  options?: { stdin?: string; env?: NodeJS.ProcessEnv; cwd?: string },
) => Promise<CommandResult>;
