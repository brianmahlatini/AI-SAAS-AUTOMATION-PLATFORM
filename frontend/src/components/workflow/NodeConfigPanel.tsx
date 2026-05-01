"use client";

import { Trash2 } from "lucide-react";
import type { Node } from "@xyflow/react";
import type { BuilderNodeData } from "./WorkflowNodeCard";
import type { WorkflowNodeType } from "@/lib/types";
import { getCatalogNode } from "./nodeCatalog";
import { useEffect, useState } from "react";

type BuilderNode = Node<BuilderNodeData>;

export function NodeConfigPanel({
  node,
  onUpdate,
  onDelete
}: {
  node?: BuilderNode;
  onUpdate: (nodeId: string, next: Partial<BuilderNodeData>) => void;
  onDelete: (nodeId: string) => void;
}) {
  if (!node) {
    return (
      <aside className="h-full border-l border-line bg-panel p-4">
        <h2 className="text-sm font-semibold text-ink">Node settings</h2>
        <div className="mt-6 rounded-md border border-dashed border-line p-4 text-sm text-slate-500">
          Select a node.
        </div>
      </aside>
    );
  }

  const catalog = getCatalogNode(node.data.nodeType);
  const Icon = catalog.icon;

  const updateConfig = (key: string, value: unknown) => {
    onUpdate(node.id, {
      config: {
        ...node.data.config,
        [key]: value
      }
    });
  };

  return (
    <aside className="h-full overflow-y-auto border-l border-line bg-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className={catalog.color} size={18} />
          <h2 className="text-sm font-semibold text-ink">{catalog.label}</h2>
        </div>
        <button
          type="button"
          title="Delete node"
          onClick={() => onDelete(node.id)}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <Field label="Name">
          <input
            value={node.data.label}
            onChange={(event) => onUpdate(node.id, { label: event.target.value })}
            className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-teal"
          />
        </Field>

        <ConfigFields type={node.data.nodeType} config={node.data.config} updateConfig={updateConfig} />
      </div>
    </aside>
  );
}

function ConfigFields({
  type,
  config,
  updateConfig
}: {
  type: WorkflowNodeType;
  config: Record<string, unknown>;
  updateConfig: (key: string, value: unknown) => void;
}) {
  if (type === "apiRequest") {
    return (
      <>
        <Field label="Method">
          <select
            value={String(config.method ?? "GET")}
            onChange={(event) => updateConfig("method", event.target.value)}
            className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-teal"
          >
            {["GET", "POST", "PUT", "PATCH", "DELETE"].map((method) => (
              <option key={method}>{method}</option>
            ))}
          </select>
        </Field>
        <TextInput label="URL" value={config.url} onChange={(value) => updateConfig("url", value)} />
        <JsonTextarea label="Headers" value={config.headers} onChange={(value) => updateConfig("headers", value)} />
        <JsonTextarea label="Body" value={config.body} onChange={(value) => updateConfig("body", value)} />
      </>
    );
  }

  if (type === "ai") {
    return (
      <>
        <TextInput label="Model" value={config.model} onChange={(value) => updateConfig("model", value)} />
        <Textarea label="Instructions" value={config.instructions} onChange={(value) => updateConfig("instructions", value)} />
        <Textarea label="Prompt" value={config.prompt} onChange={(value) => updateConfig("prompt", value)} rows={7} />
        <NumberInput
          label="Max output tokens"
          value={config.maxOutputTokens}
          onChange={(value) => updateConfig("maxOutputTokens", value)}
        />
        <Field label="Verbosity">
          <select
            value={String(config.verbosity ?? "medium")}
            onChange={(event) => updateConfig("verbosity", event.target.value)}
            className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-teal"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </Field>
      </>
    );
  }

  if (type === "delay") {
    return <NumberInput label="Delay ms" value={config.delayMs} onChange={(value) => updateConfig("delayMs", value)} />;
  }

  if (type === "condition") {
    return (
      <>
        <TextInput label="Left" value={config.left} onChange={(value) => updateConfig("left", value)} />
        <Field label="Operator">
          <select
            value={String(config.operator ?? "eq")}
            onChange={(event) => updateConfig("operator", event.target.value)}
            className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-teal"
          >
            <option value="eq">Equals</option>
            <option value="neq">Not equals</option>
            <option value="contains">Contains</option>
            <option value="gt">Greater than</option>
            <option value="gte">Greater or equal</option>
            <option value="lt">Less than</option>
            <option value="lte">Less or equal</option>
            <option value="exists">Exists</option>
          </select>
        </Field>
        <TextInput label="Right" value={config.right} onChange={(value) => updateConfig("right", value)} />
      </>
    );
  }

  if (type === "slack") {
    return (
      <>
        <TextInput
          label="Channel"
          value={config.channel}
          placeholder="#new-channel or C0123456789"
          onChange={(value) => updateConfig("channel", value)}
        />
        <TextInput label="Webhook URL" value={config.webhookUrl} onChange={(value) => updateConfig("webhookUrl", value)} />
        <Textarea label="Message" value={config.text} onChange={(value) => updateConfig("text", value)} rows={5} />
      </>
    );
  }

  if (type === "gmail") {
    return (
      <>
        <TextInput label="To" value={config.to} onChange={(value) => updateConfig("to", value)} />
        <TextInput label="Subject" value={config.subject} onChange={(value) => updateConfig("subject", value)} />
        <Textarea label="Body" value={config.body} onChange={(value) => updateConfig("body", value)} rows={7} />
        <TextInput label="Access token" value={config.accessToken} onChange={(value) => updateConfig("accessToken", value)} />
      </>
    );
  }

  return <div className="text-sm text-slate-500">No settings.</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function TextInput({
  label,
  value,
  placeholder,
  onChange
}: {
  label: string;
  value: unknown;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <input
        value={String(value ?? "")}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-teal"
      />
    </Field>
  );
}

function NumberInput({
  label,
  value,
  onChange
}: {
  label: string;
  value: unknown;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        value={Number(value ?? 0)}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-teal"
      />
    </Field>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows = 4
}: {
  label: string;
  value: unknown;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <Field label={label}>
      <textarea
        rows={rows}
        value={String(value ?? "")}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-none rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-teal"
      />
    </Field>
  );
}

function JsonTextarea({
  label,
  value,
  onChange
}: {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const [text, setText] = useState(JSON.stringify(value ?? {}, null, 2));
  const [valid, setValid] = useState(true);

  useEffect(() => {
    setText(JSON.stringify(value ?? {}, null, 2));
  }, [value]);

  return (
    <Field label={label}>
      <textarea
        rows={5}
        value={text}
        onChange={(event) => {
          const next = event.target.value;
          setText(next);
          try {
            onChange(JSON.parse(next));
            setValid(true);
          } catch {
            setValid(false);
          }
        }}
        className="w-full resize-none rounded-md border border-line px-3 py-2 font-mono text-xs outline-none focus:border-teal"
      />
      {!valid ? <span className="mt-1 block text-xs text-red-600">Invalid JSON</span> : null}
    </Field>
  );
}
