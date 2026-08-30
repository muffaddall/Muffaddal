import "server-only";
import { supabase } from "@/lib/supabase";
import type { Person } from "@/lib/types";

function fromRow(row: { id: string; name: string }): Person {
  return { id: row.id, name: row.name };
}

export async function getPeople(): Promise<Person[]> {
  const { data, error } = await supabase
    .from("dd_people")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function addPerson(name: string): Promise<Person> {
  const { data, error } = await supabase
    .from("dd_people")
    .insert({ name })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return fromRow(data as { id: string; name: string });
}

export async function deletePerson(id: string): Promise<void> {
  const { error } = await supabase.from("dd_people").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
