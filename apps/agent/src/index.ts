import { agentConfigSchema } from "@snapdev/config";
import { createAgent } from "./server/app.js";

const config = agentConfigSchema.parse(process.env);
const { app } = createAgent(config);

try {
  await app.listen({ host: config.HOST, port: config.PORT });
  app.log.info(`SnapDev agent listening on http://${config.HOST}:${config.PORT}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
