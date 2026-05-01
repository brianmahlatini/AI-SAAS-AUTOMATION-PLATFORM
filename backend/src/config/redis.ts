import IORedis from "ioredis";
import { config } from "./env";
import { logger } from "./logger";

export const redisConnection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

export const cacheRedis = new IORedis(config.redisUrl);
export const pubRedis = new IORedis(config.redisUrl);
export const subRedis = new IORedis(config.redisUrl);

for (const client of [redisConnection, cacheRedis, pubRedis, subRedis]) {
  client.on("error", (error) => {
    logger.warn({ error }, "Redis connection issue");
  });
}

export async function closeRedis(): Promise<void> {
  await Promise.allSettled([
    redisConnection.quit(),
    cacheRedis.quit(),
    pubRedis.quit(),
    subRedis.quit()
  ]);
}
