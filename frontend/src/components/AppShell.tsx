"use client";

import {
  Activity,
  BarChart3,
  CreditCard,
  LayoutDashboard,
  ShieldCheck,
  Workflow,
  Zap
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import clsx from "clsx";
import { AuthControls } from "./AuthControls";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workflows/new", label: "Builder", icon: Workflow },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/admin", label: "Admin", icon: ShieldCheck }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-line bg-panel px-4 py-5 lg:block">
        <Link href="/dashboard" className="mb-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-ink text-white">
            <Zap size={20} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-ink">Automation OS</span>
            <span className="block text-xs text-slate-500">AI workflow suite</span>
          </span>
        </Link>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-teal/10 text-teal"
                    : "text-slate-600 hover:bg-slate-100 hover:text-ink"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-line bg-panel/95 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Activity className="text-teal" size={20} />
              <span className="text-sm font-semibold text-ink">AI SaaS Automation Platform</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                title="Dashboard"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-white text-slate-600 hover:text-ink lg:hidden"
              >
                <BarChart3 size={18} />
              </Link>
              <AuthControls />
            </div>
          </div>
        </header>

        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
