import { Router } from "express";
import { asyncHandler } from "../../middleware/error";
import { enqueueWorkflowRun } from "../../queues/workflow.queue";
import { findWorkflowByWebhookKey } from "./workflow.service";

export const webhookRouter = Router();

webhookRouter.post(
  "/:webhookKey",
  asyncHandler(async (req, res) => {
    const workflow = await findWorkflowByWebhookKey(String(req.params.webhookKey));
    const { execution, jobId } = await enqueueWorkflowRun({
      workflowId: workflow.id,
      ownerId: workflow.ownerId,
      source: "webhook",
      input: {
        body: req.body,
        query: req.query,
        headers: req.headers
      }
    });

    res.status(202).json({
      accepted: true,
      executionId: execution.id,
      jobId
    });
  })
);
