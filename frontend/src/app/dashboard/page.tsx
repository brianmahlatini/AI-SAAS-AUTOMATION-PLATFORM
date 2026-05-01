"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bot, Clock3, Play, Plus, Workflow as WorkflowIcon } from "lucide-react";
import { api } from "@/lib/api";
import type { BillingOverview, Execution, Workflow } from "@/lib/types";
import { formatDate, formatNumber } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";

export default function DashboardPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [billing, setBilling] = useState<BillingOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<{ workflows: Workflow[] }>("/api/workflows"),
      api<{ executions: Execution[] }>("/api/executions"),
      api<BillingOverview>("/api/billing/subscription")
    ])
      .then(([workflowPayload, executionPayload, billingPayload]) => {
        setWorkflows(workflowPayload.workflows);
        setExecutions(executionPayload.executions);
        setBilling(billingPayload);
      })
      .catch((err) => setError(err.message));
  }, []);

  const activeWorkflows = useMemo(
    () => workflows.filter((workflow) => workflow.status === "active").length,
    [workflows]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Workflow health, executions, and usage.</p>
        </div>
        <Link
          href="/workflows/new"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
        >
          <Plus size={18} />
          New workflow
        </Link>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Workflows" value={formatNumber(workflows.length)} icon={WorkflowIcon} />
        <StatCard label="Active" value={formatNumber(activeWorkflows)} icon={Play} accent="text-emerald-600" />
        <StatCard label="Executions" value={formatNumber(executions.length)} icon={Clock3} accent="text-amber" />
        <StatCard
          label="AI tokens"
          value={formatNumber((billing?.usage.inputTokens ?? 0) + (billing?.usage.outputTokens ?? 0))}
          icon={Bot}
          accent="text-coral"
        />
      </div>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-md border border-line bg-panel shadow-sm">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Workflows</h2>
            <Link href="/workflows/new" className="text-sm font-semibold text-teal hover:text-teal/80">
              Create
            </Link>
          </div>
          <div className="divide-y divide-line">
            {workflows.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">No workflows yet.</div>
            ) : (
              workflows.map((workflow) => (
                <Link
                  key={workflow.id}
                  href={`/workflows/${workflow.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-ink">{workflow.name}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {workflow.nodes.length} nodes - updated {formatDate(workflow.updatedAt)}
                    </div>
                  </div>
                  <StatusBadge status={workflow.status} />
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="rounded-md border border-line bg-panel shadow-sm">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Recent executions</h2>
          </div>
          <div className="divide-y divide-line">
            {executions.length === 0 ? (
              <div className="px-4 py-8 text-sm text-slate-500">No executions yet.</div>
            ) : (
              executions.slice(0, 8).map((execution) => (
                <Link
                  key={execution.id}
                  href={`/executions/${execution.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-ink">{execution.workflowName}</div>
                    <div className="mt-1 text-xs text-slate-500">{formatDate(execution.createdAt)}</div>
                  </div>
                  <StatusBadge status={execution.status} />
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
