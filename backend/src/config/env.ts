import "dotenv/config";
import { z } from "zod";

const optionalString = z.string().optional().or(z.literal(""));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BACKEND_PORT: z.coerce.number().int().positive().default(4000),
  API_BASE_URL: z.string().url().default("http://localhost:4000"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  MONGO_URI: z.string().min(1).default("mongodb://localhost:27017/automation"),
  POSTGRES_URL: z.string().min(1).default("postgres://automation:automation@localhost:5432/automation"),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  CLERK_SECRET_KEY: optionalString,
  OPENAI_API_KEY: optionalString,
  OPENAI_MODEL: z.string().default("gpt-5.5"),
  STRIPE_PUBLISHABLE_KEY: optionalString,
  STRIPE_SECRET_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
  STRIPE_PRICE_PRO: optionalString,
  STRIPE_PRICE_ENTERPRISE: optionalString,
  SLACK_BOT_TOKEN: optionalString,
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  AWS_REGION: z.string().default("us-east-1"),
  AWS_ACCESS_KEY_ID: optionalString,
  AWS_SECRET_ACCESS_KEY: optionalString,
  S3_BUCKET: optionalString,
  RATE_LIMIT_POINTS: z.coerce.number().int().positive().default(240),
  RATE_LIMIT_DURATION_SECONDS: z.coerce.number().int().positive().default(60),
  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(5)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  env: parsed.data.NODE_ENV,
  port: parsed.data.BACKEND_PORT,
  apiBaseUrl: parsed.data.API_BASE_URL,
  frontendUrl: parsed.data.FRONTEND_URL,
  mongoUri: parsed.data.MONGO_URI,
  postgresUrl: parsed.data.POSTGRES_URL,
  redisUrl: parsed.data.REDIS_URL,
  auth: {
    clerkSecretKey: parsed.data.CLERK_SECRET_KEY || undefined
  },
  ai: {
    openaiApiKey: parsed.data.OPENAI_API_KEY || undefined,
    openaiModel: parsed.data.OPENAI_MODEL
  },
  stripe: {
    publishableKey: parsed.data.STRIPE_PUBLISHABLE_KEY || undefined,
    secretKey: parsed.data.STRIPE_SECRET_KEY || undefined,
    webhookSecret: parsed.data.STRIPE_WEBHOOK_SECRET || undefined,
    pricePro: parsed.data.STRIPE_PRICE_PRO || undefined,
    priceEnterprise: parsed.data.STRIPE_PRICE_ENTERPRISE || undefined
  },
  integrations: {
    slackBotToken: parsed.data.SLACK_BOT_TOKEN || undefined,
    googleClientId: parsed.data.GOOGLE_CLIENT_ID || undefined,
    googleClientSecret: parsed.data.GOOGLE_CLIENT_SECRET || undefined
  },
  aws: {
    region: parsed.data.AWS_REGION,
    accessKeyId: parsed.data.AWS_ACCESS_KEY_ID || undefined,
    secretAccessKey: parsed.data.AWS_SECRET_ACCESS_KEY || undefined,
    s3Bucket: parsed.data.S3_BUCKET || undefined
  },
  rateLimit: {
    points: parsed.data.RATE_LIMIT_POINTS,
    durationSeconds: parsed.data.RATE_LIMIT_DURATION_SECONDS
  },
  workerConcurrency: parsed.data.WORKER_CONCURRENCY
} as const;

export const isProduction = config.env === "production";
