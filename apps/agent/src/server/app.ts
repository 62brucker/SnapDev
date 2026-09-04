import Fastify from "fastify";
import cors from "@fastify/cors";
import { nanoid } from "nanoid";
import { WebSocketServer, WebSocket } from "ws";
import { SUPPORTED_IMAGE_TYPES, type CaptureMetadata, type SupportedImageType } from "@snapdev/protocol";
import { APP_VERSION } from "@snapdev/shared";
import type { AgentConfig } from "@snapdev/config";
import { SessionStore } from "../sessions/session-store.js";

export function createAgent(config: AgentConfig) {
  const app = Fastify({ logger: true, bodyLimit: config.MAX_CAPTURE_BYTES });
  const sessions = new SessionStore();
  const websocketServer = new WebSocketServer({ noServer: true, maxPayload: 1024 });
  app.addHook("onClose", (_instance, done) => websocketServer.close(() => done()));

  app.register(cors, {
    origin: (origin, callback) => callback(null, !origin || origin === config.WEB_ORIGIN),
    methods: ["GET", "POST"]
  });

  app.addContentTypeParser([...SUPPORTED_IMAGE_TYPES], { parseAs: "buffer" }, (_request, body, done) => done(null, body));

  app.get("/api/health", async () => ({ status: "ok", version: APP_VERSION }));
  app.post("/api/sessions", async (_request, reply) => reply.code(201).send(sessions.create()));

  app.post("/api/capture", async (request, reply) => {
    const startedAt = Date.now();
    const auth = request.headers.authorization;
    const shortcutToken = request.headers["x-snapdev-token"];
    const captureUrl = new URL(request.url, "http://localhost");
    const urlToken = captureUrl.searchParams.get("token");
    const requestedSessionId = captureUrl.searchParams.get("sessionId");
    const token = auth?.startsWith("Bearer ")
      ? auth.slice(7)
      : typeof shortcutToken === "string"
        ? shortcutToken
        : urlToken ?? undefined;
    if (!token) return reply.code(401).send({ error: "A valid upload token is required." });
    const requestedSession = requestedSessionId ? sessions.getById(requestedSessionId) : undefined;
    const session = requestedSessionId
      ? requestedSession?.uploadToken === token ? requestedSession : undefined
      : sessions.getByToken(token);
    if (!session) return reply.code(401).send({ error: "The upload token is invalid or expired." });

    const contentType = request.headers["content-type"]?.split(";", 1)[0];
    if (!SUPPORTED_IMAGE_TYPES.includes(contentType as SupportedImageType)) {
      return reply.code(415).send({ error: "Only PNG and JPEG screenshots are supported." });
    }
    if (!Buffer.isBuffer(request.body) || request.body.length === 0) {
      return reply.code(400).send({ error: "The screenshot body is empty." });
    }

    const metadata: CaptureMetadata = {
      type: "capture",
      id: `cap_${nanoid(16)}`,
      timestamp: Date.now(),
      serverReceivedAt: startedAt,
      byteSize: request.body.length,
      contentType: contentType as SupportedImageType,
      deviceName: cleanDeviceName(request.headers["x-snapdev-device"])
    };
    const metadataFrame = JSON.stringify(metadata);
    let delivered = 0;
    for (const socket of session.sockets) {
      if (socket.readyState !== WebSocket.OPEN) continue;
      socket.send(metadataFrame);
      socket.send(request.body, { binary: true });
      delivered++;
    }
    request.log.info({ captureId: metadata.id, byteSize: metadata.byteSize, contentType, relayMs: Date.now() - startedAt, delivered }, "capture relayed");
    return reply.code(202).send({ captureId: metadata.id, delivered });
  });

  app.server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url ?? "", "http://localhost");
    if (url.pathname !== "/ws") return socket.destroy();
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId || !sessions.getById(sessionId)) return socket.destroy();
    websocketServer.handleUpgrade(request, socket, head, (ws) => {
      sessions.addSocket(sessionId, ws);
      ws.send(JSON.stringify({ type: "ready", sessionId }));
    });
  });

  return { app, sessions, websocketServer };
}

function cleanDeviceName(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.replace(/[\r\n]/g, "").slice(0, 80) || undefined;
}
