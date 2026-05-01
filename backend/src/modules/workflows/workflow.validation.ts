import { z } from "zod";

export const workflowNodeTypeSchema = z.enum([
  "webhook",
  "apiRequest",
  "ai",
  "delay",
  "condition",
  "slack",
  "gmail"
]);

export const workflowNodeSchema = z.object({
  id: z.string().min(1),
  type: workflowNodeTypeSchema,
  name: z.string().min(1),
  position: z
    .object({
      x: z.number().default(0),
      y: z.number().default(0)
    })
    .default({ x: 0, y: 0 }),
  data: z.record(z.unknown()).default({})
});

export const workflowEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional()
});

export const createWorkflowSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  status: z.enum(["draft", "active", "paused"]).default("draft"),
  nodes: z.array(workflowNodeSchema).default([]),
  edges: z.array(workflowEdgeSchema).default([])
});

export const updateWorkflowSchema = createWorkflowSchema.partial().extend({
  version: z.number().int().positive().optional()
});

export const executeWorkflowSchema = z.object({
  input: z.record(z.unknown()).default({}),
  source: z.enum(["manual", "webhook", "schedule", "api"]).default("manual")
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;
