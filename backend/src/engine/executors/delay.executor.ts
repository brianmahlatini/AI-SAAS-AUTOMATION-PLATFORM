import { setTimeout } from "timers/promises";
import { renderTemplate } from "../template";
import type { NodeExecutor } from "../types";

export const executeDelayNode: NodeExecutor = async (node, context) => {
  const data = renderTemplate(node.data ?? {}, {
    trigger: context.trigger,
    steps: context.steps
  }) as Record<string, unknown>;
  const delayMs = Math.min(Number(data.delayMs ?? 1000), 15 * 60 * 1000);

  await setTimeout(delayMs);

  return {
    output: {
      delayedMs: delayMs
    }
  };
};
