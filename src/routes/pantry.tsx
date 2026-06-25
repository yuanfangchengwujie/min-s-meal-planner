import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, X, HelpCircle, Beaker, Search, Plus, Trash2 } from "lucide-react";
import { FOODS, ALLERGEN_LABEL, type FoodCategory, type AllergenId, type NutrientTag } from "@/lib/foods";
import { useAppState, setFoodStatus, type FoodStatus } from "@/lib/storage";
import { useCustomFoods, addCustomFood, deleteCustomFood } from "@/lib/custom-foods";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pantry")({
  head: () => ({
    meta: [
      { title: "食材库 · 敏宝食谱" },
      { name: "description", content: "管理敏宝已排敏、正在测试、过敏的食材清单。" },
    ],
  }),
  component: PantryPage,
});

const CATEGORIES: FoodCategory[] = ["主食", "蛋白质", "蔬菜", "水果", "油脂", "调味"];
const ALL_NUTRIENTS: NutrientTag[] = ["蛋白质","铁","锌","钙","DHA","维D","维A","维C","膳食纤维","碳水","健康脂肪","B族"];
const ALL_ALLERGENS: AllergenId[] = ["egg","milk","wheat","soy","peanut","treenut","fish","shellfish","sesame"];

const STATUS_META: Record<FoodStatus, { label: string; chip: string }> = {
  safe: { label: "已排敏", chip: "bg-safe text-safe-foreground" },
  trialing: { label: "测试中", chip: "bg-warn text-warn-foreground" },
  untested: { label: "未试", chip: "bg-untested text-untested-foreground" },
  allergic: { label: "过敏", chip: "bg-danger text-danger-foreground" },
};

function PantryPage() {
  const { state, ready } = useAppState();
  const { customFoods, loading: customLoading } = useCustomFoods();
  const [filter, setFilter] = useState<FoodStatus | "all">("all");
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  // 合并预设食材和自定义食材
  const allFoods = useMemo(() => {
    const custom = customFoods.map(f => ({
      id: `custom_${f.id}`,
      name: f.name,
      emoji: f.emoji,
      category: f.category as FoodCategory,
      allergens: f.allergens as AllergenId[],
      nutrients: f.nutrients as NutrientTag[],
      notes: f.notes,
      isCustom: true,
      customId: f.id,
    }));
    return [...FOODS.map(f => ({ ...f, isCustom: false, customId: undefined })), ...custom];
  }, [customFoods]);

  const filtered = useMemo(() => {
    return allFoods.filter((f) => {
      const status = state.foodStatus[f.id] ?? "untested";
      if (filter !== "all" && status !== filter) return false;
      if (q && !f.name.includes(q)) return false;
      return true;
    });
  }, [allFoods, state, filter, q]);

  if (!ready || customLoading) return <div className="text-muted-foreground">加载中…</div>;

  const counts = {
    safe: Object.values(state.foodStatus).filter((s) => s === "safe").length,
    trialing: Object.values(state.foodStatus).filter((s) => s === "trialing").length,
    untested: allFoods.length - Object.values(state.foodStatus).filter((s) => s !== "untested").length,
    allergic: Object.values(state.foodStatus).filter((s) => s === "allergic").length,
  };

  return (
    <div className="space-y-6">
      <section className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl font-extrabold">食材库</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            标记每一种食材的状态,系统会基于「已排敏」的食材推荐每日食谱。
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm"
        >
          <Plus className="h-4 w-4" /> 添加食材
        </button>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <StatCard label="已排敏" value={counts.safe} variant="safe" />
        <StatCard label="测试中" value={counts.trialing} variant="warn" />
        <StatCard label="未试" value={counts.untested} variant="untested" />
        <StatCard label="已过敏" value={counts.allergic} variant="danger" />
      </section>

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
                filter === k ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:bg-secondary",
              )}
            >
              {k === "all" ? "全部" : STATUS_META[k].label}
            </button>
          ))}
        </div>
      </section>

      {CATEGORIES.map((cat) => {
  const items = filtered.filter((f) => f.category === cat);
  if (items.length === 0) return null;
  return (
    <CollapsibleCategory key={cat} cat={cat} items={items} state={state} />
  );
})}

      {showAdd && (
        <AddFoodModal
          onClose={() => setShowAdd(false)}
          allNutrients={ALL_NUTRIENTS}
          allAllergens={ALL_ALLERGENS}
        />
      )}
    </div>
  );
}

