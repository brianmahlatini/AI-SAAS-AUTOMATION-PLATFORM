import { Schema, model, type InferSchemaType } from "mongoose";

const workflowNodeSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["webhook", "apiRequest", "ai", "delay", "condition", "slack", "gmail"]
    },
    name: { type: String, required: true },
    position: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 }
    },
    data: { type: Schema.Types.Mixed, default: {} }
  },
  { _id: false }
);

const workflowEdgeSchema = new Schema(
  {
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    sourceHandle: { type: String },
    targetHandle: { type: String }
  },
  { _id: false }
);

const workflowSchema = new Schema(
  {
    ownerId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "active", "paused"],
      default: "draft",
      index: true
    },
    nodes: { type: [workflowNodeSchema], default: [] },
    edges: { type: [workflowEdgeSchema], default: [] },
    webhookKey: { type: String, required: true, unique: true, index: true },
    lastExecutedAt: { type: Date },
    version: { type: Number, default: 1 }
  },
  {
    timestamps: true,
    minimize: false
  }
);

workflowSchema.index({ ownerId: 1, updatedAt: -1 });

export type WorkflowDocument = InferSchemaType<typeof workflowSchema> & {
  _id: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
};

export const WorkflowModel = model("Workflow", workflowSchema);
