import type { ApiWorkflow } from "../modules/workflows/workflow.service";

export type WorkflowNodeType =
  | "webhook"
  | "apiRequest"
  | "ai"
  | "delay"
  | "condition"
  | "slack"
  | "gmail";

export type WorkflowNode = ApiWorkflow["nodes"][number];
export type WorkflowEdge = ApiWorkflow["edges"][number];

export type WorkflowRunContext = {
  executionId: string;
  workflowId: string;
  ownerId: string;
  source: "manual" | "webhook" | "schedule" | "api";
  trigger: Record<string, unknown>;
  steps: Record<string, unknown>;
};

export type NodeExecutionResult = {
  output: unknown;
  branch?: boolean;
};

export type NodeExecutor = (
  node: WorkflowNode,
  context: WorkflowRunContext
) => Promise<NodeExecutionResult>;
