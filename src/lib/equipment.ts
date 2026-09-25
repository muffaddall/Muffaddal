import "server-only";
import { supabase } from "@/lib/supabase";
import type { Equipment, EquipmentType } from "@/lib/types";

type EquipmentRow = {
  id: string;
  type: EquipmentType;
  name: string;
  created_at: string;
};

function fromRow(row: EquipmentRow): Equipment {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    createdAt: row.created_at,
  };
}

export async function getEquipment(): Promise<Equipment[]> {
  const { data, error } = await supabase
    .from("equipment")
    .select("*")
    .order("type", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export function equipmentForType(items: Equipment[], type: EquipmentType): Equipment[] {
  return items.filter((i) => i.type === type);
}

export async function addEquipment(input: { type: EquipmentType; name: string }): Promise<void> {
  const { error } = await supabase.from("equipment").insert({
    type: input.type,
    name: input.name,
  });
  if (error) throw new Error(error.message);
}

export async function deleteEquipment(id: string): Promise<void> {
  const { error } = await supabase.from("equipment").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
