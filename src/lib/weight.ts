import "server-only";
import { supabase } from "@/lib/supabase";
import type { WeightLog } from "@/lib/types";

type WeightLogRow = {
  id: string;
  date: string;
  time: string | null;
  weight: number;
  created_at: string;
};

function fromRow(row: WeightLogRow): WeightLog {
  return {
    id: row.id,
    date: row.date,
    time: row.time ? row.time.slice(0, 5) : null,
    weight: row.weight,
    createdAt: row.created_at,
  };
}

export async function getWeightLogs(): Promise<WeightLog[]> {
  const { data, error } = await supabase
    .from("weight_logs")
    .select("*")
    .order("date", { ascending: true })
    .order("time", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function addWeightLog(input: {
  date: string;
  time: string | null;
  weight: number;
}): Promise<void> {
  const { error } = await supabase.from("weight_logs").insert(input);
  if (error) throw new Error(error.message);
}

export async function deleteWeightLog(id: string): Promise<void> {
  const { error } = await supabase.from("weight_logs").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
