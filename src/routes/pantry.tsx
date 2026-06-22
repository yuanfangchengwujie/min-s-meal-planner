import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, X, HelpCircle, Beaker, Search } from "lucide-react";
import { FOODS, ALLERGEN_LABEL, type FoodCategory } from "@/lib/foods";
import { useAppState, setFoodStatus, type FoodStatus } from "@/lib/storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pantry")({
  head: () => ({
    meta: [
      { title: "食材库 · 敏宝食谱" },
      { name: "description", content: "管理敏宝已排敏、正在测试、过敏的食材清单。" },
      { property: "og:title", content: "食材库 · 敏宝食谱" },
      { property: "og:description", content: "标记每一种食材的状态,推荐更准确。" },
    ],
  }),
  component: PantryPage,
});

const CATEGORIES: FoodCategory[] = ["主食", "蛋白质", "蔬菜", "水果", "油脂", "调味"];

const STATUS_META: Record<FoodStatus, { label: string; chip: string }> = {
  safe: { label: "已排敏", chip: "bg-safe text-safe-foreground" },
  trialing: { label: "测试中", chip: "bg-warn text-warn-foreground" },
  untested: { label: "未试", chip: "bg-untested text-untested-foreground" },
  allergic: { label: "过敏", chip: "bg-danger text-danger-foreground" },
};

function PantryPage() {
  const { state, ready } = useAppState();
  const [filter, setFilter] = useState<FoodStatus | "all">("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return FOODS.filter((f) => {
      const status = state.foodStatus[f.id] ?? "untested";
      if (filter !== "all" && status !== filter) return false;
      if (q && !f.name.includes(q)) return false;
      return true;
    });
  }, [state, filter, q]);

  if (!ready) return <div className="text-muted-foreground">加载中…</div>;

  const counts = {
    safe: Object.values(state.foodStatus).filter((s) => s === "safe").length,
    trialing: Object.values(state.foodStatus).filter((s) => s === "trialing").length,
    allergic: Object.values(state.foodStatus).filter((s) => s === "allergic").length,
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-display text-2xl font-extrabold">食材库</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          标记每一种食材的状态,系统会基于「已排敏」的食材推荐每日食谱。
        </p>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <StatCard label="已排敏" value={counts.safe} variant="safe" />
        <StatCard label="测试中" value={counts.trialing} variant="warn" />
        <StatCard label="已过敏" value={counts.allergic} variant="danger" />
      </section>

      {/* Search + filter */}
      <section className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索食材…"
            className="w-full rounded-2xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["all", "safe", "trialing", "untested", "allergic"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                filter === k
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border hover:bg-secondary",
              )}
            >
              {k === "all" ? "全部" : STATUS_META[k].label}
            </button>
          ))}
        </div>
      </section>

      {/* Foods grouped by category */}
      {CATEGORIES.map((cat) => {
        const items = filtered.filter((f) => f.category === cat);
        if (items.length === 0) return null;
        return (
          <section key={cat}>
            <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
              {cat}
            </h3>
            <ul className="grid gap-2 sm:grid-cols-2">
              {items.map((f) => {
                const status = (state.foodStatus[f.id] ?? "untested") as FoodStatus;
                return (
                  <li
                    key={f.id}
                    className="rounded-2xl border border-border/70 bg-card p-3 shadow-soft"
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-xl">
                        {f.emoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold">{f.name}</p>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              STATUS_META[status].chip,
                            )}
                          >
                            {STATUS_META[status].label}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {f.nutrients.slice(0, 4).join(" · ") || "—"}
                          {f.allergens.length > 0 && (
                            <span className="ml-1 text-danger">
                              · 含{f.allergens.map((a) => ALLERGEN_LABEL[a]).join("/")}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-4 gap-1">
                      <StatusBtn current={status} target="safe" onClick={() => setFoodStatus(f.id, "safe")}>
                        <Check className="h-3.5 w-3.5" />
                        排敏
                      </StatusBtn>
                      <StatusBtn current={status} target="trialing" onClick={() => setFoodStatus(f.id, "trialing")}>
                        <Beaker className="h-3.5 w-3.5" />
                        测试
                      </StatusBtn>
                      <StatusBtn current={status} target="untested" onClick={() => setFoodStatus(f.id, "untested")}>
                        <HelpCircle className="h-3.5 w-3.5" />
                        未试
                      </StatusBtn>
                      <StatusBtn current={status} target="allergic" onClick={() => setFoodStatus(f.id, "allergic")}>
                        <X className="h-3.5 w-3.5" />
                        过敏
                      </StatusBtn>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function StatCard({ label, value, variant }: { label: string; value: number; variant: "safe" | "warn" | "danger" }) {
  const ring = variant === "safe" ? "bg-safe/10" : variant === "warn" ? "bg-warn/15" : "bg-danger/10";
  const text = variant === "safe" ? "text-safe" : variant === "warn" ? "text-warn-foreground" : "text-danger";
  return (
    <div className={cn("rounded-2xl p-4", ring)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-display text-2xl font-extrabold", text)}>{value}</p>
    </div>
  );
}

function StatusBtn({
  current,
  target,
  onClick,
  children,
}: {
  current: FoodStatus;
  target: FoodStatus;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const active = current === target;
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors",
        active
          ? STATUS_META[target].chip
          : "bg-muted text-muted-foreground hover:bg-secondary",
      )}
    >
      {children}
    </button>
  );
}
