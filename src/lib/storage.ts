import { useEffect, useState } from "react";
import type { AllergenId } from "./foods";
import { DEFAULT_KNOWN_ALLERGENS } from "./foods";
import { supabase } from "@/integrations/supabase/client";

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
  knownAllergens: AllergenId[];
}

export interface AppState {
  profile: BabyProfile;
  foodStatus: Record<string, FoodStatus>;
  trials: TrialEntry[];
}

const LOCAL_KEY = "minbao-meal-state-v1";

const DEFAULT_STATE: AppState = {
  profile: {
    name: "敏宝",
    ageMonths: 24,
    knownAllergens: DEFAULT_KNOWN_ALLERGENS,
  },
  foodStatus: {
    rice: "safe", millet: "safe", pumpkin: "safe", sweet_potato: "safe",
    carrot: "safe", broccoli: "safe", apple: "safe", pear: "safe",
    banana: "safe", chicken: "safe", pork: "safe", olive_oil: "safe",
  },
  trials: [],
};

// In-memory store, shared across all hook consumers
let memState: AppState = DEFAULT_STATE;
let loaded = false;
let currentUserId: string | null = null;
const EVT = "minbao-state-change";

function emit() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVT));
  }
}

function readLocal(): AppState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

function writeLocal(s: AppState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(s));
}

async function loadFromCloud(userId: string): Promise<AppState> {
  const [pRes, fRes, tRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("food_status").select("*").eq("user_id", userId),
    supabase.from("trials").select("*").eq("user_id", userId).order("start_date", { ascending: false }),
  ]);

  const profile: BabyProfile = pRes.data
    ? {
        name: pRes.data.baby_name,
        ageMonths: pRes.data.baby_age_months,
        knownAllergens: (pRes.data.known_allergens ?? DEFAULT_KNOWN_ALLERGENS) as AllergenId[],
      }
    : DEFAULT_STATE.profile;

  const foodStatus: Record<string, FoodStatus> = {};
  (fRes.data ?? []).forEach((r: { food_id: string; status: FoodStatus }) => {
    foodStatus[r.food_id] = r.status;
  });

  const trials: TrialEntry[] = (tRes.data ?? []).map((r) => ({
    id: r.id,
    foodId: r.food_id,
    startDate: r.start_date,
    notes: r.notes ?? "",
    symptoms: (r.symptoms ?? []) as TrialEntry["symptoms"],
    result: (r.result ?? undefined) as TrialEntry["result"],
  }));

  return { profile, foodStatus, trials };
}

async function migrateLocalToCloud(userId: string, local: AppState) {
  // 上传 profile
  await supabase.from("profiles").upsert({
    user_id: userId,
    baby_name: local.profile.name,
    baby_age_months: local.profile.ageMonths,
    known_allergens: local.profile.knownAllergens,
  });
  // 上传 food_status
  const fsRows = Object.entries(local.foodStatus).map(([food_id, status]) => ({
    user_id: userId, food_id, status,
  }));
  if (fsRows.length) await supabase.from("food_status").upsert(fsRows);
  // 上传 trials
  if (local.trials.length) {
    const tRows = local.trials.map((t) => ({
      id: t.id,
      user_id: userId,
      food_id: t.foodId,
      start_date: t.startDate,
      notes: t.notes,
      symptoms: t.symptoms,
      result: t.result ?? null,
    }));
    await supabase.from("trials").upsert(tRows);
  }
}

