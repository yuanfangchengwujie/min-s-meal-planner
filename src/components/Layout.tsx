import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Sparkles, Carrot, FlaskConical, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "今日食谱", icon: Sparkles },
  { to: "/pantry", label: "食材库", icon: Carrot },
  { to: "/trials", label: "排敏记录", icon: FlaskConical },
  { to: "/recipes", label: "食谱库", icon: BookOpen },
] as const;

export function Layout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 py-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
              <span className="text-lg">🍼</span>
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-base font-bold leading-tight truncate">敏宝食谱</h1>
              <p className="text-[11px] text-muted-foreground leading-tight">为过敏宝宝定制的一日四餐</p>
            </div>
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-safe" />
            本地存储 · 数据不离开你的设备
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-6 pb-28 sm:pb-10">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav (mobile) / inline nav (desktop) */}
      <nav className="fixed bottom-3 left-1/2 z-30 -translate-x-1/2 w-[min(96%,30rem)] rounded-3xl border border-border/70 bg-card/90 px-2 py-2 shadow-glow backdrop-blur-md sm:bottom-6">
        <ul className="grid grid-cols-4 gap-1">
          {NAV.map((n) => {
            const active = pathname === n.to;
            const Icon = n.icon;
            return (
              <li key={n.to}>
                <Link
                  to={n.to}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{n.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
