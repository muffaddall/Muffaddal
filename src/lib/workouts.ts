import "server-only";
import { supabase } from "@/lib/supabase";
import type { WorkoutDiscipline, WorkoutLog } from "@/lib/types";

type WorkoutLogRow = {
  id: string;
  discipline: WorkoutDiscipline;
  date: string;
  time: string | null;
  distance_km: number;
  duration_min: number;
  created_at: string;
};

function fromRow(row: WorkoutLogRow): WorkoutLog {
  return {
    id: row.id,
    discipline: row.discipline,
    date: row.date,
    time: row.time ? row.time.slice(0, 5) : null,
    distanceKm: row.distance_km,
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
  distanceKm: number;
  durationMin: number;
}): Promise<void> {
  const { error } = await supabase.from("workout_logs").insert({
    discipline: input.discipline,
    date: input.date,
    time: input.time,
    distance_km: input.distanceKm,
    duration_min: input.durationMin,
  });
  if (error) throw new Error(error.message);
}

export async function deleteWorkoutLog(id: string): Promise<void> {
  const { error } = await supabase.from("workout_logs").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
