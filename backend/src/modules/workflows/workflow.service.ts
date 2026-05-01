import { randomUUID } from "crypto";
import { cacheRedis } from "../../config/redis";
import { AppError } from "../../middleware/error";
import { WorkflowModel, type WorkflowDocument } from "./workflow.model";
import type { CreateWorkflowInput, UpdateWorkflowInput } from "./workflow.validation";

const cacheKey = (id: string) => `workflow:${id}`;
const cacheTtlSeconds = 60;

function toApiWorkflow(workflow: WorkflowDocument) {
  return {
    id: workflow._id.toString(),
    ownerId: workflow.ownerId,
    name: workflow.name,
    description: workflow.description,
    status: workflow.status,
    nodes: workflow.nodes,
    edges: workflow.edges,
    webhookKey: workflow.webhookKey,
    webhookUrl: `/api/webhooks/${workflow.webhookKey}`,
    version: workflow.version,
    lastExecutedAt: workflow.lastExecutedAt,
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt
  };
}

export type ApiWorkflow = ReturnType<typeof toApiWorkflow>;

export async function listWorkflows(ownerId: string): Promise<ApiWorkflow[]> {
  const workflows = await WorkflowModel.find({ ownerId }).sort({ updatedAt: -1 }).lean<WorkflowDocument[]>();
  return workflows.map((workflow) => toApiWorkflow(workflow));
}

export async function createWorkflow(ownerId: string, input: CreateWorkflowInput): Promise<ApiWorkflow> {
  const workflow = await WorkflowModel.create({
    ...input,
    ownerId,
    webhookKey: randomUUID().replace(/-/g, "")
  });

  return toApiWorkflow(workflow as WorkflowDocument);
}

export async function getWorkflow(id: string, ownerId: string, role: "USER" | "ADMIN"): Promise<ApiWorkflow> {
  const workflow = await WorkflowModel.findById(id);
  if (!workflow) {
    throw new AppError(404, "Workflow not found", "WORKFLOW_NOT_FOUND");
  }

  if (role !== "ADMIN" && workflow.ownerId !== ownerId) {
    throw new AppError(403, "You do not own this workflow", "WORKFLOW_FORBIDDEN");
  }

  return toApiWorkflow(workflow as WorkflowDocument);
}

export async function updateWorkflow(
  id: string,
  ownerId: string,
  role: "USER" | "ADMIN",
  input: UpdateWorkflowInput
): Promise<ApiWorkflow> {
  const workflow = await WorkflowModel.findById(id);
  if (!workflow) {
    throw new AppError(404, "Workflow not found", "WORKFLOW_NOT_FOUND");
  }

  if (role !== "ADMIN" && workflow.ownerId !== ownerId) {
    throw new AppError(403, "You do not own this workflow", "WORKFLOW_FORBIDDEN");
  }

  if (input.name !== undefined) workflow.name = input.name;
  if (input.description !== undefined) workflow.description = input.description;
  if (input.status !== undefined) workflow.status = input.status;
  if (input.nodes !== undefined) workflow.set("nodes", input.nodes);
  if (input.edges !== undefined) workflow.set("edges", input.edges);
  workflow.version = (workflow.version ?? 1) + 1;

  await workflow.save();
  await invalidateWorkflowCache(id);
  return toApiWorkflow(workflow as WorkflowDocument);
}

export async function deleteWorkflow(id: string, ownerId: string, role: "USER" | "ADMIN"): Promise<void> {
  const workflow = await WorkflowModel.findById(id);
  if (!workflow) {
    return;
  }

  if (role !== "ADMIN" && workflow.ownerId !== ownerId) {
    throw new AppError(403, "You do not own this workflow", "WORKFLOW_FORBIDDEN");
  }

  await WorkflowModel.deleteOne({ _id: id });
  await invalidateWorkflowCache(id);
}

export async function findWorkflowByWebhookKey(webhookKey: string): Promise<ApiWorkflow> {
  const workflow = await WorkflowModel.findOne({ webhookKey, status: "active" });
  if (!workflow) {
    throw new AppError(404, "Webhook workflow not found or inactive", "WEBHOOK_NOT_FOUND");
  }
  return toApiWorkflow(workflow as WorkflowDocument);
}

export async function getWorkflowDefinition(id: string): Promise<ApiWorkflow> {
  const cached = await cacheRedis.get(cacheKey(id));
  if (cached) {
    return JSON.parse(cached) as ApiWorkflow;
  }

  const workflow = await WorkflowModel.findById(id).lean<WorkflowDocument>();
  if (!workflow) {
    throw new AppError(404, "Workflow not found", "WORKFLOW_NOT_FOUND");
  }

  const apiWorkflow = toApiWorkflow(workflow);
  await cacheRedis.set(cacheKey(id), JSON.stringify(apiWorkflow), "EX", cacheTtlSeconds);
  return apiWorkflow;
}

export async function touchWorkflowExecution(id: string): Promise<void> {
  await WorkflowModel.updateOne({ _id: id }, { $set: { lastExecutedAt: new Date() } });
  await invalidateWorkflowCache(id);
}

export async function invalidateWorkflowCache(id: string): Promise<void> {
  await cacheRedis.del(cacheKey(id));
}

export async function countWorkflows(): Promise<number> {
  return WorkflowModel.countDocuments();
}
