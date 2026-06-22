import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, CalendarDays, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
import { FOODS, FOODS_BY_ID } from "@/lib/foods";
import { useAppState, type TrialEntry } from "@/lib/storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trials")({
  head: () => ({
    meta: [
      { title: "排敏记录 · 敏宝食谱" },
      { name: "description", content: "为新食物建立 3 天观察记录,出现湿疹等症状可即时记录。" },
      { property: "og:title", content: "排敏记录 · 敏宝食谱" },
      { property: "og:description", content: "科学的食物排敏跟踪 — 3 天观察期 + 症状打卡。" },
    ],
  }),
  component: TrialsPage,
});

function daysSince(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function TrialsPage() {
  const { state, update, ready } = useAppState();
  const [showAdd, setShowAdd] = useState(false);
  const [newFoodId, setNewFoodId] = useState("");
  const [newNote, setNewNote] = useState("");

  const active = useMemo(
    () => state.trials.filter((t) => !t.result).sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [state.trials],
  );
  const finished = useMemo(
    () => state.trials.filter((t) => t.result).sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [state.trials],
  );

  if (!ready) return <div className="text-muted-foreground">加载中…</div>;

  const addTrial = () => {
    if (!newFoodId) return;
    const entry: TrialEntry = {
      id: crypto.randomUUID(),
      foodId: newFoodId,
      startDate: new Date().toISOString().slice(0, 10),
      notes: newNote,
      symptoms: [],
    };
    update((s) => ({
      ...s,
      trials: [entry, ...s.trials],
      foodStatus: { ...s.foodStatus, [newFoodId]: "trialing" },
    }));
    setNewFoodId("");
    setNewNote("");
    setShowAdd(false);
  };

  const logSymptom = (id: string, severity: TrialEntry["symptoms"][number]["severity"]) => {
    update((s) => ({
      ...s,
      trials: s.trials.map((t) =>
        t.id === id
          ? { ...t, symptoms: [...t.symptoms, { date: new Date().toISOString().slice(0, 10), severity, note: "" }] }
          : t,
      ),
    }));
  };

  const conclude = (id: string, result: "safe" | "allergic") => {
    update((s) => {
      const t = s.trials.find((x) => x.id === id);
      if (!t) return s;
      return {
        ...s,
        trials: s.trials.map((x) => (x.id === id ? { ...x, result } : x)),
        foodStatus: { ...s.foodStatus, [t.foodId]: result },
      };
    });
  };

  const remove = (id: string) => {
    update((s) => ({ ...s, trials: s.trials.filter((t) => t.id !== id) }));
  };

  return (
    <div className="space-y-6">
      <section className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold">排敏记录</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            添加新食物 → 连续观察 3 天 → 无症状即可标为「已排敏」。
          </p>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground shadow-soft"
        >
          <Plus className="h-4 w-4" />
          新增
        </button>
      </section>

      {showAdd && (
        <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <h3 className="font-display text-base font-bold">新的排敏测试</h3>
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">选择食材</label>
              <select
                value={newFoodId}
                onChange={(e) => setNewFoodId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">— 选择 —</option>
                {FOODS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.emoji} {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">备注(可选)</label>
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="例:早上 8 点,1 小勺"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={addTrial}
                disabled={!newFoodId}
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                开始记录
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm"
              >
                取消
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Active */}
      <section>
        <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
          进行中 · {active.length}
        </h3>
        {active.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-6 text-center text-sm text-muted-foreground">
            还没有进行中的排敏。点右上角「新增」开始第一次测试。
          </div>
        ) : (
          <ul className="space-y-3">
            {active.map((t) => {
              const food = FOODS_BY_ID[t.foodId];
              const day = daysSince(t.startDate) + 1;
              const progress = Math.min(day, 3);
              return (
                <li key={t.id} className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft">
                  <div className="flex items-start gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-2xl">
                      {food?.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-display font-bold">{food?.name}</p>
                        <span className="rounded-full bg-warn px-2 py-0.5 text-[10px] font-semibold text-warn-foreground">
                          第 {day} 天
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        始于 {t.startDate}
                        {t.notes && <span className="ml-1">· {t.notes}</span>}
                      </p>
                    </div>
                    <button onClick={() => remove(t.id)} className="text-muted-foreground hover:text-danger">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Progress */}
                  <div className="mt-4 flex gap-1.5">
                    {[1, 2, 3].map((d) => (
                      <div
                        key={d}
                        className={cn(
                          "h-2 flex-1 rounded-full",
                          d <= progress ? "bg-safe" : "bg-muted",
                        )}
                      />
                    ))}
                  </div>

                  {/* Symptom log */}
                  <div className="mt-4">
                    <p className="text-xs font-medium text-muted-foreground">今天打卡:</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <SymBtn onClick={() => logSymptom(t.id, "none")} tone="safe">无反应 ✓</SymBtn>
                      <SymBtn onClick={() => logSymptom(t.id, "mild")} tone="warn">轻微</SymBtn>
                      <SymBtn onClick={() => logSymptom(t.id, "moderate")} tone="warn">湿疹/红疹</SymBtn>
                      <SymBtn onClick={() => logSymptom(t.id, "severe")} tone="danger">严重</SymBtn>
                    </div>
                  </div>

                  {t.symptoms.length > 0 && (
                    <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                      {t.symptoms.map((s, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="font-mono">{s.date}</span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px]",
                              s.severity === "none" && "bg-safe/15 text-safe",
                              s.severity === "mild" && "bg-warn/20 text-warn-foreground",
                              s.severity === "moderate" && "bg-warn/40 text-warn-foreground",
                              s.severity === "severe" && "bg-danger/15 text-danger",
                            )}
                          >
                            {{ none: "无", mild: "轻微", moderate: "中度", severe: "严重" }[s.severity]}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Conclude */}
                  {day >= 3 && (
                    <div className="mt-4 flex gap-2 border-t border-border/60 pt-3">
                      <button
                        onClick={() => conclude(t.id, "safe")}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-safe px-3 py-2 text-xs font-medium text-safe-foreground"
                      >
                        <CheckCircle2 className="h-4 w-4" /> 标记已排敏
                      </button>
                      <button
                        onClick={() => conclude(t.id, "allergic")}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-danger px-3 py-2 text-xs font-medium text-danger-foreground"
                      >
                        <AlertCircle className="h-4 w-4" /> 标记过敏
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* History */}
      {finished.length > 0 && (
        <section>
          <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
            历史 · {finished.length}
          </h3>
          <ul className="space-y-2">
            {finished.map((t) => {
              const food = FOODS_BY_ID[t.foodId];
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3"
                >
                  <span className="text-xl">{food?.emoji}</span>
                  <span className="font-medium">{food?.name}</span>
                  <span
                    className={cn(
                      "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      t.result === "safe"
                        ? "bg-safe text-safe-foreground"
                        : "bg-danger text-danger-foreground",
                    )}
                  >
                    {t.result === "safe" ? "已排敏" : "过敏"}
                  </span>
                  <button onClick={() => remove(t.id)} className="text-muted-foreground hover:text-danger">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Tips */}
      <section className="rounded-3xl bg-secondary/60 p-5 text-sm text-secondary-foreground">
        <h3 className="font-display font-bold">排敏小贴士</h3>
        <ul className="mt-2 space-y-1.5 list-disc pl-5">
          <li>每次只测一种新食物,从 1 小勺开始,连续吃 3 天。</li>
          <li>选在白天添加,方便观察反应;严重过敏家族史的食物建议在医院/诊所附近尝试。</li>
          <li>常见反应:湿疹加重、口周红、呕吐、腹泻、便血。出现严重反应立即就医。</li>
          <li>同类过敏原(如奶 → 所有乳制品)需分别测试加工形式。</li>
        </ul>
      </section>
    </div>
  );
}

function SymBtn({
  onClick,
  tone,
  children,
}: {
  onClick: () => void;
  tone: "safe" | "warn" | "danger";
  children: React.ReactNode;
}) {
  const cls =
    tone === "safe"
      ? "bg-safe/10 text-safe hover:bg-safe hover:text-safe-foreground"
      : tone === "warn"
      ? "bg-warn/20 text-warn-foreground hover:bg-warn"
      : "bg-danger/10 text-danger hover:bg-danger hover:text-danger-foreground";
  return (
    <button onClick={onClick} className={cn("rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors", cls)}>
      {children}
    </button>
  );
}
