import { spawn } from "node:child_process";
import type { RunCommand } from "./run-command.js";

export function createNodeRunCommand(): RunCommand {
  return (command, args, options) =>
    new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: options?.cwd,
        env: { ...process.env, ...options?.env },
      });
      let stdout = "";
      let stderr = "";
      child.stdout?.on("data", (chunk: Buffer) => {
        stdout += chunk.toString("utf8");
      });
      child.stderr?.on("data", (chunk: Buffer) => {
        stderr += chunk.toString("utf8");
      });
      if (options?.stdin !== undefined) {
        child.stdin?.write(options.stdin);
        child.stdin?.end();
      } else {
        child.stdin?.end();
      }
      child.on("error", reject);
      child.on("close", (code) => {
        resolve({ stdout, stderr, code: code ?? 1 });
      });
    });
}
