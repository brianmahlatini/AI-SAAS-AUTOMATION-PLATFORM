"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import clsx from "clsx";
import { getCatalogNode } from "./nodeCatalog";
import type { WorkflowNodeType } from "@/lib/types";

export type BuilderNodeData = {
  nodeType: WorkflowNodeType;
  label: string;
  config: Record<string, unknown>;
};

export function WorkflowNodeCard({ data, selected, isConnectable }: NodeProps) {
  const nodeData = data as BuilderNodeData;
  const catalog = getCatalogNode(nodeData.nodeType);
  const Icon = catalog.icon;
  const isCondition = nodeData.nodeType === "condition";

  return (
    <div
      className={clsx(
        "min-w-[190px] rounded-md border bg-white px-3 py-3 shadow-sm",
        selected ? "border-teal ring-2 ring-teal/20" : "border-line"
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        title="Connect into this node"
        className="workflow-handle workflow-handle-target"
      />
      <div className="flex items-start gap-3">
        <span className={clsx("mt-0.5", catalog.color)}>
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink">{nodeData.label}</div>
          <div className="mt-1 text-xs text-slate-500">{catalog.label}</div>
        </div>
      </div>

      {isCondition ? (
        <>
          <Handle
            id="true"
            type="source"
            position={Position.Right}
            isConnectable={isConnectable}
            title="Connect true branch"
            className="workflow-handle workflow-handle-source !bg-emerald-600"
          />
          <Handle
            id="false"
            type="source"
            position={Position.Left}
            isConnectable={isConnectable}
            title="Connect false branch"
            className="workflow-handle workflow-handle-source !bg-coral"
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          title="Connect out from this node"
          className="workflow-handle workflow-handle-source"
        />
      )}
    </div>
  );
}
