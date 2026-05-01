import { connectMongo, closeMongo } from "./mongo";
import { connectPostgres, closePostgres } from "./postgres";
import { closeRedis } from "../config/redis";

export async function connectDatabases(): Promise<void> {
  await Promise.all([connectMongo(), connectPostgres()]);
}

export async function closeDatabases(): Promise<void> {
  await Promise.allSettled([closeMongo(), closePostgres(), closeRedis()]);
}
