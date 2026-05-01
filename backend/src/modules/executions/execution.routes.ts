import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../middleware/error";
import { getExecution, listExecutions } from "./execution.service";

export const executionRouter = Router();

executionRouter.use(requireAuth);

executionRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const executions = await listExecutions(
      req.auth!.userId,
      req.auth!.role,
      typeof req.query.workflowId === "string" ? req.query.workflowId : undefined
    );
    res.json({ executions });
  })
);

executionRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const execution = await getExecution(String(req.params.id), req.auth!.userId, req.auth!.role);
    res.json({ execution });
  })
);
