import { nanoid } from "nanoid";
import { WebSocket } from "ws";
import type { Session } from "@snapdev/protocol";

type SessionRecord = Session & { sockets: Set<WebSocket>; createdAt: number };
const TEMP_UPLOAD_TOKEN = "1234";

export class SessionStore {
  private readonly byId = new Map<string, SessionRecord>();
  private readonly byToken = new Map<string, SessionRecord>();

  create(): Session {
    const record: SessionRecord = {
      sessionId: `sess_${nanoid(16)}`,
      uploadToken: TEMP_UPLOAD_TOKEN,
      sockets: new Set(),
      createdAt: Date.now()
    };
    this.byId.set(record.sessionId, record);
    this.byToken.set(record.uploadToken, record);
    return { sessionId: record.sessionId, uploadToken: record.uploadToken };
  }

  getById(id: string) { return this.byId.get(id); }
  getByToken(token: string) { return this.byToken.get(token); }
  addSocket(sessionId: string, socket: WebSocket) {
    const session = this.byId.get(sessionId);
    if (!session) return false;
    session.sockets.add(socket);
    socket.once("close", () => session.sockets.delete(socket));
    return true;
  }
}
