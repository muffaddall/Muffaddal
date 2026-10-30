import "server-only";
import { supabase } from "@/lib/supabase";
import type { Habit } from "@/lib/types";

type HabitRow = { id: string; name: string; sort_order: number; created_at: string };

function fromRow(row: HabitRow): Habit {
  return { id: row.id, name: row.name, sortOrder: row.sort_order, createdAt: row.created_at.slice(0, 10) };
}

export async function getHabits(): Promise<Habit[]> {
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => fromRow(r as HabitRow));
}

/** Every day each habit was done, keyed by habit id. */
export async function getHabitDoneDates(): Promise<Map<string, Set<string>>> {
  const { data, error } = await supabase.from("habit_checks").select("habit_id, date");
  if (error) throw new Error(error.message);
  const byHabit = new Map<string, Set<string>>();
  for (const row of data ?? []) {
    const set = byHabit.get(row.habit_id) ?? new Set<string>();
    set.add(row.date);
    byHabit.set(row.habit_id, set);
  }
  return byHabit;
}

export async function addHabit(name: string): Promise<void> {
  const { data } = await supabase
    .from("habits")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from("habits").insert({ name, sort_order: (data?.sort_order ?? -1) + 1 });
  if (error) throw new Error(error.message);
}

export async function renameHabit(id: string, name: string): Promise<void> {
  const { error } = await supabase.from("habits").update({ name }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteHabit(id: string): Promise<void> {
  const { error } = await supabase.from("habits").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setHabitDone(habitId: string, date: string, done: boolean): Promise<void> {
  const { error } = done
    ? await supabase.from("habit_checks").upsert({ habit_id: habitId, date }, { onConflict: "habit_id,date" })
    : await supabase.from("habit_checks").delete().eq("habit_id", habitId).eq("date", date);
  if (error) throw new Error(error.message);
}
