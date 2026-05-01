"use client";

import { useEffect, useState } from "react";
import { Activity, CreditCard, Database, Users, Workflow } from "lucide-react";
import { api } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { StatCard } from "@/components/StatCard";

type AdminOverview = {
  users: number;
  workflows: number;
  executions: number;
  subscriptions: number;
  usageEvents: number;
};

export default function AdminPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<AdminOverview>("/api/admin/overview")
      .then(setOverview)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Admin</h1>
        <p className="mt-1 text-sm text-slate-500">Platform activity and account totals.</p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Users" value={formatNumber(overview?.users ?? 0)} icon={Users} />
        <StatCard label="Workflows" value={formatNumber(overview?.workflows ?? 0)} icon={Workflow} />
        <StatCard label="Executions" value={formatNumber(overview?.executions ?? 0)} icon={Activity} />
        <StatCard label="Subscriptions" value={formatNumber(overview?.subscriptions ?? 0)} icon={CreditCard} />
        <StatCard label="Usage events" value={formatNumber(overview?.usageEvents ?? 0)} icon={Database} />
      </div>

      <section className="rounded-md border border-line bg-panel p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-ink">Operational notes</h2>
        <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
          <div className="rounded-md border border-line p-3">Queue: BullMQ workflow-execution</div>
          <div className="rounded-md border border-line p-3">Cache: Redis workflow definitions</div>
          <div className="rounded-md border border-line p-3">Logs: MongoDB execution documents</div>
        </div>
      </section>
    </div>
  );
}
