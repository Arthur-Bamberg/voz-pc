import { createSession, type Session, type SessionDeps } from "./create-session.js";
import { MESSAGES } from "../domain/messages.js";

export async function bootSession(deps: SessionDeps): Promise<Session> {
  const session = createSession(deps);
  session.start();
  await deps.tts.speak(MESSAGES.ready);
  return session;
}
