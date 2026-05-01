import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { config } from "./config/env";
import { logger } from "./config/logger";
import { attachAuthContext } from "./middleware/auth";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { rateLimit } from "./middleware/rateLimit";
import { adminRouter } from "./modules/admin/admin.routes";
import { billingRouter } from "./modules/billing/billing.routes";
import { stripeWebhookHandler } from "./modules/billing/billing.webhook";
import { executionRouter } from "./modules/executions/execution.routes";
import { filesRouter } from "./modules/files/files.routes";
import { integrationsRouter } from "./modules/integrations/integrations.routes";
import { webhookRouter } from "./modules/workflows/webhook.routes";
import { workflowRouter } from "./modules/workflows/workflow.routes";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: false
    })
  );
  app.use(
    cors({
      origin: config.frontendUrl,
      credentials: true
    })
  );
  app.use(compression());
  app.use(
    pinoHttp({
      logger
    })
  );

  app.post(
    "/api/billing/webhook",
    express.raw({ type: "application/json" }),
    (req, res, next) => {
      stripeWebhookHandler(req, res).catch(next);
    }
  );

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      service: "automation-backend",
      time: new Date().toISOString()
    });
  });

  app.use(attachAuthContext);
  app.use(rateLimit);

  app.use("/api/webhooks", webhookRouter);
  app.use("/api/workflows", workflowRouter);
  app.use("/api/executions", executionRouter);
  app.use("/api/billing", billingRouter);
  app.use("/api/integrations", integrationsRouter);
  app.use("/api/files", filesRouter);
  app.use("/api/admin", adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
