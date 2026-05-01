export type WorkflowNodeType =
  | "webhook"
  | "apiRequest"
  | "ai"
  | "delay"
  | "condition"
  | "slack"
  | "gmail";

export type WorkflowNode = {
  id: string;
  type: WorkflowNodeType;
  name: string;
  position: {
    x: number;
    y: number;
  };
  data: Record<string, unknown>;
};

export type WorkflowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
};

export type Workflow = {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  status: "draft" | "active" | "paused";
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  webhookKey: string;
  webhookUrl: string;
  version: number;
  lastExecutedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ExecutionLog = {
  nodeId?: string;
  nodeName?: string;
  nodeType?: string;
  level: "info" | "warn" | "error";
  status: "queued" | "running" | "completed" | "failed" | "skipped";
  message: string;
  input?: unknown;
  output?: unknown;
  error?: unknown;
  durationMs?: number;
  createdAt: string;
};

export type Execution = {
  id: string;
  workflowId: string;
  workflowName: string;
  ownerId: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  source: "manual" | "webhook" | "schedule" | "api";
  input: Record<string, unknown>;
  outputs: Record<string, unknown>;
  currentNodeId?: string;
  error?: unknown;
  logs: ExecutionLog[];
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type BillingOverview = {
  subscription: {
    ownerId: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    plan: "FREE" | "PRO" | "ENTERPRISE";
    status: string;
    currentPeriodEnd?: string;
  };
  usage: {
    inputTokens: number;
    outputTokens: number;
    events: number;
  };
};
