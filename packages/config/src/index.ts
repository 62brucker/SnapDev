import { z } from "zod";

export const agentConfigSchema = z.object({
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4177),
  WEB_ORIGIN: z.string().url().default("http://localhost:3000"),
  MAX_CAPTURE_BYTES: z.coerce.number().int().positive().default(20 * 1024 * 1024)
});

export type AgentConfig = z.infer<typeof agentConfigSchema>;
