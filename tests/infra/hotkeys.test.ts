import { describe, expect, it } from "vitest";
import { PassThrough } from "node:stream";
import { createHotkeyBus } from "../../src/infra/shared/hotkey-bus.js";
import { attachStdinHotkeys } from "../../src/infra/shared/stdin-hotkeys.js";
import { startHotkeyServer } from "../../src/infra/shared/http-hotkeys.js";
import { createPttToggle } from "../../src/application/ptt-toggle.js";

describe("createHotkeyBus", () => {
  it("emits to subscribed handlers and unsubscribes", () => {
    const bus = createHotkeyBus();
    const seen: string[] = [];
    const handler = () => {
      seen.push("confirm");
    };
    bus.on("confirm", handler);
    bus.emit("confirm");
    bus.off("confirm", handler);
    bus.emit("confirm");
    expect(seen).toEqual(["confirm"]);
  });
});

describe("attachStdinHotkeys", () => {
  it("maps space toggle, enter confirm, escape cancel", () => {
    const bus = createHotkeyBus();
    const events: string[] = [];
    bus.on("ptt_down", () => events.push("ptt_down"));
    bus.on("ptt_up", () => events.push("ptt_up"));
    bus.on("confirm", () => events.push("confirm"));
    bus.on("cancel", () => events.push("cancel"));

    const input = new PassThrough();
    const togglePtt = createPttToggle({
      getState: () => (events.includes("ptt_down") && !events.includes("ptt_up") ? "recording" : "idle"),
      emit: (event) => bus.emit(event),
    });
    const stop = attachStdinHotkeys(bus, input, { togglePtt });

    input.write(" ");
    input.write(" ");
    input.write("\r");
    input.write("\x1b");

    stop();
    expect(events).toEqual(["ptt_down", "ptt_up", "confirm", "cancel"]);
  });
});

describe("startHotkeyServer", () => {
  it("posts ptt toggle and confirm to localhost only", async () => {
    const bus = createHotkeyBus();
    const events: string[] = [];
    bus.on("ptt_down", () => events.push("ptt_down"));
    bus.on("confirm", () => events.push("confirm"));

    const server = await startHotkeyServer({
      host: "127.0.0.1",
      port: 0,
      bus,
      togglePtt: createPttToggle({
        getState: () => "idle",
        emit: (event) => bus.emit(event),
      }),
    });

    const toggle = await fetch(`${server.url}/ptt/toggle`, { method: "POST" });
    const confirm = await fetch(`${server.url}/confirm`, { method: "POST" });
    const health = await fetch(`${server.url}/health`);

    expect(toggle.ok).toBe(true);
    expect(confirm.ok).toBe(true);
    expect(await health.text()).toBe("ok");
    expect(events).toEqual(["ptt_down", "confirm"]);

    await server.close();
  });
});

describe("createPttToggle", () => {
  it("starts recording from idle and stops from recording", () => {
    const bus = createHotkeyBus();
    const events: string[] = [];
    bus.on("ptt_down", () => events.push("down"));
    bus.on("ptt_up", () => events.push("up"));

    let state: "idle" | "recording" | "awaiting_confirmation" | "recording_confirmation" = "idle";
    const toggle = createPttToggle({
      getState: () => state,
      emit: (event) => bus.emit(event),
    });

    toggle();
    expect(events).toEqual(["down"]);
    state = "recording";
    toggle();
    expect(events).toEqual(["down", "up"]);
  });
});
