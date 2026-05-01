import { CheckCircle2, CircleDot, Clock3, XCircle } from "lucide-react";
import clsx from "clsx";
import type { ExecutionLog } from "@/lib/types";
import { formatDate, prettyJson } from "@/lib/format";

export function ExecutionTimeline({ logs }: { logs: ExecutionLog[] }) {
  return (
    <div className="rounded-md border border-line bg-panel shadow-sm">
      <div className="border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">Execution log</h2>
      </div>
      <div className="divide-y divide-line">
        {logs.map((log, index) => (
          <div key={`${log.createdAt}-${index}`} className="grid gap-3 px-4 py-4 md:grid-cols-[220px_1fr]">
            <div className="flex items-center gap-3">
              <LogIcon status={log.status} />
              <div>
                <div className="text-sm font-semibold text-ink">{log.nodeName ?? log.status}</div>
                <div className="mt-1 text-xs text-slate-500">{formatDate(log.createdAt)}</div>
              </div>
            </div>
            <div>
              <div
                className={clsx(
                  "text-sm font-medium",
                  log.level === "error" ? "text-red-700" : "text-slate-700"
                )}
              >
                {log.message}
              </div>
              {log.durationMs !== undefined ? (
                <div className="mt-1 text-xs text-slate-500">{log.durationMs} ms</div>
              ) : null}
              {log.output !== undefined ? (
                <pre className="mt-3 max-h-72 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">
                  {prettyJson(log.output)}
                </pre>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogIcon({ status }: { status: string }) {
  if (status === "completed") {
    return <CheckCircle2 className="text-emerald-600" size={19} />;
  }
  if (status === "failed") {
    return <XCircle className="text-red-600" size={19} />;
  }
  if (status === "running") {
    return <CircleDot className="text-teal" size={19} />;
  }
  return <Clock3 className="text-amber" size={19} />;
}
