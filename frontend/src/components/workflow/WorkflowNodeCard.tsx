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

export function WorkflowNodeCard({ data, selected }: NodeProps) {
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
      <Handle type="target" position={Position.Top} />
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
          <Handle id="false" type="source" position={Position.Left} className="!bg-coral" />
          <Handle id="true" type="source" position={Position.Right} className="!bg-emerald-600" />
        </>
      ) : (
        <Handle type="source" position={Position.Bottom} />
      )}
    </div>
  );
}
