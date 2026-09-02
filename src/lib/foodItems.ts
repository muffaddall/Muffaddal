import "server-only";
import { supabase } from "@/lib/supabase";
import type { FoodItem, MealType } from "@/lib/types";

type FoodItemRow = {
  id: string;
  name: string;
  ingredients: string;
  calories: number;
  meal_type: MealType;
  created_at: string;
};

function fromRow(row: FoodItemRow): FoodItem {
  return {
    id: row.id,
    name: row.name,
    ingredients: row.ingredients,
    calories: row.calories,
    mealType: row.meal_type,
    created_at: row.created_at,
  };
}

export async function getFoodItems(): Promise<FoodItem[]> {
  const { data, error } = await supabase
    .from("food_items")
    .select("*")
    .order("meal_type", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

// A meal type's quick-add options: its own items plus every snack, since
// a snack is fair game at breakfast, lunch, or dinner too. The Snack
// dropdown itself only offers snack-tagged items.
export function foodItemsForMealType(items: FoodItem[], mealType: MealType): FoodItem[] {
  if (mealType === "snack") return items.filter((i) => i.mealType === "snack");
  return items.filter((i) => i.mealType === mealType || i.mealType === "snack");
}

export async function addFoodItem(input: {
  name: string;
  ingredients: string;
  calories: number;
  mealType: MealType;
}): Promise<void> {
  const { error } = await supabase.from("food_items").insert({
    name: input.name,
    ingredients: input.ingredients,
    calories: input.calories,
    meal_type: input.mealType,
  });
  if (error) throw new Error(error.message);
}

export async function deleteFoodItem(id: string): Promise<void> {
  const { error } = await supabase.from("food_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
