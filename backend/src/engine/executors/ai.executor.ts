import OpenAI from "openai";
import { config } from "../../config/env";
import { AppError } from "../../middleware/error";
import { recordUsageEvent } from "../../modules/billing/usage.repository";
import { renderString, renderTemplate } from "../template";
import type { NodeExecutor } from "../types";

const openai = config.ai.openaiApiKey
  ? new OpenAI({
      apiKey: config.ai.openaiApiKey
    })
  : undefined;

export const executeAiNode: NodeExecutor = async (node, context) => {
  const data = renderTemplate(node.data ?? {}, {
    trigger: context.trigger,
    steps: context.steps
  }) as Record<string, unknown>;

  if (!openai) {
    throw new AppError(500, "OPENAI_API_KEY is not configured", "OPENAI_NOT_CONFIGURED");
  }

  const model = String(data.model || config.ai.openaiModel);
  const prompt = renderString(data.prompt, {
    trigger: context.trigger,
    steps: context.steps
  });
  const instructions = renderString(
    data.instructions,
    {
      trigger: context.trigger,
      steps: context.steps
    },
    "You are an automation workflow step. Return concise, useful output for the next workflow step."
  );

  const response = await openai.responses.create({
    model,
    input: prompt,
    instructions,
    max_output_tokens: Number(data.maxOutputTokens ?? 800),
    text: {
      verbosity: data.verbosity === "high" ? "high" : data.verbosity === "low" ? "low" : "medium"
    },
    metadata: {
      workflowId: context.workflowId,
      executionId: context.executionId,
      nodeId: node.id
    }
  } as never);

  const usage = response.usage as
    | {
        input_tokens?: number;
        output_tokens?: number;
      }
    | undefined;

  await recordUsageEvent({
    ownerId: context.ownerId,
    executionId: context.executionId,
    nodeId: node.id,
    provider: "openai",
    model,
    inputTokens: usage?.input_tokens ?? 0,
    outputTokens: usage?.output_tokens ?? 0
  });

  return {
    output: {
      provider: "openai",
      model,
      text: response.output_text,
      responseId: response.id,
      usage
    }
  };
};
