import clsx from "clsx";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  running: "bg-teal-50 text-teal-700 ring-teal-200",
  queued: "bg-amber-50 text-amber-700 ring-amber-200",
  draft: "bg-slate-100 text-slate-700 ring-slate-200",
  paused: "bg-orange-50 text-orange-700 ring-orange-200",
  failed: "bg-red-50 text-red-700 ring-red-200",
  cancelled: "bg-slate-100 text-slate-700 ring-slate-200",
  inactive: "bg-slate-100 text-slate-700 ring-slate-200"
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide ring-1",
        statusStyles[status] ?? statusStyles.inactive
      )}
    >
      {status}
    </span>
  );
}
