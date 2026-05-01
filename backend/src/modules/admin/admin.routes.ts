import { Router } from "express";
import { requireRole } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/error";
import { countExecutions } from "../executions/execution.service";
import { countUsers } from "../users/user.repository";
import { countWorkflows } from "../workflows/workflow.service";
import { countSubscriptions } from "../billing/billing.repository";
import { countUsageEvents } from "../billing/usage.repository";

export const adminRouter = Router();

adminRouter.use(requireRole("ADMIN"));

adminRouter.get(
  "/overview",
  asyncHandler(async (_req, res) => {
    const [users, workflows, executions, subscriptions, usageEvents] = await Promise.all([
      countUsers(),
      countWorkflows(),
      countExecutions(),
      countSubscriptions(),
      countUsageEvents()
    ]);

    res.json({
      users,
      workflows,
      executions,
      subscriptions,
      usageEvents
    });
  })
);
