"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { io } from "socket.io-client";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import type { Execution, ExecutionLog } from "@/lib/types";
import { formatDate, prettyJson } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { ExecutionTimeline } from "@/components/ExecutionTimeline";

const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000";

export default function ExecutionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [execution, setExecution] = useState<Execution | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadExecution = useCallback(() => {
    api<{ execution: Execution }>(`/api/executions/${id}`)
      .then((payload) => setExecution(payload.execution))
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    loadExecution();
  }, [loadExecution]);

  useEffect(() => {
    const socket = io(wsUrl, {
      transports: ["websocket", "polling"]
    });

    socket.emit("execution:subscribe", id);
    socket.on("execution:update", (event: { status?: Execution["status"]; log?: ExecutionLog }) => {
      setExecution((current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          status: event.status ?? current.status,
          logs: event.log ? [...current.logs, event.log] : current.logs
        };
      });
    });

    return () => {
      socket.emit("execution:unsubscribe", id);
      socket.disconnect();
    };
  }, [id]);

  if (error) {
    return <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>;
  }

  if (!execution) {
    return <div className="rounded-md border border-line bg-panel p-4 text-sm text-slate-500">Loading execution.</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 rounded-md border border-line bg-panel p-4 shadow-sm md:flex-row md:items-center">
        <div>
          <Link href="/dashboard" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-teal">
            <ArrowLeft size={16} />
            Dashboard
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-ink">{execution.workflowName}</h1>
            <StatusBadge status={execution.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Started {formatDate(execution.startedAt ?? execution.createdAt)}
          </p>
        </div>
        <button
          type="button"
          title="Refresh execution"
          onClick={loadExecution}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <ExecutionTimeline logs={execution.logs} />
        <aside className="rounded-md border border-line bg-panel shadow-sm">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Outputs</h2>
          </div>
          <pre className="max-h-[640px] overflow-auto p-4 text-xs text-slate-700">{prettyJson(execution.outputs)}</pre>
        </aside>
      </div>
    </div>
  );
}
