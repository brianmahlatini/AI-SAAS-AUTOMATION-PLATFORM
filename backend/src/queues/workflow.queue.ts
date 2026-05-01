import { Queue, QueueEvents, Worker } from "bullmq";
import { config } from "../config/env";
import { logger } from "../config/logger";
import { redisConnection } from "../config/redis";
import { executeWorkflowRun, type WorkflowRunJob } from "../engine/workflow.engine";
import { createQueuedExecution } from "../modules/executions/execution.service";

const queueName = "workflow-execution";

export const workflowQueue = new Queue<WorkflowRunJob>(queueName, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: {
      age: 60 * 60 * 24,
      count: 5000
    },
    removeOnFail: {
      age: 60 * 60 * 24 * 7,
      count: 5000
    }
  }
});

export const workflowQueueEvents = new QueueEvents(queueName, {
  connection: redisConnection
});

export async function enqueueWorkflowRun(input: {
  workflowId: string;
  ownerId: string;
  source: "manual" | "webhook" | "schedule" | "api";
  input: Record<string, unknown>;
}) {
  const execution = await createQueuedExecution(input);
  const job = await workflowQueue.add("run", {
    executionId: execution.id,
    workflowId: input.workflowId,
    ownerId: input.ownerId,
    source: input.source,
    input: input.input
  });

  return {
    execution,
    jobId: job.id
  };
}

export function createWorkflowWorker(): Worker<WorkflowRunJob> {
  const worker = new Worker<WorkflowRunJob>(
    queueName,
    async (job) => {
      logger.info({ jobId: job.id, executionId: job.data.executionId }, "Processing workflow execution");
      await executeWorkflowRun(job.data);
    },
    {
      connection: redisConnection,
      concurrency: config.workerConcurrency
    }
  );

  worker.on("failed", (job, error) => {
    logger.error({ jobId: job?.id, error }, "Workflow job failed");
  });

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id, executionId: job.data.executionId }, "Workflow job completed");
  });

  return worker;
}
