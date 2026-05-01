import { AppError } from "../../middleware/error";
import { publishExecutionEvent } from "../../realtime/events";
import { getWorkflowDefinition } from "../workflows/workflow.service";
import { ExecutionModel, type ExecutionDocument } from "./execution.model";

type ExecutionLogInput = {
  nodeId?: string;
  nodeName?: string;
  nodeType?: string;
  level?: "info" | "warn" | "error";
  status: "queued" | "running" | "completed" | "failed" | "skipped";
  message: string;
  input?: unknown;
  output?: unknown;
  error?: unknown;
  durationMs?: number;
};

function toApiExecution(execution: ExecutionDocument) {
  return {
    id: execution._id.toString(),
    workflowId: execution.workflowId,
    workflowName: execution.workflowName,
    ownerId: execution.ownerId,
    status: execution.status,
    source: execution.source,
    input: execution.input,
    outputs: execution.outputs,
    currentNodeId: execution.currentNodeId,
    error: execution.error,
    logs: execution.logs,
    startedAt: execution.startedAt,
    finishedAt: execution.finishedAt,
    createdAt: execution.createdAt,
    updatedAt: execution.updatedAt
  };
}

export type ApiExecution = ReturnType<typeof toApiExecution>;

export async function createQueuedExecution(input: {
  workflowId: string;
  ownerId: string;
  source: "manual" | "webhook" | "schedule" | "api";
  input: Record<string, unknown>;
}): Promise<ApiExecution> {
  const workflow = await getWorkflowDefinition(input.workflowId);

  if (workflow.ownerId !== input.ownerId) {
    throw new AppError(403, "You do not own this workflow", "WORKFLOW_FORBIDDEN");
  }

  const execution = await ExecutionModel.create({
    workflowId: workflow.id,
    workflowName: workflow.name,
    ownerId: workflow.ownerId,
    source: input.source,
    input: input.input,
    status: "queued",
    logs: [
      {
        status: "queued",
        message: "Execution queued",
        createdAt: new Date()
      }
    ]
  });

  const apiExecution = toApiExecution(execution as ExecutionDocument);
  await publishExecutionEvent({
    executionId: apiExecution.id,
    ownerId: apiExecution.ownerId,
    status: apiExecution.status,
    message: "Execution queued",
    createdAt: new Date().toISOString()
  });
  return apiExecution;
}

export async function markExecutionRunning(executionId: string): Promise<void> {
  const execution = await ExecutionModel.findByIdAndUpdate(
    executionId,
    { $set: { status: "running", startedAt: new Date() } },
    { new: true }
  );

  if (execution) {
    await publishExecutionEvent({
      executionId,
      ownerId: execution.ownerId,
      status: "running",
      message: "Execution started",
      createdAt: new Date().toISOString()
    });
  }
}

export async function appendExecutionLog(executionId: string, log: ExecutionLogInput): Promise<void> {
  const entry = {
    ...log,
    createdAt: new Date()
  };

  const execution = await ExecutionModel.findByIdAndUpdate(
    executionId,
    {
      $set: {
        currentNodeId: log.nodeId,
        updatedAt: new Date()
      },
      $push: { logs: entry }
    },
    { new: true }
  );

  if (execution) {
    await publishExecutionEvent({
      executionId,
      ownerId: execution.ownerId,
      status: execution.status,
      nodeId: log.nodeId,
      message: log.message,
      log: entry,
      output: log.output,
      createdAt: new Date().toISOString()
    });
  }
}

export async function markExecutionCompleted(executionId: string, outputs: Record<string, unknown>): Promise<void> {
  const execution = await ExecutionModel.findByIdAndUpdate(
    executionId,
    {
      $set: {
        status: "completed",
        outputs,
        currentNodeId: undefined,
        finishedAt: new Date()
      }
    },
    { new: true }
  );

  if (execution) {
    await publishExecutionEvent({
      executionId,
      ownerId: execution.ownerId,
      status: "completed",
      message: "Execution completed",
      output: outputs,
      createdAt: new Date().toISOString()
    });
  }
}

export async function markExecutionFailed(executionId: string, error: unknown): Promise<void> {
  const normalizedError = normalizeError(error);
  const execution = await ExecutionModel.findByIdAndUpdate(
    executionId,
    {
      $set: {
        status: "failed",
        error: normalizedError,
        currentNodeId: undefined,
        finishedAt: new Date()
      },
      $push: {
        logs: {
          status: "failed",
          level: "error",
          message: normalizedError.message,
          error: normalizedError,
          createdAt: new Date()
        }
      }
    },
    { new: true }
  );

  if (execution) {
    await publishExecutionEvent({
      executionId,
      ownerId: execution.ownerId,
      status: "failed",
      message: normalizedError.message,
      log: normalizedError,
      createdAt: new Date().toISOString()
    });
  }
}

export async function listExecutions(
  ownerId: string,
  role: "USER" | "ADMIN",
  workflowId?: string
): Promise<ApiExecution[]> {
  const query: Record<string, unknown> = role === "ADMIN" ? {} : { ownerId };
  if (workflowId) {
    query.workflowId = workflowId;
  }
  const executions = await ExecutionModel.find(query).sort({ createdAt: -1 }).limit(100).lean<ExecutionDocument[]>();
  return executions.map((execution) => toApiExecution(execution));
}

export async function getExecution(id: string, ownerId: string, role: "USER" | "ADMIN"): Promise<ApiExecution> {
  const execution = await ExecutionModel.findById(id).lean<ExecutionDocument>();
  if (!execution) {
    throw new AppError(404, "Execution not found", "EXECUTION_NOT_FOUND");
  }

  if (role !== "ADMIN" && execution.ownerId !== ownerId) {
    throw new AppError(403, "You do not own this execution", "EXECUTION_FORBIDDEN");
  }

  return toApiExecution(execution);
}

export async function countExecutions(): Promise<number> {
  return ExecutionModel.countDocuments();
}

function normalizeError(error: unknown): { message: string; name?: string; stack?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack
    };
  }

  return {
    message: typeof error === "string" ? error : "Execution failed"
  };
}
