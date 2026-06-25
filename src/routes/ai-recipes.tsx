import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Wand2, Check, Save, RefreshCw } from "lucide-react";
import { FOODS } from "@/lib/foods";
import { useAppState } from "@/lib/storage";
import { useCustomFoods } from "@/lib/custom-foods";
import { addCustomRecipe } from "@/lib/custom-recipes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ai-recipes")({
  head: () => ({
    meta: [{ title: "AI食谱 · 敏宝食谱" }],
  }),
  component: AiRecipesPage,
});

const MEAL_TYPES = ["早餐", "午餐", "晚餐", "加餐"];

interface GeneratedRecipe {
  name: string;
  emoji: string;
  meal: string[];
  prep_min: number;
  ingredients: { foodId: string; amount: string }[];
  steps: string[];
  tip?: string;
}

function AiRecipesPage() {
  const { state, ready } = useAppState();
  const { customFoods } = useCustomFoods();
  const [selectedFoods, setSelectedFoods] = useState<string[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<string>("午餐");
  const [loading, setLoading] = useState(false);
const [results, setResults] = useState<GeneratedRecipe[]>([]);
const [savedIndexes, setSavedIndexes] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");

  const safeFoods = useMemo(() => {
    const presetSafe = FOODS.filter(f => state.foodStatus[f.id] === "safe");
    const customSafe = customFoods
      .filter(f => state.foodStatus[`custom_${f.id}`] === "safe")
      .map(f => ({ ...f, id: `custom_${f.id}` }));
    return [...presetSafe, ...customSafe];
  }, [state, customFoods]);

  const toggleFood = (id: string) =>
    setSelectedFoods(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const generate = async () => {
    if (selectedFoods.length === 0) return;
    setLoading(true);
setResults([]);
setSavedIndexes([]);
    setError("");
    setDebugInfo("");

    const foodNames = selectedFoods.map(id => {
      const f = safeFoods.find(f => f.id === id);
      return f?.name ?? id;
    });

    const prompt = `你是一个专业的婴幼儿营养师。请根据以下条件生成一个适合过敏宝宝的${selectedMeal}食谱：

可用食材：${foodNames.join("、")}
餐型：${selectedMeal}
要求：
- 不含鸡蛋、小麦/麸质、牛奶
- 宝宝2岁，牙齿已发育，可以咀嚼软烂的食物
- 食物可以切成小块、小丁、细丝，保留一定的形状和口感
- 适合2岁幼儿的份量和软硬程度
- 严格无麸质（不含小麦、大麦、黑麦）、无蛋、无奶
${selectedMeal === "早餐" || selectedMeal === "加餐" ? `- 早餐/加餐可以考虑：用小米粉、大米粉做的无麸面食（如米糕、小米饼、米线）、水果泥、蔬菜泥甜点、米粥等` : `- 午餐/晚餐以软烂的主食+蛋白质+蔬菜为主，食物保留形状不打泥`}
- 只使用以上列出的食材
- 步骤简单，适合家庭制作

请严格返回包含3个不同食谱的JSON数组，不要有任何其他文字。每个食谱使用不同的食材组合，不需要用完所有食材：
[
  {
    "name": "食谱名称",
    "emoji": "一个相关emoji",
    "meal": ["${selectedMeal}"],
    "prep_min": 准备时间数字,
    "ingredients": [
      {"foodId": "食材名称", "amount": "用量"}
    ],
    "steps": ["步骤1", "步骤2", "步骤3"],
    "tip": "小贴士（可选）"
  }
]`;

    try {
const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
setDebugInfo(`API Key: ${apiKey ? "已找到" : "未找到"}`);

const models = [
  "openrouter/owl-alpha",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "openai/gpt-oss-20b:free",
  "google/gemma-4-31b-it:free",
  "z-ai/glm-4.5-air:free",
  "moonshotai/kimi-k2.6:free",
];

let data: any = null;
let lastError = "";

for (const model of models) {
  setDebugInfo(`正在尝试模型：${model}`);
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });
  data = await res.json();
  if (!data.error) break;
  lastError = data.error.message;
  setDebugInfo(`模型 ${model} 失败，尝试下一个…`);
}

if (!data || data.error) {
  throw new Error(`所有模型均失败：${lastError}`);
}

const dataStr = JSON.stringify(data);
setDebugInfo(`成功！响应: ${dataStr.slice(0, 100)}`);

const text = data.choices?.[0]?.message?.content ?? "";

if (data.error) {
  if (data.error.code === 429) {
    throw new Error("请求太频繁，请等1分钟后再试。");
  }
  throw new Error(`API错误：${data.error.message}`);
}
if (!text) {
  throw new Error(`Gemini返回空内容，完整响应：${dataStr.slice(0, 300)}`);
}

const match = text.match(/\[[\s\S]*\]/);
if (!match) throw new Error(`无法提取JSON，原始内容：${text.slice(0, 200)}`);
const recipes = JSON.parse(match[0]) as GeneratedRecipe[];
setResults(recipes);
    } catch (e) {
      setError(`生成失败：${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  };

const save = async (recipe: GeneratedRecipe, index: number) => {
  await addCustomRecipe(recipe);
  setSavedIndexes(prev => [...prev, index]);
};

  if (!ready) return <div className="text-muted-foreground">加载中…</div>;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-display text-2xl font-extrabold">AI 食谱生成</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          选择今天手边有的已排敏食材，AI 帮你生成专属食谱。
        </p>
      </section>

      <section>
        <p className="mb-2 text-sm font-semibold">选择餐型</p>
        <div className="flex gap-2">
          {MEAL_TYPES.map(m => (
            <button key={m} onClick={() => setSelectedMeal(m)}
              className={cn("rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                selectedMeal === m ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-secondary")}>
              {m}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 text-sm font-semibold">
          选择今天有的食材
          <span className="ml-2 text-xs text-muted-foreground font-normal">
            （仅显示已排敏食材，已选 {selectedFoods.length} 种）
          </span>
        </p>
        {safeFoods.length === 0 ? (
          <p className="text-sm text-muted-foreground">还没有已排敏的食材，请先在食材库标记。</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {safeFoods.map(f => {
              const selected = selectedFoods.includes(f.id);
              return (
                <button key={f.id} onClick={() => toggleFood(f.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-sm font-medium transition-colors border",
                    selected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:bg-secondary"
                  )}>
                  {selected && <Check className="h-3.5 w-3.5" />}
                  <span>{f.emoji}</span>
                  <span>{f.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <button
        onClick={generate}
        disabled={selectedFoods.length === 0 || loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-sm disabled:opacity-50"
      >
        {loading ? (
          <><RefreshCw className="h-4 w-4 animate-spin" /> 生成中…</>
        ) : (
          <><Wand2 className="h-4 w-4" /> 生成食谱</>
        )}
      </button>

      {/* 调试信息 */}
      {debugInfo && (
        <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground break-all">
          {debugInfo}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-danger/10 p-3 text-sm text-danger break-all">
          {error}
        </div>
      )}

  {results.length > 0 && (
  <div className="space-y-4">
    {results.map((recipe, index) => (
      <section key={index} className="rounded-3xl border border-border/70 bg-card p-5 shadow-soft space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">方案 {index + 1}</span>
              {recipe.meal.map(m => (
                <span key={m} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold">{m}</span>
              ))}
            </div>
            <h3 className="font-display text-xl font-bold">{recipe.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">⏱ {recipe.prep_min} 分钟</p>
          </div>
          <span className="text-4xl">{recipe.emoji}</span>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">食材</p>
          <div className="flex flex-wrap gap-1.5">
            {recipe.ingredients.map((ing, i) => (
              <span key={i} className="rounded-lg bg-muted px-2 py-1 text-xs">
                {ing.foodId} {ing.amount}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">做法</p>
          <ol className="list-decimal pl-4 space-y-1.5 text-sm text-muted-foreground">
            {recipe.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </div>

        {recipe.tip && (
          <p className="rounded-xl bg-secondary/60 p-2.5 text-xs">💡 {recipe.tip}</p>
        )}

        <button
          onClick={() => save(recipe, index)}
          disabled={savedIndexes.includes(index)}
          className="w-full flex items-center justify-center gap-1.5 rounded-2xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {savedIndexes.includes(index) ? "已保存！" : "保存到食谱库"}
        </button>
      </section>
    ))}

    <button onClick={generate}
      className="w-full flex items-center justify-center gap-1.5 rounded-2xl border border-border py-2.5 text-sm font-semibold hover:bg-secondary">
      <RefreshCw className="h-4 w-4" /> 重新生成
    </button>
  </div>
)}
