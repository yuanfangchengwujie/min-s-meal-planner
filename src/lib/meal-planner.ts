import { FOODS_BY_ID, type AllergenId, type NutrientTag } from "./foods";
import { RECIPES, type MealType, type Recipe } from "./recipes";
import type { AppState } from "./storage";

// 判断一个食谱是否对当前敏宝安全
export function isRecipeSafe(recipe: Recipe, state: AppState): { safe: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const known = new Set<AllergenId>(state.profile.knownAllergens);

  for (const ing of recipe.ingredients) {
    const food = FOODS_BY_ID[ing.foodId];
    if (!food) continue;
    // 命中已知过敏原
    for (const a of food.allergens) {
      if (known.has(a)) {
        reasons.push(`${food.name} 含${a}`);
      }
    }
    // 状态为过敏
    if (state.foodStatus[ing.foodId] === "allergic") {
      reasons.push(`${food.name} 已过敏`);
    }
  }
  return { safe: reasons.length === 0, reasons };
}

// 食谱中含有多少"已排敏"的食材比例
export function safetyScore(recipe: Recipe, state: AppState): number {
  let safe = 0;
  for (const ing of recipe.ingredients) {
    if (state.foodStatus[ing.foodId] === "safe") safe++;
  }
  return safe / recipe.ingredients.length;
}

export interface MealSlot {
  meal: MealType;
  recipe?: Recipe;
  fallback?: string;
}

// 简易日期 seed,让每天的推荐不同但稳定
function seededPick<T>(arr: T[], seed: number): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[seed % arr.length];
}

export function planDay(state: AppState, dateSeed: number): MealSlot[] {
  const meals: MealType[] = ["早餐", "午餐", "加餐", "晚餐"];
  const used = new Set<string>();
  const result: MealSlot[] = [];

  meals.forEach((meal, idx) => {
    // 候选: 安全 + 适用此餐
    const candidates = RECIPES
      .filter((r) => r.meal.includes(meal))
      .filter((r) => isRecipeSafe(r, state).safe)
      .filter((r) => !used.has(r.id))
      .sort((a, b) => safetyScore(b, state) - safetyScore(a, state));

    const top = candidates.slice(0, Math.max(3, Math.ceil(candidates.length / 2)));
    const pick = seededPick(top, dateSeed + idx * 7);
    if (pick) used.add(pick.id);
    result.push({
      meal,
      recipe: pick,
      fallback: pick ? undefined : "暂无完全匹配的食谱,试着在「食材库」标记更多已排敏食材",
    });
  });

  return result;
}

export function todaySeed(date: Date = new Date()): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

// 全日营养覆盖
export const KEY_NUTRIENTS: NutrientTag[] = [
  "蛋白质",
  "铁",
  "锌",
  "钙",
  "DHA",
  "维A",
  "维C",
  "维D",
  "膳食纤维",
  "健康脂肪",
];

export function nutrientCoverage(slots: MealSlot[]): Record<NutrientTag, number> {
  const cov = {} as Record<NutrientTag, number>;
  for (const n of KEY_NUTRIENTS) cov[n] = 0;
  for (const slot of slots) {
    if (!slot.recipe) continue;
    for (const n of slot.recipe.nutrients) {
      if (n in cov) cov[n] = (cov[n] ?? 0) + 1;
    }
  }
  return cov;
}
