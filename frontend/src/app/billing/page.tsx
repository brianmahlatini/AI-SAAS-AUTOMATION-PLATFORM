"use client";

import { useEffect, useState } from "react";
import { CreditCard, ExternalLink, Gauge, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import type { BillingOverview } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";

const plans = [
  {
    key: "FREE",
    name: "Free",
    price: "$0",
    lines: ["Limited workflows", "Manual runs", "Community support"]
  },
  {
    key: "PRO",
    name: "Pro",
    price: "$29",
    lines: ["Unlimited workflows", "AI nodes", "Realtime execution logs"]
  },
  {
    key: "ENTERPRISE",
    name: "Enterprise",
    price: "Custom",
    lines: ["SAML and audit logs", "Priority support", "Dedicated deployment support"]
  }
] as const;

export default function BillingPage() {
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<BillingOverview>("/api/billing/subscription")
      .then(setOverview)
      .catch((err) => setError(err.message));
  }, []);

  const checkout = async (plan: "PRO" | "ENTERPRISE") => {
    setBusyPlan(plan);
    setError(null);
    try {
      const session = await api<{ url: string }>("/api/billing/checkout", {
        method: "POST",
        json: { plan }
      });
      window.location.assign(session.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setBusyPlan(null);
    }
  };

  const portal = async () => {
    setBusyPlan("portal");
    setError(null);
    try {
      const session = await api<{ url: string }>("/api/billing/portal", {
        method: "POST"
      });
      window.location.assign(session.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Portal failed");
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Billing</h1>
          <p className="mt-1 text-sm text-slate-500">Subscription and AI token usage.</p>
        </div>
        <button
          type="button"
          title="Open billing portal"
          onClick={portal}
          className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-50"
        >
          <ExternalLink size={16} />
          Portal
        </button>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Plan"
          value={overview?.subscription.plan ?? "FREE"}
          icon={CreditCard}
          accent="text-teal"
        />
        <StatCard
          label="Input tokens"
          value={formatNumber(overview?.usage.inputTokens ?? 0)}
          icon={Gauge}
          accent="text-amber"
        />
        <StatCard
          label="Output tokens"
          value={formatNumber(overview?.usage.outputTokens ?? 0)}
          icon={Sparkles}
          accent="text-coral"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const active = overview?.subscription.plan === plan.key;
          return (
            <section key={plan.key} className="rounded-md border border-line bg-panel p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-ink">{plan.name}</h2>
                {active ? <StatusBadge status={overview?.subscription.status ?? "active"} /> : null}
              </div>
              <div className="mt-4 text-3xl font-semibold text-ink">{plan.price}</div>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {plan.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              {plan.key === "FREE" ? (
                <button
                  disabled
                  className="mt-6 w-full rounded-md border border-line px-3 py-2 text-sm font-semibold text-slate-500"
                >
                  Included
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => checkout(plan.key)}
                  disabled={busyPlan === plan.key}
                  className="mt-6 w-full rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {busyPlan === plan.key ? "Opening" : "Select"}
                </button>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
