import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export interface CustomRecipe {
  id: string;
  name: string;
  emoji: string;
  meal: string[];
  prep_min: number;
  ingredients: { foodId: string; amount: string }[];
  steps: string[];
  tip?: string;
}

export function useCustomRecipes() {
  const [customRecipes, setCustomRecipes] = useState<CustomRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomRecipes();
  }, []);

  async function fetchCustomRecipes() {
    const { data, error } = await supabase
      .from("custom_recipes")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data) setCustomRecipes(data as CustomRecipe[]);
    setLoading(false);
  }

  return { customRecipes, loading, refetch: fetchCustomRecipes };
}

export async function addCustomRecipe(recipe: Omit<CustomRecipe, "id">) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("custom_recipes").insert({
    user_id: user.id,
    ...recipe,
  });
  window.location.reload();
}

export async function deleteCustomRecipe(id: string) {
  await supabase.from("custom_recipes").delete().eq("id", id);
  window.location.reload();
}
