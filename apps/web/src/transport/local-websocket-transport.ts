import type { CaptureMetadata, ServerMessage } from "@snapdev/protocol";
import type { CaptureHandler, CaptureTransport, ConnectionHandler } from "./capture-transport";

export class LocalWebSocketTransport implements CaptureTransport {
  private socket?: WebSocket;
  private captureHandlers = new Set<CaptureHandler>();
  private connectionHandlers = new Set<ConnectionHandler>();
  private pendingMetadata?: CaptureMetadata;
  private reconnectAttempt = 0;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private stopped = false;

  constructor(private readonly wsUrl: string) {}

  connect(): Promise<void> {
    this.stopped = false;
    if (this.socket?.readyState === WebSocket.OPEN) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(this.wsUrl);
      socket.binaryType = "arraybuffer";
      this.socket = socket;
      socket.onopen = () => {
        this.reconnectAttempt = 0;
        this.connectionHandlers.forEach((handler) => handler(true));
        resolve();
      };
      socket.onmessage = (event) => this.handleMessage(event.data);
      socket.onerror = () => {
        if (socket.readyState !== WebSocket.OPEN) reject(new Error("Could not connect to the local SnapDev agent."));
      };
      socket.onclose = () => {
        this.connectionHandlers.forEach((handler) => handler(false));
        if (!this.stopped) this.scheduleReconnect();
      };
    });
  }

  disconnect() {
    this.stopped = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.socket?.close();
  }

  onCapture(callback: CaptureHandler) {
    this.captureHandlers.add(callback);
    return () => this.captureHandlers.delete(callback);
  }

  onConnectionChange(callback: ConnectionHandler) {
    this.connectionHandlers.add(callback);
    return () => this.connectionHandlers.delete(callback);
  }

  private handleMessage(data: string | ArrayBuffer) {
    if (typeof data === "string") {
      const message = JSON.parse(data) as ServerMessage;
      if (message.type === "capture") this.pendingMetadata = message;
      return;
    }
    const metadata = this.pendingMetadata;
    this.pendingMetadata = undefined;
    if (metadata) this.captureHandlers.forEach((handler) => handler(metadata, data));
  }

  private scheduleReconnect() {
    const delays = [1000, 2000, 4000, 8000, 15000];
    const delay = delays[Math.min(this.reconnectAttempt, delays.length - 1)] ?? 15000;
    this.reconnectAttempt++;
    this.reconnectTimer = setTimeout(() => void this.connect().catch(() => undefined), delay);
  }
}
