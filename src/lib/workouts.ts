import "server-only";
import { supabase } from "@/lib/supabase";
import type { WeeklyTarget, WorkoutDiscipline, WorkoutLog } from "@/lib/types";

type WorkoutLogRow = {
  id: string;
  discipline: WorkoutDiscipline;
  date: string;
  time: string | null;
  distance: number;
  duration_min: number;
  created_at: string;
};

function fromRow(row: WorkoutLogRow): WorkoutLog {
  return {
    id: row.id,
    discipline: row.discipline,
    date: row.date,
    time: row.time ? row.time.slice(0, 5) : null,
    distance: row.distance,
    durationMin: row.duration_min,
    createdAt: row.created_at,
  };
}

export async function getWorkoutLogs(
  discipline: WorkoutDiscipline
): Promise<WorkoutLog[]> {
  const { data, error } = await supabase
    .from("workout_logs")
    .select("*")
    .eq("discipline", discipline)
    .order("date", { ascending: false })
    .order("time", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function addWorkoutLog(input: {
  discipline: WorkoutDiscipline;
  date: string;
  time: string | null;
  distance: number;
  durationMin: number;
}): Promise<void> {
  const { error } = await supabase.from("workout_logs").insert({
    discipline: input.discipline,
    date: input.date,
    time: input.time,
    distance: input.distance,
    duration_min: input.durationMin,
  });
  if (error) throw new Error(error.message);
}

export async function deleteWorkoutLog(id: string): Promise<void> {
  const { error } = await supabase.from("workout_logs").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Every workout log across all three disciplines — used by the Workout Tracker home dashboard. */
export async function getAllWorkoutLogs(): Promise<WorkoutLog[]> {
  const { data, error } = await supabase
    .from("workout_logs")
    .select("*")
    .order("date", { ascending: false })
    .order("time", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

type WeeklyTargetRow = {
  week_start: string;
  running_km: number;
  cycling_km: number;
  swimming_km: number;
};

function targetFromRow(row: WeeklyTargetRow): WeeklyTarget {
  return {
    weekStart: row.week_start,
    running: row.running_km,
    cycling: row.cycling_km,
    swimming: row.swimming_km,
  };
}

export async function getWeeklyTarget(weekStart: string): Promise<WeeklyTarget | null> {
  const { data, error } = await supabase
    .from("workout_weekly_targets")
    .select("*")
    .eq("week_start", weekStart)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? targetFromRow(data) : null;
}

export async function setWeeklyTarget(input: {
  weekStart: string;
  running: number;
  cycling: number;
  swimming: number;
}): Promise<void> {
  const { error } = await supabase.from("workout_weekly_targets").upsert(
    {
      week_start: input.weekStart,
      running_km: input.running,
      cycling_km: input.cycling,
      swimming_km: input.swimming,
    },
    { onConflict: "week_start" }
  );
  if (error) throw new Error(error.message);
}
