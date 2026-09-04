export const SUPPORTED_IMAGE_TYPES = ["image/png", "image/jpeg"] as const;
export type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];

export type Device = { name?: string };

export type Session = {
  sessionId: string;
  uploadToken: string;
};

export type CaptureMetadata = {
  type: "capture";
  id: string;
  timestamp: number;
  contentType: SupportedImageType;
  byteSize: number;
  serverReceivedAt: number;
  deviceName?: string;
};

export type ServerMessage =
  | CaptureMetadata
  | { type: "ready"; sessionId: string }
  | { type: "error"; message: string };
