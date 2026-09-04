import { afterEach, describe, expect, it } from "vitest";
import { WebSocket } from "ws";
import { createAgent } from "../src/server/app.js";

const instances: ReturnType<typeof createAgent>[] = [];
const config = { HOST: "127.0.0.1", PORT: 4177, WEB_ORIGIN: "http://localhost:3000", MAX_CAPTURE_BYTES: 1024 };

afterEach(async () => { await Promise.all(instances.splice(0).map(({ app }) => app.close())); });

describe("agent API", () => {
  it("creates a session and accepts an authorized PNG", async () => {
    const agent = createAgent(config); instances.push(agent);
    const created = await agent.app.inject({ method: "POST", url: "/api/sessions" });
    expect(created.statusCode).toBe(201);
    const session = created.json();
    expect(session.uploadToken).toBe("1234");
    const capture = await agent.app.inject({
      method: "POST", url: `/api/capture?token=${session.uploadToken}`,
      headers: { "content-type": "image/png" },
      payload: Buffer.from([137, 80, 78, 71])
    });
    expect(capture.statusCode).toBe(202);
    expect(capture.json().delivered).toBe(0);
  });

  it("rejects missing tokens and unsupported media", async () => {
    const agent = createAgent(config); instances.push(agent);
    const unauthorized = await agent.app.inject({ method: "POST", url: "/api/capture", headers: { "content-type": "image/png" }, payload: "x" });
    expect(unauthorized.statusCode).toBe(401);
    const session = (await agent.app.inject({ method: "POST", url: "/api/sessions" })).json();
    const unsupported = await agent.app.inject({ method: "POST", url: "/api/capture", headers: { authorization: `Bearer ${session.uploadToken}`, "content-type": "text/plain" }, payload: "x" });
    expect(unsupported.statusCode).toBe(415);
  });

  it("relays capture metadata followed by unchanged binary bytes", async () => {
    const agent = createAgent(config); instances.push(agent);
    await agent.app.listen({ host: "127.0.0.1", port: 0 });
    const address = agent.app.server.address();
    if (!address || typeof address === "string") throw new Error("Expected a TCP test address");

    const sessionResponse = await fetch(`http://127.0.0.1:${address.port}/api/sessions`, { method: "POST" });
    const session = await sessionResponse.json() as { sessionId: string; uploadToken: string };
    const ws = new WebSocket(`ws://127.0.0.1:${address.port}/ws?sessionId=${session.sessionId}`);
    const frames: (string | Buffer)[] = [];
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("WebSocket did not become ready")), 2000);
      ws.on("message", (data, isBinary) => {
        const frame = isBinary ? Buffer.from(data as Buffer) : data.toString();
        frames.push(frame);
        if (frames.length === 1) {
          clearTimeout(timer);
          resolve();
        }
      });
      ws.on("error", reject);
    });

    const pixels = Buffer.from([137, 80, 78, 71, 1, 2, 3, 4]);
    const upload = await fetch(`http://127.0.0.1:${address.port}/api/capture?token=${encodeURIComponent(session.uploadToken)}`, {
      method: "POST",
      headers: { "content-type": "image/png", "x-snapdev-device": "Test iPhone" },
      body: pixels
    });
    expect(upload.status).toBe(202);
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Capture frames were not delivered")), 2000);
      const check = () => {
        if (frames.length >= 3) { clearTimeout(timer); resolve(); }
        else setTimeout(check, 5);
      };
      check();
    });
    const metadata = JSON.parse(frames[1] as string);
    expect(metadata).toMatchObject({ type: "capture", contentType: "image/png", byteSize: pixels.length, deviceName: "Test iPhone" });
    expect(frames[2]).toEqual(pixels);
    ws.close();
  });
});
