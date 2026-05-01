"use client";

import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
import clsx from "clsx";
import { Trash2 } from "lucide-react";
import type { MouseEvent } from "react";
import { getCatalogNode } from "./nodeCatalog";
import type { WorkflowNodeType } from "@/lib/types";

export type BuilderNodeData = {
  nodeType: WorkflowNodeType;
  label: string;
  config: Record<string, unknown>;
};

export function WorkflowNodeCard({ id, data, selected, isConnectable }: NodeProps) {
  const { deleteElements } = useReactFlow();
  const nodeData = data as BuilderNodeData;
  const catalog = getCatalogNode(nodeData.nodeType);
  const Icon = catalog.icon;
  const isCondition = nodeData.nodeType === "condition";

  const deleteNode = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    void deleteElements({ nodes: [{ id }] });
  };

  return (
    <div
      className={clsx(
        "group relative min-w-[190px] rounded-md border bg-white py-3 pl-3 pr-10 shadow-sm",
        selected ? "border-teal ring-2 ring-teal/20" : "border-line"
      )}
    >
      <button
        type="button"
        title="Delete node"
        aria-label={`Delete ${nodeData.label}`}
        onClick={deleteNode}
        className="nodrag nopan absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md border border-line bg-white text-slate-400 shadow-sm opacity-80 hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-200 group-hover:opacity-100"
      >
        <Trash2 size={14} />
      </button>

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
