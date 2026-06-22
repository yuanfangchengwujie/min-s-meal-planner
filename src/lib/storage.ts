import { useEffect, useState } from "react";
import type { AllergenId } from "./foods";
import { DEFAULT_KNOWN_ALLERGENS } from "./foods";

export type FoodStatus = "safe" | "untested" | "trialing" | "allergic";

export interface TrialEntry {
  id: string;
  foodId: string;
  startDate: string; // ISO date
  notes: string;
  symptoms: { date: string; severity: "none" | "mild" | "moderate" | "severe"; note: string }[];
  result?: "safe" | "allergic";
}

export interface BabyProfile {
  name: string;
  ageMonths: number;
  knownAllergens: AllergenId[]; // 已确诊
}

export interface AppState {
  profile: BabyProfile;
  foodStatus: Record<string, FoodStatus>; // foodId -> status
  trials: TrialEntry[];
}

const KEY = "minbao-meal-state-v1";

const DEFAULT_STATE: AppState = {
  profile: {
    name: "敏宝",
    ageMonths: 24,
    knownAllergens: DEFAULT_KNOWN_ALLERGENS,
  },
  foodStatus: {
    // 预设一些常见已排敏的安全食材,用户可改
    rice: "safe",
    millet: "safe",
    pumpkin: "safe",
    sweet_potato: "safe",
    carrot: "safe",
    broccoli: "safe",
    apple: "safe",
    pear: "safe",
    banana: "safe",
    chicken: "safe",
    pork: "safe",
    olive_oil: "safe",
  },
  trials: [],
};

function read(): AppState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

function write(state: AppState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("minbao-state-change"));
}

export function useAppState() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(read());
    setReady(true);
    const onChange = () => setState(read());
    window.addEventListener("minbao-state-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("minbao-state-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const update = (updater: (s: AppState) => AppState) => {
    const next = updater(read());
    write(next);
    setState(next);
  };

  return { state, update, ready };
}

export function setFoodStatus(foodId: string, status: FoodStatus) {
  const s = read();
  s.foodStatus = { ...s.foodStatus, [foodId]: status };
  write(s);
}
