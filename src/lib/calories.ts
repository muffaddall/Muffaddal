import "server-only";
import { supabase } from "@/lib/supabase";
import type { CalorieLog } from "@/lib/types";

type CalorieLogRow = {
  date: string;
  breakfast: number;
  lunch: number;
  dinner: number;
  snacks: number;
  burned: number;
};

function fromRow(row: CalorieLogRow): CalorieLog {
  return {
    date: row.date,
    breakfast: row.breakfast,
    lunch: row.lunch,
    dinner: row.dinner,
    snacks: row.snacks,
    burned: row.burned,
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

export async function upsertCalorieLog(input: CalorieLog): Promise<void> {
  const { error } = await supabase
    .from("calorie_logs")
    .upsert(input, { onConflict: "date" });
  if (error) throw new Error(error.message);
}
