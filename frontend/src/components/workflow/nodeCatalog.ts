import {
  Bot,
  Clock3,
  Code2,
  GitBranch,
  Mail,
  MessageSquare,
  Radio
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { WorkflowNodeType } from "@/lib/types";

export type CatalogNode = {
  type: WorkflowNodeType;
  label: string;
  icon: LucideIcon;
  color: string;
};

export const nodeCatalog: CatalogNode[] = [
  { type: "webhook", label: "Webhook", icon: Radio, color: "text-teal" },
  { type: "apiRequest", label: "API Request", icon: Code2, color: "text-sky-700" },
  { type: "ai", label: "AI", icon: Bot, color: "text-coral" },
  { type: "delay", label: "Delay", icon: Clock3, color: "text-amber" },
  { type: "condition", label: "Condition", icon: GitBranch, color: "text-indigo-700" },
  { type: "slack", label: "Slack", icon: MessageSquare, color: "text-emerald-700" },
  { type: "gmail", label: "Gmail", icon: Mail, color: "text-red-700" }
];

export function getCatalogNode(type: WorkflowNodeType): CatalogNode {
  return nodeCatalog.find((node) => node.type === type) ?? nodeCatalog[0];
}

export function defaultConfigFor(type: WorkflowNodeType): Record<string, unknown> {
  switch (type) {
    case "webhook":
      return {};
    case "apiRequest":
      return {
        method: "GET",
        url: "https://api.example.com/resource",
        headers: {
          "content-type": "application/json"
        },
        body: {}
      };
    case "ai":
      return {
        model: "",
        prompt: "Summarize this payload: {{json trigger.body}}",
        instructions: "Return concise output for the next workflow step.",
        maxOutputTokens: 800,
        verbosity: "medium"
      };
    case "delay":
      return {
        delayMs: 1000
      };
    case "condition":
      return {
        left: "{{steps.api.status}}",
        operator: "eq",
        right: "200"
      };
    case "slack":
      return {
        channel: "",
        text: "Workflow completed"
      };
    case "gmail":
      return {
        to: "",
        subject: "Workflow notification",
        body: "A workflow has completed."
      };
    default:
      return {};
  }
}
