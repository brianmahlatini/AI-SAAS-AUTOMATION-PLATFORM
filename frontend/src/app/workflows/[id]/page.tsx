"use client";

import { use, useEffect, useState } from "react";
import { WorkflowBuilder } from "@/components/workflow/WorkflowBuilder";
import { api } from "@/lib/api";
import type { Workflow } from "@/lib/types";

export default function WorkflowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ workflow: Workflow }>(`/api/workflows/${id}`)
      .then((payload) => setWorkflow(payload.workflow))
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>;
  }

  if (!workflow) {
    return <div className="rounded-md border border-line bg-panel p-4 text-sm text-slate-500">Loading workflow.</div>;
  }

  return <WorkflowBuilder workflow={workflow} />;
}
