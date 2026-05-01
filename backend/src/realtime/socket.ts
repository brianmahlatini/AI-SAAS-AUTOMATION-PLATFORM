import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { config } from "../config/env";
import { logger } from "../config/logger";
import { subRedis } from "../config/redis";
import { EXECUTION_EVENTS_CHANNEL, type ExecutionRealtimeEvent } from "./events";

let io: Server | undefined;

export function initRealtime(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: config.frontendUrl,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.on("execution:subscribe", (executionId: string) => {
      socket.join(`execution:${executionId}`);
    });

    socket.on("execution:unsubscribe", (executionId: string) => {
      socket.leave(`execution:${executionId}`);
    });
  });

  subRedis.subscribe(EXECUTION_EVENTS_CHANNEL).catch((error) => {
    logger.warn({ error }, "Failed to subscribe to execution events");
  });

  subRedis.on("message", (channel, message) => {
    if (channel !== EXECUTION_EVENTS_CHANNEL || !io) {
      return;
    }

    try {
      const event = JSON.parse(message) as ExecutionRealtimeEvent;
      io.to(`execution:${event.executionId}`).emit("execution:update", event);
    } catch (error) {
      logger.warn({ error }, "Invalid execution event payload");
    }
  });

  logger.info("Realtime Socket.IO service ready");
  return io;
}

export function getRealtimeServer(): Server | undefined {
  return io;
}
