import { AppError } from "../../middleware/error";
import { executeAiNode } from "./ai.executor";
import { executeApiRequestNode } from "./apiRequest.executor";
import { executeConditionNode } from "./condition.executor";
import { executeDelayNode } from "./delay.executor";
import { executeGmailNode } from "./gmail.executor";
import { executeSlackNode } from "./slack.executor";
import type { NodeExecutor, WorkflowNode } from "../types";

const webhookExecutor: NodeExecutor = async (_node, context) => ({
  output: context.trigger
});

export function getNodeExecutor(node: WorkflowNode): NodeExecutor {
  switch (node.type) {
    case "webhook":
      return webhookExecutor;
    case "apiRequest":
      return executeApiRequestNode;
    case "ai":
      return executeAiNode;
    case "delay":
      return executeDelayNode;
    case "condition":
      return executeConditionNode;
    case "slack":
      return executeSlackNode;
    case "gmail":
      return executeGmailNode;
    default:
      throw new AppError(400, `Unsupported node type: ${node.type}`, "UNSUPPORTED_NODE");
  }
}
