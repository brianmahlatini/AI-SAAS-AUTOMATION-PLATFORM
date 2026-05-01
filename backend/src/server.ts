import http from "http";
import { config } from "./config/env";
import { logger } from "./config/logger";
import { connectDatabases, closeDatabases } from "./database";
import { createApp } from "./app";
import { initRealtime } from "./realtime/socket";

async function bootstrap(): Promise<void> {
  await connectDatabases();

  const app = createApp();
  const server = http.createServer(app);
  initRealtime(server);

  server.listen(config.port, () => {
    logger.info({ port: config.port }, "Backend API listening");
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down backend");
    server.close(async () => {
      await closeDatabases();
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

bootstrap().catch((error) => {
  logger.fatal({ error }, "Backend failed to start");
  process.exit(1);
});