async function syncDiff(prev: AppState, next: AppState, userId: string) {
  // profile
  if (
    prev.profile.name !== next.profile.name ||
    prev.profile.ageMonths !== next.profile.ageMonths ||
    JSON.stringify(prev.profile.knownAllergens) !== JSON.stringify(next.profile.knownAllergens)
  ) {
    await supabase.from("profiles").upsert({
      user_id: userId,
      baby_name: next.profile.name,
      baby_age_months: next.profile.ageMonths,
      known_allergens: next.profile.knownAllergens,
    });
  }
  // food_status diff
  const fsChanges: { food_id: string; status: FoodStatus }[] = [];
  const allKeys = new Set([...Object.keys(prev.foodStatus), ...Object.keys(next.foodStatus)]);
  for (const k of allKeys) {
    if (prev.foodStatus[k] !== next.foodStatus[k] && next.foodStatus[k]) {
      fsChanges.push({ food_id: k, status: next.foodStatus[k]! });
    }
  }
  if (fsChanges.length) {
    await supabase.from("food_status").upsert(
      fsChanges.map((c) => ({ user_id: userId, ...c })),
    );
  }
  // trials diff
  const prevById = new Map(prev.trials.map((t) => [t.id, t]));
  const nextById = new Map(next.trials.map((t) => [t.id, t]));
  const toUpsert: TrialEntry[] = [];
  for (const [id, t] of nextById) {
    const old = prevById.get(id);
    if (!old || JSON.stringify(old) !== JSON.stringify(t)) toUpsert.push(t);
  }
  const toDelete: string[] = [];
  for (const id of prevById.keys()) {
    if (!nextById.has(id)) toDelete.push(id);
  }
  if (toUpsert.length) {
    await supabase.from("trials").upsert(
      toUpsert.map((t) => ({
        id: t.id,
        user_id: userId,
        food_id: t.foodId,
        start_date: t.startDate,
        notes: t.notes,
        symptoms: t.symptoms,
        result: t.result ?? null,
      })),
    );
  }
  if (toDelete.length) {
    await supabase.from("trials").delete().in("id", toDelete).eq("user_id", userId);
  }
}

async function ensureLoaded(userId: string) {
  if (loaded && currentUserId === userId) return;
  currentUserId = userId;
  const cloud = await loadFromCloud(userId);
  const local = readLocal();
  const cloudEmpty =
    Object.keys(cloud.foodStatus).length === 0 && cloud.trials.length === 0;
  const localHasData =
    Object.keys(local.foodStatus).length > 0 || local.trials.length > 0;

  if (cloudEmpty && localHasData) {
    await migrateLocalToCloud(userId, local);
    memState = local;
  } else {
    memState = cloud;
  }
  loaded = true;
  writeLocal(memState);
  emit();
}

function resetToLocal() {
  loaded = false;
  currentUserId = null;
  memState = readLocal();
  emit();
}

// 监听 auth 状态(模块级,只挂一次)
if (typeof window !== "undefined") {
  supabase.auth.getSession().then(({ data }) => {
    if (data.session?.user) {
      ensureLoaded(data.session.user.id).catch(console.error);
    } else {
      memState = readLocal();
      emit();
    }
  });
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session?.user) {
      ensureLoaded(session.user.id).catch(console.error);
    } else if (event === "SIGNED_OUT") {
      resetToLocal();
    }
  });
}

export function useAppState() {
  const [state, setState] = useState<AppState>(memState);
  const [ready, setReady] = useState(loaded || currentUserId === null);

  useEffect(() => {
    setState(memState);
    setReady(loaded || currentUserId === null);
    const onChange = () => {
      setState(memState);
      setReady(loaded || currentUserId === null);
    };
    window.addEventListener(EVT, onChange);
    return () => window.removeEventListener(EVT, onChange);
  }, []);

  const update = (updater: (s: AppState) => AppState) => {
    const prev = memState;
    const next = updater(prev);
    memState = next;
    writeLocal(next);
    emit();
    if (currentUserId) {
      syncDiff(prev, next, currentUserId).catch((err) => {
        console.error("云端同步失败:", err);
      });
    }
  };

  return { state, update, ready };
}

export function setFoodStatus(foodId: string, status: FoodStatus) {
  const prev = memState;
  const next = { ...prev, foodStatus: { ...prev.foodStatus, [foodId]: status } };
  memState = next;
  writeLocal(next);
  emit();
  if (currentUserId) {
    syncDiff(prev, next, currentUserId).catch(console.error);
  }
}
