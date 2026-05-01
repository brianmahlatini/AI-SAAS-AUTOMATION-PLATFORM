import pino from "pino";
import { config } from "./env";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (config.env === "production" ? "info" : "debug"),
  transport:
    config.env === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            singleLine: true,
            translateTime: "SYS:standard"
          }
        }
      : undefined,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.apiKey",
      "*.secret",
      "*.token",
      "*.accessToken"
    ],
    censor: "[redacted]"
  }
});
