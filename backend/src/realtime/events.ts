import { pubRedis } from "../config/redis";
import { logger } from "../config/logger";

export const EXECUTION_EVENTS_CHANNEL = "execution-events";

export type ExecutionRealtimeEvent = {
  executionId: string;
  ownerId: string;
  status?: string;
  nodeId?: string;
  message?: string;
  log?: unknown;
  output?: unknown;
  createdAt: string;
};

export async function publishExecutionEvent(event: ExecutionRealtimeEvent): Promise<void> {
  try {
    await pubRedis.publish(EXECUTION_EVENTS_CHANNEL, JSON.stringify(event));
  } catch (error) {
    logger.warn({ error, event }, "Failed to publish execution realtime event");
  }
}
