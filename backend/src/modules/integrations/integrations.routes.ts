import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/error";
import { config } from "../../config/env";

export const integrationsRouter = Router();

integrationsRouter.use(requireAuth);

integrationsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({
      integrations: [
        {
          key: "gmail",
          name: "Gmail",
          status: config.integrations.googleClientId ? "configurable" : "needs_config",
          requiredEnv: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]
        },
        {
          key: "slack",
          name: "Slack",
          status: config.integrations.slackBotToken ? "ready" : "needs_config",
          requiredEnv: ["SLACK_BOT_TOKEN"]
        },
        {
          key: "webhook",
          name: "Generic Webhooks",
          status: "ready",
          requiredEnv: []
        }
      ]
    });
  })
);
