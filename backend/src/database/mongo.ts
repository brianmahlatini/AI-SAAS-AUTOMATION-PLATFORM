import mongoose from "mongoose";
import { config } from "../config/env";
import { logger } from "../config/logger";

export async function connectMongo(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(config.mongoUri);
  logger.info("MongoDB connected");
}

export async function closeMongo(): Promise<void> {
  await mongoose.connection.close();
}
