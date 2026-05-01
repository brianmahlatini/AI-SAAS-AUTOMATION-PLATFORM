import { logger } from "./config/logger";
import { closeDatabases, connectDatabases } from "./database";
import { createWorkflowWorker } from "./queues/workflow.queue";

async function bootstrap(): Promise<void> {
  await connectDatabases();
  const worker = createWorkflowWorker();

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down workflow worker");
    await worker.close();
    await closeDatabases();
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

bootstrap().catch((error) => {
  logger.fatal({ error }, "Worker failed to start");
  process.exit(1);
});
