import { createServer, type Server } from "node:http";
import type { HotkeyBus } from "./hotkey-bus.js";

export type HotkeyServer = {
  url: string;
  close: () => Promise<void>;
};

export type HotkeyServerOptions = {
  host: string;
  port: number;
  bus: HotkeyBus;
  togglePtt: () => void;
};

export async function startHotkeyServer(options: HotkeyServerOptions): Promise<HotkeyServer> {
  const server: Server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://${options.host}`);
    const method = req.method ?? "GET";

    if (method === "GET" && url.pathname === "/health") {
      res.writeHead(200, { "content-type": "text/plain" });
      res.end("ok");
      return;
    }

    if (method !== "POST") {
      res.writeHead(404);
      res.end();
      return;
    }

    if (url.pathname === "/ptt/toggle") {
      options.togglePtt();
    } else if (url.pathname === "/ptt/down") {
      options.bus.emit("ptt_down");
    } else if (url.pathname === "/ptt/up") {
      options.bus.emit("ptt_up");
    } else if (url.pathname === "/confirm") {
      options.bus.emit("confirm");
    } else if (url.pathname === "/cancel") {
      options.bus.emit("cancel");
    } else {
      res.writeHead(404);
      res.end();
      return;
    }

    res.writeHead(204);
    res.end();
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(options.port, options.host, () => resolve());
  });

  const address = server.address();
  const port = typeof address === "object" && address ? address.port : options.port;

  return {
    url: `http://${options.host}:${port}`,
    close() {
      return new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}
