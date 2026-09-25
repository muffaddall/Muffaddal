import "server-only";
import { supabase } from "@/lib/supabase";
import type { FoodItem, MealType } from "@/lib/types";

type FoodItemRow = {
  id: string;
  name: string;
  ingredients: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal_type: MealType;
  created_at: string;
};

function fromRow(row: FoodItemRow): FoodItem {
  return {
    id: row.id,
    name: row.name,
    ingredients: row.ingredients,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
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

export async function addFoodItem(input: {
  name: string;
  ingredients: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: MealType;
}): Promise<void> {
  const { error } = await supabase.from("food_items").insert({
    name: input.name,
    ingredients: input.ingredients,
    calories: input.calories,
    protein: input.protein,
    carbs: input.carbs,
    fat: input.fat,
    meal_type: input.mealType,
  });
  if (error) throw new Error(error.message);
}

export async function deleteFoodItem(id: string): Promise<void> {
  const { error } = await supabase.from("food_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
