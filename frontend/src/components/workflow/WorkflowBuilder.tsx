"use client";

import {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node
} from "@xyflow/react";
import { Check, Play, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { DragEvent, useCallback, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Execution, Workflow, WorkflowNodeType } from "@/lib/types";
import { defaultConfigFor, nodeCatalog } from "./nodeCatalog";
import { NodeConfigPanel } from "./NodeConfigPanel";
import { WorkflowNodeCard, type BuilderNodeData } from "./WorkflowNodeCard";
import { StatusBadge } from "@/components/StatusBadge";

type BuilderNode = Node<BuilderNodeData>;

const nodeTypes = {
  workflow: WorkflowNodeCard
};

const defaultNodes: BuilderNode[] = [
  {
    id: "webhook",
    type: "workflow",
    position: { x: 120, y: 160 },
    data: {
      nodeType: "webhook",
      label: "Webhook trigger",
      config: defaultConfigFor("webhook")
    }
  },
  {
    id: "ai-summary",
    type: "workflow",
    position: { x: 420, y: 160 },
    data: {
      nodeType: "ai",
      label: "AI summary",
      config: defaultConfigFor("ai")
    }
  }
];

const defaultEdges: Edge[] = [
  {
    id: "webhook-ai-summary",
    source: "webhook",
    target: "ai-summary",
    animated: true
  }
];

export function WorkflowBuilder({ workflow }: { workflow?: Workflow }) {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner workflow={workflow} />
    </ReactFlowProvider>
  );
}

function WorkflowBuilderInner({ workflow }: { workflow?: Workflow }) {
  const router = useRouter();
  const { screenToFlowPosition } = useReactFlow();
  const [name, setName] = useState(workflow?.name ?? "Untitled workflow");
  const [description, setDescription] = useState(workflow?.description ?? "");
  const [status, setStatus] = useState<Workflow["status"]>(workflow?.status ?? "draft");
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialNodes = useMemo<BuilderNode[]>(
    () =>
      workflow?.nodes.map<BuilderNode>((node) => ({
        id: node.id,
        type: "workflow",
        position: node.position,
        data: {
          nodeType: node.type,
          label: node.name,
          config: node.data ?? {}
        }
      })) ?? defaultNodes,
    [workflow]
  );

  const initialEdges = useMemo<Edge[]>(
    () =>
      workflow?.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        animated: true
      })) ?? defaultEdges,
    [workflow]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<BuilderNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((current) =>
        addEdge(
          {
            ...connection,
            id: `${connection.source}-${connection.sourceHandle ?? "out"}-${connection.target}`,
            animated: true
          },
          current
        )
      );
    },
    [setEdges]
  );

  const addNode = useCallback(
    (type: WorkflowNodeType, position = { x: 180, y: 180 }) => {
      const catalog = nodeCatalog.find((item) => item.type === type)!;
      const id = `${type}-${Date.now()}`;
      setNodes((current) => [
        ...current,
        {
          id,
          type: "workflow",
          position,
          data: {
            nodeType: type,
            label: catalog.label,
            config: defaultConfigFor(type)
          }
        }
      ]);
      setSelectedNodeId(id);
    },
    [setNodes]
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/workflow-node") as WorkflowNodeType;
      if (!type) {
        return;
      }
      addNode(
        type,
        screenToFlowPosition({
          x: event.clientX,
          y: event.clientY
        })
      );
    },
    [addNode, screenToFlowPosition]
  );

  const updateNode = (nodeId: string, next: Partial<BuilderNodeData>) => {
    setNodes((current) =>
      current.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                ...next
              }
            }
          : node
      )
    );
  };

  const deleteNode = (nodeId: string) => {
    setNodes((current) => current.filter((node) => node.id !== nodeId));
    setEdges((current) => current.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNodeId(undefined);
  };

  const saveWorkflow = async (): Promise<Workflow> => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name,
        description,
        status,
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.data.nodeType,
          name: node.data.label,
          position: node.position,
          data: node.data.config
        })),
        edges: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle ?? undefined,
          targetHandle: edge.targetHandle ?? undefined
        }))
      };

      const response = workflow?.id
        ? await api<{ workflow: Workflow }>(`/api/workflows/${workflow.id}`, {
            method: "PUT",
            json: payload
          })
        : await api<{ workflow: Workflow }>("/api/workflows", {
            method: "POST",
            json: payload
          });

      setMessage("Saved");
      if (!workflow?.id) {
        router.replace(`/workflows/${response.workflow.id}`);
      }
      return response.workflow;
    } finally {
      setSaving(false);
    }
  };

  const runWorkflow = async () => {
    setRunning(true);
    setError(null);
    try {
      const savedWorkflow = await saveWorkflow();
      const response = await api<{ execution: Execution; jobId: string }>(
        `/api/workflows/${savedWorkflow.id}/execute`,
        {
          method: "POST",
          json: {
            source: "manual",
            input: {
              body: {
                sample: true,
                timestamp: new Date().toISOString()
              }
            }
          }
        }
      );
      router.push(`/executions/${response.execution.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Run failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-md border border-line bg-panel p-4 shadow-sm xl:flex-row xl:items-end xl:justify-between">
        <div className="grid flex-1 gap-3 md:grid-cols-[1fr_1.4fr_160px]">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Name
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-teal"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Description
            </span>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-teal"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as Workflow["status"])}
              className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-teal"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {workflow ? <StatusBadge status={workflow.status} /> : null}
          {message ? (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
              <Check size={16} />
              {message}
            </span>
          ) : null}
          <button
            type="button"
            title="Save workflow"
            onClick={() => void saveWorkflow().catch((err) => setError(err.message))}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50 disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Saving" : "Save"}
          </button>
          <button
            type="button"
            title="Run workflow"
            onClick={() => void runWorkflow()}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-md bg-teal px-3 py-2 text-sm font-semibold text-white hover:bg-teal/90 disabled:opacity-60"
          >
            <Play size={16} />
            {running ? "Running" : "Run"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid h-[calc(100vh-238px)] min-h-[560px] overflow-hidden rounded-md border border-line bg-panel shadow-soft xl:grid-cols-[220px_1fr_340px]">
        <aside className="border-b border-line bg-slate-50 p-3 xl:border-b-0 xl:border-r">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Nodes</div>
          <div className="grid gap-2">
            {nodeCatalog.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  type="button"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("application/workflow-node", item.type);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onClick={() => addNode(item.type)}
                  className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-left text-sm font-medium text-ink hover:border-teal/40 hover:bg-teal/5"
                >
                  <Icon className={item.color} size={17} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </aside>

        <div className="workflow-grid h-full" onDrop={onDrop} onDragOver={(event) => event.preventDefault()}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(undefined)}
            fitView
          >
            <MiniMap pannable zoomable nodeColor="#0f766e" />
            <Controls />
            <Background />
          </ReactFlow>
        </div>

        <NodeConfigPanel node={selectedNode} onUpdate={updateNode} onDelete={deleteNode} />
      </div>
    </div>
  );
}
