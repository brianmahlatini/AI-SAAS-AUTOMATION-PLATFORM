import { evaluateCondition } from "../conditions";
import { renderTemplate } from "../template";
import type { NodeExecutor } from "../types";

export const executeConditionNode: NodeExecutor = async (node, context) => {
  const data = renderTemplate(node.data ?? {}, {
    trigger: context.trigger,
    steps: context.steps
  }) as Record<string, unknown>;

  const result = evaluateCondition({
    left: data.left,
    operator: typeof data.operator === "string" ? data.operator : "eq",
    right: data.right
  });

  return {
    branch: result,
    output: {
      result,
      left: data.left,
      operator: data.operator ?? "eq",
      right: data.right
    }
  };
};
