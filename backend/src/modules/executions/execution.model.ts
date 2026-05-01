import { Schema, model, type InferSchemaType } from "mongoose";

const executionLogSchema = new Schema(
  {
    nodeId: { type: String },
    nodeName: { type: String },
    nodeType: { type: String },
    level: { type: String, enum: ["info", "warn", "error"], default: "info" },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed", "skipped"],
      required: true
    },
    message: { type: String, required: true },
    input: { type: Schema.Types.Mixed },
    output: { type: Schema.Types.Mixed },
    error: { type: Schema.Types.Mixed },
    durationMs: { type: Number },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false, minimize: false }
);

const executionSchema = new Schema(
  {
    workflowId: { type: String, required: true, index: true },
    workflowName: { type: String, required: true },
    ownerId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed", "cancelled"],
      default: "queued",
      index: true
    },
    source: {
      type: String,
      enum: ["manual", "webhook", "schedule", "api"],
      default: "manual"
    },
    input: { type: Schema.Types.Mixed, default: {} },
    outputs: { type: Schema.Types.Mixed, default: {} },
    currentNodeId: { type: String },
    error: { type: Schema.Types.Mixed },
    logs: { type: [executionLogSchema], default: [] },
    startedAt: { type: Date },
    finishedAt: { type: Date }
  },
  { timestamps: true, minimize: false }
);

executionSchema.index({ ownerId: 1, createdAt: -1 });
executionSchema.index({ workflowId: 1, createdAt: -1 });

export type ExecutionDocument = InferSchemaType<typeof executionSchema> & {
  _id: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
};

export const ExecutionModel = model("Execution", executionSchema);
