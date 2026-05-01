import { logger } from "../config/logger";
import { AppError } from "../middleware/error";
import {
  appendExecutionLog,
  markExecutionCompleted,
  markExecutionFailed,
  markExecutionRunning
} from "../modules/executions/execution.service";
import {
  getWorkflowDefinition,
  touchWorkflowExecution,
  type ApiWorkflow
} from "../modules/workflows/workflow.service";
import { getNodeExecutor } from "./executors";
import type { NodeExecutionResult, WorkflowEdge, WorkflowNode, WorkflowRunContext } from "./types";

export type WorkflowRunJob = {
  executionId: string;
  workflowId: string;
  ownerId: string;
  source: "manual" | "webhook" | "schedule" | "api";
  input: Record<string, unknown>;
};

export async function executeWorkflowRun(job: WorkflowRunJob): Promise<void> {
  const workflow = await getWorkflowDefinition(job.workflowId);
  const context: WorkflowRunContext = {
    executionId: job.executionId,
    workflowId: job.workflowId,
    ownerId: job.ownerId,
    source: job.source,
    trigger: job.input,
    steps: {}
  };

  try {
    await markExecutionRunning(job.executionId);
    await appendExecutionLog(job.executionId, {
      status: "running",
      message: `Workflow "${workflow.name}" started`
    });

    validateWorkflow(workflow);

    const queue = getStartNodes(workflow, job.source).map((node) => node.id);
    const visitCounts = new Map<string, number>();
    let visitedTotal = 0;

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const node = workflow.nodes.find((candidate) => candidate.id === nodeId);
      if (!node) {
        continue;
      }

      const count = visitCounts.get(node.id) ?? 0;
      if (count > 0 && !node.data?.allowMultipleRuns) {
        await appendExecutionLog(job.executionId, {
          nodeId: node.id,
          nodeName: node.name,
          nodeType: node.type,
          status: "skipped",
          message: "Node already executed in this run"
        });
        continue;
      }

      visitCounts.set(node.id, count + 1);
      visitedTotal += 1;

      if (visitedTotal > 500) {
        throw new AppError(400, "Workflow execution exceeded the 500 node visit limit", "WORKFLOW_LOOP_DETECTED");
      }

      const result = await runNodeWithRetry(node, context);
      context.steps[node.id] = result.output;

      const nextNodeIds = getNextNodeIds(workflow.edges, node, result);
      queue.push(...nextNodeIds);
    }

    await markExecutionCompleted(job.executionId, context.steps);
    await touchWorkflowExecution(job.workflowId);
  } catch (error) {
    logger.error({ error, job }, "Workflow execution failed");
    await markExecutionFailed(job.executionId, error);
    throw error;
  }
}

async function runNodeWithRetry(
  node: WorkflowNode,
  context: WorkflowRunContext
): Promise<NodeExecutionResult> {
  const retryCount = Number(node.data?.retryCount ?? 0);
  const retryDelayMs = Number(node.data?.retryDelayMs ?? 1000);
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retryCount) {
    const startedAt = Date.now();
    attempt += 1;

    await appendExecutionLog(context.executionId, {
      nodeId: node.id,
      nodeName: node.name,
      nodeType: node.type,
      status: "running",
      message: attempt > 1 ? `Running node attempt ${attempt}` : "Running node",
      input: sanitizeNodeInput(node.data)
    });

    try {
      const executor = getNodeExecutor(node);
      const result = await executor(node, context);
      await appendExecutionLog(context.executionId, {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        status: "completed",
        message: "Node completed",
        output: result.output,
        durationMs: Date.now() - startedAt
      });
      return result;
    } catch (error) {
      lastError = error;
      await appendExecutionLog(context.executionId, {
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        level: "error",
        status: "failed",
        message: error instanceof Error ? error.message : "Node failed",
        error: normalizeError(error),
        durationMs: Date.now() - startedAt
      });

      if (attempt <= retryCount) {
        await sleep(retryDelayMs * attempt);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Node execution failed");
}

function validateWorkflow(workflow: ApiWorkflow): void {
  if (workflow.nodes.length === 0) {
    throw new AppError(400, "Workflow has no nodes", "WORKFLOW_EMPTY");
  }

  const nodeIds = new Set(workflow.nodes.map((node) => node.id));
  const invalidEdge = workflow.edges.find((edge) => !nodeIds.has(edge.source) || !nodeIds.has(edge.target));
  if (invalidEdge) {
    throw new AppError(400, `Workflow edge ${invalidEdge.id} references missing nodes`, "WORKFLOW_INVALID");
  }
}

function getStartNodes(workflow: ApiWorkflow, source: WorkflowRunJob["source"]): WorkflowNode[] {
  if (source === "webhook") {
    const webhookNodes = workflow.nodes.filter((node) => node.type === "webhook");
    if (webhookNodes.length > 0) {
      return webhookNodes;
    }
  }

  const targets = new Set(workflow.edges.map((edge) => edge.target));
  const roots = workflow.nodes.filter((node) => !targets.has(node.id));
  return roots.length > 0 ? roots : [workflow.nodes[0]];
}

function getNextNodeIds(
  edges: WorkflowEdge[],
  node: WorkflowNode,
  result: NodeExecutionResult
): string[] {
  const outgoing = edges.filter((edge) => edge.source === node.id);

  if (node.type !== "condition") {
    return outgoing.map((edge) => edge.target);
  }

  const expectedHandle = result.branch ? "true" : "false";
  const branchEdges = outgoing.filter((edge) => edge.sourceHandle === expectedHandle);
  if (branchEdges.length > 0) {
    return branchEdges.map((edge) => edge.target);
  }

  return outgoing.filter((edge) => !edge.sourceHandle).map((edge) => edge.target);
}

function sanitizeNodeInput(input: unknown): unknown {
  if (!input || typeof input !== "object") {
    return input;
  }

  const hiddenKeys = new Set(["authorization", "apiKey", "accessToken", "botToken", "password", "secret"]);
  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>).map(([key, value]) => [
      key,
      hiddenKeys.has(key) ? "[redacted]" : value
    ])
  );
}

function normalizeError(error: unknown): { message: string; name?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name
    };
  }
  return {
    message: typeof error === "string" ? error : "Unknown node error"
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
