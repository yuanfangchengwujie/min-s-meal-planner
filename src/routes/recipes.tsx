import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Clock, ShieldCheck, ShieldAlert } from "lucide-react";
import { RECIPES, type MealType } from "@/lib/recipes";
import { FOODS_BY_ID } from "@/lib/foods";
import { useAppState } from "@/lib/storage";
import { isRecipeSafe } from "@/lib/meal-planner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recipes")({
  head: () => ({
    meta: [
      { title: "食谱库 · 敏宝食谱" },
      { name: "description", content: "全部无蛋、无小麦、无奶的婴幼儿食谱,标注是否对你家敏宝安全。" },
      { property: "og:title", content: "食谱库 · 敏宝食谱" },
      { property: "og:description", content: "浏览全部食谱,自动判断对你家敏宝是否安全。" },
    ],
  }),
  component: RecipesPage,
});

const MEALS: MealType[] = ["早餐", "午餐", "晚餐", "加餐"];

function RecipesPage() {
  const { state, ready } = useAppState();
  const [meal, setMeal] = useState<MealType | "all">("all");
  const [onlySafe, setOnlySafe] = useState(false);

  const list = useMemo(() => {
    return RECIPES.filter((r) => meal === "all" || r.meal.includes(meal)).map((r) => ({
      recipe: r,
      check: isRecipeSafe(r, state),
    })).filter(({ check }) => (onlySafe ? check.safe : true));
  }, [state, meal, onlySafe]);

  if (!ready) return <div className="text-muted-foreground">加载中…</div>;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-display text-2xl font-extrabold">食谱库</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          全部食谱已避开鸡蛋、小麦、牛奶。绿色徽章表示对你家敏宝完全安全。
        </p>
      </section>

      <section className="flex flex-wrap items-center gap-2">
        {(["all", ...MEALS] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMeal(m)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium",
              meal === m
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card hover:bg-secondary",
            )}
          >
            {m === "all" ? "全部" : m}
          </button>
        ))}
        <label className="ml-auto inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={onlySafe}
            onChange={(e) => setOnlySafe(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          只看完全安全
        </label>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {list.map(({ recipe, check }) => (
          <article
            key={recipe.id}
            className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-1">
                  {recipe.meal.map((m) => (
                    <span key={m} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">
                      {m}
                    </span>
                  ))}
                </div>
                <h3 className="mt-2 font-display text-lg font-bold leading-tight">{recipe.name}</h3>
              </div>
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-2xl">
                {recipe.emoji}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {recipe.prepMin} 分钟
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold",
                  check.safe ? "bg-safe/15 text-safe" : "bg-danger/10 text-danger",
                )}
              >
                {check.safe ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                {check.safe ? "完全安全" : "需注意"}
              </span>
            </div>

            {!check.safe && (
              <p className="mt-2 rounded-xl bg-danger/10 p-2 text-[11px] text-danger">
                {check.reasons.join("、")}
              </p>
            )}

            <ul className="mt-3 flex flex-wrap gap-1.5">
              {recipe.ingredients.map((ing) => {
                const food = FOODS_BY_ID[ing.foodId];
                if (!food) return null;
                const status = state.foodStatus[ing.foodId];
                return (
                  <li
                    key={ing.foodId}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs",
                      status === "safe" ? "bg-safe/10 text-foreground"
                        : status === "allergic" ? "bg-danger/10 text-danger line-through"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <span>{food.emoji}</span>
                    <span>{food.name}</span>
                  </li>
                );
              })}
            </ul>

            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-medium text-primary hover:underline">
                查看做法
              </summary>
              <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm text-muted-foreground">
                {recipe.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              {recipe.tip && (
                <p className="mt-2 rounded-xl bg-secondary/60 p-2.5 text-xs text-secondary-foreground">
                  💡 {recipe.tip}
                </p>
              )}
            </details>
          </article>
        ))}
      </section>
    </div>
  );
}
