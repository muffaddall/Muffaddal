import "server-only";
import { supabase } from "@/lib/supabase";
import type { CalorieEntry, CalorieLog, MealType } from "@/lib/types";

type CalorieLogRow = {
  date: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  snacks: number;
  burned: number;
  water: number;
};

function fromRow(row: CalorieLogRow): CalorieLog {
  return {
    date: row.date,
    breakfast: row.breakfast,
    lunch: row.lunch,
    dinner: row.dinner,
    snacks: row.snacks,
    burned: row.burned,
    water: row.water,
  };
}

export async function getCalorieLog(date: string): Promise<CalorieLog | null> {
  const { data, error } = await supabase
    .from("calorie_logs")
    .select("*")
    .eq("date", date)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data) : null;
}

export async function getCalorieLogsForRange(
  start: string,
  end: string
): Promise<CalorieLog[]> {
  const { data, error } = await supabase
    .from("calorie_logs")
    .select("*")
    .gte("date", start)
    .lte("date", end);
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function getAllCalorieLogs(): Promise<CalorieLog[]> {
  const { data, error } = await supabase.from("calorie_logs").select("*");
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

/** Partial upsert — only touches water/burned, never clobbers the meal totals kept in sync by calorie_entries. */
export async function updateWaterAndBurned(date: string, water: number, burned: number): Promise<void> {
  const { error } = await supabase
    .from("calorie_logs")
    .upsert({ date, water, burned }, { onConflict: "date" });
  if (error) throw new Error(error.message);
}

type CalorieEntryRow = {
  id: string;
  date: string;
  meal_type: MealType;
  name: string;
  calories: number;
  sort_order: number;
  eaten: boolean;
};

function entryFromRow(row: CalorieEntryRow): CalorieEntry {
  return {
    id: row.id,
    date: row.date,
    mealType: row.meal_type,
    name: row.name,
    calories: row.calories,
    sortOrder: row.sort_order,
    eaten: row.eaten,
  };
}

export async function getCalorieEntriesForDate(date: string): Promise<CalorieEntry[]> {
  const { data, error } = await supabase
    .from("calorie_entries")
    .select("*")
    .eq("date", date)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(entryFromRow);
}

const MEAL_COLUMN: Record<MealType, "breakfast" | "lunch" | "dinner" | "snacks"> = {
  breakfast: "breakfast",
  lunch: "lunch",
  dinner: "dinner",
  snack: "snacks",
};

/** Re-sums this date+meal's eaten entries and writes the result into calorie_logs — the cached total shown everywhere else. Unticked (planned) entries don't count yet. */
async function recomputeMealTotal(date: string, mealType: MealType): Promise<void> {
  const { data, error } = await supabase
    .from("calorie_entries")
    .select("calories")
    .eq("date", date)
    .eq("meal_type", mealType)
    .eq("eaten", true);
  if (error) throw new Error(error.message);
  const total = (data ?? []).reduce((sum, r) => sum + Number(r.calories), 0);

  const { error: upsertError } = await supabase
    .from("calorie_logs")
    .upsert({ date, [MEAL_COLUMN[mealType]]: total }, { onConflict: "date" });
  if (upsertError) throw new Error(upsertError.message);
}

export async function addCalorieEntry(input: {
  date: string;
  mealType: MealType;
  name: string;
  calories: number;
}): Promise<void> {
  const { count, error: countError } = await supabase
    .from("calorie_entries")
    .select("id", { count: "exact", head: true })
    .eq("date", input.date)
    .eq("meal_type", input.mealType);
  if (countError) throw new Error(countError.message);

  const { error } = await supabase.from("calorie_entries").insert({
    date: input.date,
    meal_type: input.mealType,
    name: input.name,
    calories: input.calories,
    sort_order: count ?? 0,
    eaten: false,
  });
  if (error) throw new Error(error.message);

  await recomputeMealTotal(input.date, input.mealType);
}

export async function deleteCalorieEntry(id: string, date: string, mealType: MealType): Promise<void> {
  const { error } = await supabase.from("calorie_entries").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await recomputeMealTotal(date, mealType);
}

export async function setCalorieEntryEaten(
  id: string,
  date: string,
  mealType: MealType,
  eaten: boolean
): Promise<void> {
  const { error } = await supabase.from("calorie_entries").update({ eaten }).eq("id", id);
  if (error) throw new Error(error.message);

  await recomputeMealTotal(date, mealType);
}
