import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import type { FoodCategory, AllergenId, NutrientTag } from "@/lib/foods";

export interface CustomFood {
  id: string;
  name: string;
  emoji: string;
  category: FoodCategory;
  allergens: AllergenId[];
  nutrients: NutrientTag[];
  notes?: string;
}

export function useCustomFoods() {
  const [customFoods, setCustomFoods] = useState<CustomFood[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomFoods();
  }, []);

  async function fetchCustomFoods() {
    const { data, error } = await supabase
      .from("custom_foods")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data) setCustomFoods(data as CustomFood[]);
    setLoading(false);
  }

  return { customFoods, loading, refetch: fetchCustomFoods };
}

export async function addCustomFood(food: Omit<CustomFood, "id">) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("custom_foods").insert({
    user_id: user.id,
    ...food,
  });
  window.location.reload();
}

export async function deleteCustomFood(id: string) {
  await supabase.from("custom_foods").delete().eq("id", id);
  window.location.reload();
}
