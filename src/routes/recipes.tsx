import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Clock, ShieldCheck, ShieldAlert, Plus, Trash2, X } from "lucide-react";
import { RECIPES, type MealType } from "@/lib/recipes";
import { FOODS, FOODS_BY_ID } from "@/lib/foods";
import { useAppState } from "@/lib/storage";
import { isRecipeSafe } from "@/lib/meal-planner";
import { useCustomRecipes, addCustomRecipe, deleteCustomRecipe, type CustomRecipe } from "@/lib/custom-recipes";
import { useCustomFoods } from "@/lib/custom-foods";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recipes")({
  head: () => ({
    meta: [
      { title: "食谱库 · 敏宝食谱" },
      { name: "description", content: "管理敏宝食谱，自动判断是否安全。" },
    ],
  }),
  component: RecipesPage,
});

const MEALS: MealType[] = ["早餐", "午餐", "晚餐", "加餐"];

function RecipesPage() {
  const { state, ready } = useAppState();
  const { customRecipes, loading } = useCustomRecipes();
  const { customFoods } = useCustomFoods();
  const [meal, setMeal] = useState<MealType | "all">("all");
  const [onlySafe, setOnlySafe] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // 合并预设食材和自定义食材供选择
  const allFoods = useMemo(() => {
    const custom = customFoods.map(f => ({
      id: `custom_${f.id}`,
      name: f.name,
      emoji: f.emoji,
    }));
    return [...FOODS.map(f => ({ id: f.id, name: f.name, emoji: f.emoji })), ...custom];
  }, [customFoods]);

  // 预设食谱
  const presetList = useMemo(() => {
    return RECIPES
      .filter((r) => meal === "all" || r.meal.includes(meal))
      .map((r) => ({ recipe: r, check: isRecipeSafe(r, state), isCustom: false, customId: undefined }))
      .filter(({ check }) => onlySafe ? check.safe : true);
  }, [state, meal, onlySafe]);

  // 自定义食谱
  const customList = useMemo(() => {
    return customRecipes
      .filter((r) => meal === "all" || r.meal.some(m => meal === m))
      .map((r) => ({
        recipe: {
          id: `custom_${r.id}`,
          name: r.name,
          emoji: r.emoji,
          meal: r.meal as MealType[],
          prepMin: r.prep_min,
          ingredients: r.ingredients,
          steps: r.steps,
          tip: r.tip,
        },
        check: { safe: true, reasons: [] as string[] },
        isCustom: true,
        customId: r.id,
      }));
  }, [customRecipes, meal]);

  const allList = [...presetList, ...customList];

  if (!ready || loading) return <div className="text-muted-foreground">加载中…</div>;

  return (
    <div className="space-y-6">
      <section className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold">食谱库</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            全部食谱已避开鸡蛋、小麦、牛奶。绿色徽章表示对你家敏宝完全安全。
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm"
        >
          <Plus className="h-4 w-4" /> 添加食谱
        </button>
      </section>

      <section className="flex flex-wrap items-center gap-2">
        {(["all", ...MEALS] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMeal(m)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium",
              meal === m ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-secondary",
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
        {allList.map(({ recipe, check, isCustom, customId }) => (
          <article key={recipe.id} className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-1">
                  {recipe.meal.map((m) => (
                    <span key={m} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground">{m}</span>
                  ))}
                  {isCustom && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-600">自定义</span>
                  )}
                </div>
                <h3 className="mt-2 font-display text-lg font-bold leading-tight">{recipe.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-2xl">{recipe.emoji}</div>
                {isCustom && (
                  <button
                    onClick={() => deleteCustomRecipe(customId!)}
                    className="rounded-lg p-1 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {recipe.prepMin} 分钟
              </span>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold", check.safe ? "bg-safe/15 text-safe" : "bg-danger/10 text-danger")}>
                {check.safe ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                {check.safe ? "完全安全" : "需注意"}
              </span>
            </div>

            <ul className="mt-3 flex flex-wrap gap-1.5">
              {recipe.ingredients.map((ing) => {
                const food = FOODS_BY_ID[ing.foodId] ?? allFoods.find(f => f.id === ing.foodId);
                if (!food) return null;
                const status = state.foodStatus[ing.foodId];
                return (
                  <li key={ing.foodId} className={cn("inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs",
                    status === "safe" ? "bg-safe/10 text-foreground"
                    : status === "allergic" ? "bg-danger/10 text-danger line-through"
                    : "bg-muted text-muted-foreground")}>
                    <span>{food.emoji}</span>
                    <span>{food.name}</span>
                  </li>
                );
              })}
            </ul>

            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-medium text-primary hover:underline">查看做法</summary>
              <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-sm text-muted-foreground">
                {recipe.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
              {recipe.tip && (
                <p className="mt-2 rounded-xl bg-secondary/60 p-2.5 text-xs text-secondary-foreground">💡 {recipe.tip}</p>
              )}
            </details>
          </article>
        ))}
      </section>

      {showAdd && (
        <AddRecipeModal
          onClose={() => setShowAdd(false)}
          allFoods={allFoods}
        />
      )}
    </div>
  );
}

function AddRecipeModal({ onClose, allFoods }: {
  onClose: () => void;
  allFoods: { id: string; name: string; emoji: string }[];
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🍽️");
  const [meals, setMeals] = useState<string[]>(["早餐"]);
  const [prepMin, setPrepMin] = useState(20);
  const [ingredients, setIngredients] = useState<{ foodId: string; amount: string }[]>([]);
  const [steps, setSteps] = useState<string[]>([""]);
  const [tip, setTip] = useState("");
  const [saving, setSaving] = useState(false);
  const [foodSearch, setFoodSearch] = useState("");

  const toggleMeal = (m: string) =>
    setMeals(meals.includes(m) ? meals.filter(x => x !== m) : [...meals, m]);

  const filteredFoods = allFoods.filter(f =>
    f.name.includes(foodSearch) && !ingredients.find(i => i.foodId === f.id)
  );

  const addIngredient = (foodId: string) => {
    setIngredients([...ingredients, { foodId, amount: "" }]);
    setFoodSearch("");
  };

  const removeIngredient = (foodId: string) =>
    setIngredients(ingredients.filter(i => i.foodId !== foodId));

  const updateAmount = (foodId: string, amount: string) =>
    setIngredients(ingredients.map(i => i.foodId === foodId ? { ...i, amount } : i));

  const updateStep = (idx: number, val: string) =>
    setSteps(steps.map((s, i) => i === idx ? val : s));

  const handleSave = async () => {
    if (!name.trim() || meals.length === 0) return;
    setSaving(true);
    await addCustomRecipe({
      name: name.trim(),
      emoji,
      meal: meals,
      prep_min: prepMin,
      ingredients,
      steps: steps.filter(s => s.trim()),
      tip: tip.trim() || undefined,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center overflow-y-auto">
      <div className="w-full max-w-lg rounded-t-3xl bg-background p-6 shadow-xl sm:rounded-3xl sm:my-8">
        <h3 className="mb-4 font-display text-lg font-bold">添加自定义食谱</h3>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">

          {/* 名称和emoji */}
          <div className="flex gap-3">
            <input value={emoji} onChange={(e) => setEmoji(e.target.value)}
              className="w-16 rounded-xl border border-border bg-card p-2 text-center text-2xl" />
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="食谱名称" className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none" />
          </div>

          {/* 餐型 */}
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">餐型（可多选）</p>
            <div className="flex gap-2">
              {["早餐","午餐","晚餐","加餐"].map(m => (
                <button key={m} onClick={() => toggleMeal(m)}
                  className={cn("rounded-full px-3 py-1 text-xs font-medium", meals.includes(m) ? "bg-primary text-primary-foreground" : "border border-border bg-card")}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* 准备时间 */}
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">准备时间（分钟）</p>
            <input type="number" value={prepMin} onChange={(e) => setPrepMin(Number(e.target.value))}
              className="w-24 rounded-xl border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none" />
          </div>

          {/* 食材 */}
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">食材</p>
            <input value={foodSearch} onChange={(e) => setFoodSearch(e.target.value)}
              placeholder="搜索添加食材…"
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none mb-2" />
            {foodSearch && (
              <div className="max-h-32 overflow-y-auto rounded-xl border border-border bg-card">
                {filteredFoods.slice(0, 8).map(f => (
                  <button key={f.id} onClick={() => addIngredient(f.id)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-secondary">
                    <span>{f.emoji}</span><span>{f.name}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {ingredients.map(ing => {
                const food = allFoods.find(f => f.id === ing.foodId);
                if (!food) return null;
                return (
                  <div key={ing.foodId} className="flex items-center gap-1 rounded-xl bg-muted px-2 py-1">
                    <span className="text-xs">{food.emoji} {food.name}</span>
                    <input value={ing.amount} onChange={(e) => updateAmount(ing.foodId, e.target.value)}
                      placeholder="用量" className="w-16 rounded bg-transparent text-xs focus:outline-none" />
                    <button onClick={() => removeIngredient(ing.foodId)}><X className="h-3 w-3" /></button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 步骤 */}
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">做法步骤</p>
            <div className="space-y-2">
              {steps.map((s, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="text-xs text-muted-foreground w-4">{i+1}.</span>
                  <input value={s} onChange={(e) => updateStep(i, e.target.value)}
                    placeholder={`第 ${i+1} 步`}
                    className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                  {steps.length > 1 && (
                    <button onClick={() => setSteps(steps.filter((_, idx) => idx !== i))}>
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setSteps([...steps, ""])}
              className="mt-2 text-xs text-primary hover:underline">+ 添加步骤</button>
          </div>

          {/* 小贴士 */}
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">小贴士（可选）</p>
            <input value={tip} onChange={(e) => setTip(e.target.value)}
              placeholder="例如：可以提前一晚准备…"
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none" />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-2xl border border-border py-2.5 text-sm font-semibold">取消</button>
          <button onClick={handleSave} disabled={!name.trim() || meals.length === 0 || saving}
            className="flex-1 rounded-2xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