function AddFoodModal({ onClose, allNutrients, allAllergens }: {
  onClose: () => void;
  allNutrients: NutrientTag[];
  allAllergens: AllergenId[];
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🥦");
  const [category, setCategory] = useState<FoodCategory>("蔬菜");
  const [nutrients, setNutrients] = useState<NutrientTag[]>([]);
  const [allergens, setAllergens] = useState<AllergenId[]>([]);
  const [saving, setSaving] = useState(false);

  const toggle = <T,>(arr: T[], item: T) =>
    arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await addCustomFood({ name: name.trim(), emoji, category, nutrients, allergens });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-background p-6 shadow-xl sm:rounded-3xl">
        <h3 className="mb-4 font-display text-lg font-bold">添加自定义食材</h3>
        <div className="space-y-4">
          <div className="flex gap-3">
            <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-16 rounded-xl border border-border bg-card p-2 text-center text-2xl" />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="食材名称" className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none" />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">分类</p>
            <div className="flex flex-wrap gap-1.5">
              {(["主食","蛋白质","蔬菜","水果","油脂","调味"] as FoodCategory[]).map((c) => (
                <button key={c} onClick={() => setCategory(c)} className={cn("rounded-full px-3 py-1 text-xs font-medium", category === c ? "bg-primary text-primary-foreground" : "border border-border bg-card")}>{c}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">营养素</p>
            <div className="flex flex-wrap gap-1.5">
              {allNutrients.map((n) => (
                <button key={n} onClick={() => setNutrients(toggle(nutrients, n))} className={cn("rounded-full px-3 py-1 text-xs font-medium", nutrients.includes(n) ? "bg-primary text-primary-foreground" : "border border-border bg-card")}>{n}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">含过敏原</p>
            <div className="flex flex-wrap gap-1.5">
              {allAllergens.map((a) => (
                <button key={a} onClick={() => setAllergens(toggle(allergens, a))} className={cn("rounded-full px-3 py-1 text-xs font-medium", allergens.includes(a) ? "bg-danger text-white" : "border border-border bg-card")}>{ALLERGEN_LABEL[a]}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-2xl border border-border py-2.5 text-sm font-semibold">取消</button>
          <button onClick={handleSave} disabled={!name.trim() || saving} className="flex-1 rounded-2xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {saving ? "保存中…" : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CollapsibleCategory({ cat, items, state }: {
  cat: FoodCategory;
  items: typeof FOODS[0][];
  state: ReturnType<typeof useAppState>["state"];
}) {
  const [open, setOpen] = useState(false);
  const safeCount = items.filter(f => (state.foodStatus[f.id] ?? "untested") === "safe").length;

  return (
    <section>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between mb-3 group"
      >
        <div className="flex items-center gap-2">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {cat}
          </h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            {items.length} 种 · {safeCount} 已排敏
          </span>
        </div>
        <span className={cn("text-muted-foreground transition-transform duration-200", open ? "rotate-180" : "")}>
          ▾
        </span>
      </button>
      {open && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {items.map((f) => {
            const status = (state.foodStatus[f.id] ?? "untested") as FoodStatus;
            return (
              <li key={f.id} className="rounded-2xl border border-border/70 bg-card p-3 shadow-soft">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-xl">{f.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold">{f.name}</p>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", STATUS_META[status].chip)}>
                        {STATUS_META[status].label}
                      </span>
                      {(f as any).isCustom && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-600">自定义</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {f.nutrients.slice(0, 4).join(" · ") || "—"}
                      {f.allergens.length > 0 && (
                        <span className="ml-1 text-danger">· 含{f.allergens.map((a: AllergenId) => ALLERGEN_LABEL[a]).join("/")}</span>
                      )}
                    </p>
                  </div>
                  {(f as any).isCustom && (
                    <button
                      onClick={() => deleteCustomFood((f as any).customId!)}
                      className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-4 gap-1">
                  <StatusBtn current={status} target="safe" onClick={() => setFoodStatus(f.id, "safe")}><Check className="h-3.5 w-3.5" />排敏</StatusBtn>
                  <StatusBtn current={status} target="trialing" onClick={() => setFoodStatus(f.id, "trialing")}><Beaker className="h-3.5 w-3.5" />测试</StatusBtn>
                  <StatusBtn current={status} target="untested" onClick={() => setFoodStatus(f.id, "untested")}><HelpCircle className="h-3.5 w-3.5" />未试</StatusBtn>
                  <StatusBtn current={status} target="allergic" onClick={() => setFoodStatus(f.id, "allergic")}><X className="h-3.5 w-3.5" />过敏</StatusBtn>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function StatCard({ label, value, variant }: { label: string; value: number; variant: "safe" | "warn" | "danger" | "untested" }) {
  const ring = variant === "safe" ? "bg-safe/10" : variant === "warn" ? "bg-warn/15" : variant === "untested" ? "bg-muted" : "bg-danger/10";
  const text = variant === "safe" ? "text-safe" : variant === "warn" ? "text-warn-foreground" : variant === "untested" ? "text-muted-foreground" : "text-danger";
  return (
    <div className={cn("rounded-2xl p-4", ring)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-display text-2xl font-extrabold", text)}>{value}</p>
    </div>
  );
}

function StatusBtn({ current, target, onClick, children }: { current: FoodStatus; target: FoodStatus; onClick: () => void; children: React.ReactNode }) {
  const active = current === target;
  return (
    <button onClick={onClick} className={cn("flex items-center justify-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors", active ? STATUS_META[target].chip : "bg-muted text-muted-foreground hover:bg-secondary")}>
      {children}
    </button>
  );
}
