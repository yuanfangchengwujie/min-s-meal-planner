import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { RefreshCw, Clock, Sparkles, AlertTriangle } from "lucide-react";
import { useAppState } from "@/lib/storage";
import { planDay, todaySeed, nutrientCoverage, KEY_NUTRIENTS } from "@/lib/meal-planner";
import { FOODS_BY_ID } from "@/lib/foods";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "今日食谱 · 敏宝食谱" },
      { name: "description", content: "今天给敏宝吃什么?基于已排敏食材自动生成的一日四餐。" },
      { property: "og:title", content: "今日食谱 · 敏宝食谱" },
      { property: "og:description", content: "一日四餐自动推荐 + 营养结构分析,告别每天纠结。" },
    ],
  }),
  component: TodayPage,
});

function TodayPage() {
  const { state, ready } = useAppState();
  const [shuffle, setShuffle] = useState(0);

  const seed = useMemo(() => todaySeed() + shuffle * 13, [shuffle]);
  const slots = useMemo(() => planDay(state, seed), [state, seed]);
  const coverage = useMemo(() => nutrientCoverage(slots), [slots]);

  if (!ready) return <div className="text-muted-foreground">加载中…</div>;

  const dateStr = new Date().toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const safeCount = Object.values(state.foodStatus).filter((s) => s === "safe").length;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="rounded-3xl bg-gradient-to-br from-primary-soft via-card to-secondary p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">{dateStr}</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">
          今天给{state.profile.name}吃什么?
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          已为你避开 <strong className="text-foreground">{state.profile.knownAllergens.length} 种过敏原</strong>,从 <strong className="text-foreground">{safeCount} 种已排敏食材</strong> 中挑选了今天的菜单。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setShuffle((s) => s + 1)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition-transform hover:scale-[1.02]"
          >
            <RefreshCw className="h-4 w-4" />
            换一批
          </button>
          <Link
            to="/pantry"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            管理食材库
          </Link>
        </div>
      </section>

      {/* Meals */}
      <section className="grid gap-4 sm:grid-cols-2">
        {slots.map((slot) => (
          <article
            key={slot.meal}
            className="group rounded-3xl border border-border/70 bg-card p-5 shadow-soft transition-shadow hover:shadow-glow"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground">
                  {slot.meal}
                </span>
                <h3 className="mt-2 font-display text-lg font-bold leading-tight">
                  {slot.recipe?.name ?? "暂无推荐"}
                </h3>
              </div>
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-2xl">
                {slot.recipe?.emoji ?? "🍽️"}
              </div>
            </div>

            {slot.recipe ? (
              <>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {slot.recipe.prepMin} 分钟
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    {slot.recipe.nutrients.slice(0, 3).join(" · ")}
                  </span>
                </div>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {slot.recipe.ingredients.map((ing) => {
                    const food = FOODS_BY_ID[ing.foodId];
                    if (!food) return null;
                    return (
                      <li
                        key={ing.foodId}
                        className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs"
                      >
                        <span>{food.emoji}</span>
                        <span>{food.name}</span>
                      </li>
                    );
                  })}
                </ul>
                <details className="mt-3 group/details">
                  <summary className="cursor-pointer text-xs font-medium text-primary hover:underline">
                    做法 · {slot.recipe.steps.length} 步
                  </summary>
                  <ol className="mt-2 space-y-1.5 pl-4 text-sm text-muted-foreground list-decimal">
                    {slot.recipe.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                  {slot.recipe.tip && (
                    <p className="mt-2 rounded-xl bg-secondary/60 p-2.5 text-xs text-secondary-foreground">
                      💡 {slot.recipe.tip}
                    </p>
                  )}
                </details>
              </>
            ) : (
              <div className="mt-3 flex items-start gap-2 rounded-2xl bg-warn/15 p-3 text-xs text-warn-foreground">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p>{slot.fallback}</p>
              </div>
            )}
          </article>
        ))}
      </section>

      {/* Nutrient coverage */}
      <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-lg font-bold">今日营养覆盖</h3>
          <span className="text-xs text-muted-foreground">出现在四餐中的关键营养素</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {KEY_NUTRIENTS.map((n) => {
            const count = coverage[n] ?? 0;
            const filled = count > 0;
            return (
              <div
                key={n}
                className={
                  filled
                    ? "rounded-2xl bg-safe/10 p-3 text-center"
                    : "rounded-2xl bg-muted p-3 text-center"
                }
              >
                <p className={filled ? "text-sm font-semibold text-foreground" : "text-sm font-semibold text-muted-foreground"}>
                  {n}
                </p>
                <p className={filled ? "mt-1 text-xs text-safe" : "mt-1 text-xs text-muted-foreground"}>
                  {filled ? `✓ ${count} 餐` : "未覆盖"}
                </p>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
          2 岁宝宝建议每日蛋白质约 13g、铁 7mg、钙 700mg、DHA 100mg。蛋/奶过敏时需特别注意 <strong>钙</strong>(深绿叶菜、豆腐若已排)与 <strong>维D</strong>(三文鱼、香菇、补剂)的来源。
        </p>
      </section>
    </div>
  );
}
