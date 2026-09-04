import type { CaptureMetadata } from "@snapdev/protocol";

export type CaptureHandler = (metadata: CaptureMetadata, bytes: ArrayBuffer) => void;
export type ConnectionHandler = (connected: boolean) => void;

export interface CaptureTransport {
  connect(): Promise<void>;
  disconnect(): void;
  onCapture(callback: CaptureHandler): () => void;
  onConnectionChange(callback: ConnectionHandler): () => void;
}
