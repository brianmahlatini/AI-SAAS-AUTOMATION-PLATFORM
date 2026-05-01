import { Router } from "express";
import { asyncHandler } from "../../middleware/error";
import { requireAuth } from "../../middleware/auth";
import { enqueueWorkflowRun } from "../../queues/workflow.queue";
import {
  createWorkflow,
  deleteWorkflow,
  getWorkflow,
  listWorkflows,
  updateWorkflow
} from "./workflow.service";
import {
  createWorkflowSchema,
  executeWorkflowSchema,
  updateWorkflowSchema
} from "./workflow.validation";

export const workflowRouter = Router();

workflowRouter.use(requireAuth);

workflowRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const workflows = await listWorkflows(req.auth!.userId);
    res.json({ workflows });
  })
);

workflowRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const payload = createWorkflowSchema.parse(req.body);
    const workflow = await createWorkflow(req.auth!.userId, payload);
    res.status(201).json({ workflow });
  })
);

workflowRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const workflow = await getWorkflow(String(req.params.id), req.auth!.userId, req.auth!.role);
    res.json({ workflow });
  })
);

workflowRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const payload = updateWorkflowSchema.parse(req.body);
    const workflow = await updateWorkflow(String(req.params.id), req.auth!.userId, req.auth!.role, payload);
    res.json({ workflow });
  })
);

workflowRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await deleteWorkflow(String(req.params.id), req.auth!.userId, req.auth!.role);
    res.status(204).send();
  })
);

workflowRouter.post(
  "/:id/execute",
  asyncHandler(async (req, res) => {
    const payload = executeWorkflowSchema.parse(req.body);
    const { execution, jobId } = await enqueueWorkflowRun({
      workflowId: String(req.params.id),
      ownerId: req.auth!.userId,
      source: payload.source,
      input: payload.input
    });
    res.status(202).json({ execution, jobId });
  })
);
