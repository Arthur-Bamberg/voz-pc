import { describe, expect, it } from "vitest";
import { bootSession } from "../../src/application/boot-session.js";
import { createTestPorts, loadTestConfig } from "../../src/infra/mocks/test-ports.js";
import { MESSAGES } from "../../src/domain/messages.js";

describe("bootSession", () => {
  it("starts the session and announces ready", async () => {
    const config = await loadTestConfig();
    const ports = createTestPorts("abrir chrome");
    const session = await bootSession({ config, ...ports });

    expect(session.getState()).toBe("idle");
    expect(ports.tts.spoken).toEqual([MESSAGES.ready]);

    session.stop();
  });
});
