import type { NextFunction, Request, Response } from "express";
import { RateLimiterMemory, RateLimiterRedis } from "rate-limiter-flexible";
import { cacheRedis } from "../config/redis";
import { config } from "../config/env";
import { logger } from "../config/logger";

const memoryLimiter = new RateLimiterMemory({
  points: config.rateLimit.points,
  duration: config.rateLimit.durationSeconds
});

const redisLimiter = new RateLimiterRedis({
  storeClient: cacheRedis,
  keyPrefix: "rl:api",
  points: config.rateLimit.points,
  duration: config.rateLimit.durationSeconds
});

export async function rateLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  const identity = req.auth?.userId ?? req.ip ?? "anonymous";
  const limiter = cacheRedis.status === "ready" ? redisLimiter : memoryLimiter;

  try {
    const result = await limiter.consume(identity);
    res.setHeader("X-RateLimit-Limit", config.rateLimit.points);
    res.setHeader("X-RateLimit-Remaining", Math.max(result.remainingPoints, 0));
    next();
  } catch (error) {
    if (typeof error === "object" && error && "msBeforeNext" in error) {
      const retryAfter = Math.ceil(Number(error.msBeforeNext) / 1000);
      res.setHeader("Retry-After", retryAfter);
      res.status(429).json({
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Please slow down."
        }
      });
      return;
    }

    logger.warn({ error }, "Rate limiter failed, falling back to allow request");
    next();
  }
}
