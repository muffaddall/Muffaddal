import "server-only";
import { supabase } from "@/lib/supabase";
import type { DdCategory, DdCategoryKind } from "@/lib/types";

type DdCategoryRow = {
  id: string;
  parent_id: string | null;
  kind: DdCategoryKind;
  name: string;
  sort_order: number;
};

function fromRow(row: DdCategoryRow): DdCategory {
  return {
    id: row.id,
    parentId: row.parent_id,
    kind: row.kind,
    name: row.name,
    sortOrder: row.sort_order,
  };
}

type SeedNode = { name: string; children?: SeedNode[] };

const EXPENSE_SEED: SeedNode[] = [
  {
    name: "Food",
    children: [
      { name: "Breakfast" },
      { name: "Lunch" },
      { name: "Dinner" },
      { name: "Snacks" },
      { name: "Beverages" },
    ],
  },
  {
    name: "Shopping",
    children: [
      { name: "Clothes" },
      { name: "Accessories" },
      { name: "Shoes" },
      { name: "Games" },
      { name: "Home stuff" },
      { name: "Random goodies" },
      { name: "Tech" },
      { name: "Cycling" },
      { name: "DJI Osmo" },
    ],
  },
  {
    name: "Going out",
    children: [
      { name: "Movie" },
      { name: "Billiards" },
      { name: "Activities" },
      { name: "Events" },
      { name: "Bowling" },
    ],
  },
  { name: "Gifts" },
  {
    name: "Working out",
    children: [
      {
        name: "Padel",
        children: [
          { name: "Games" },
          { name: "Tournaments" },
          { name: "Balls" },
          { name: "Racket" },
          { name: "Clothes" },
        ],
      },
      { name: "Football" },
      { name: "Gym" },
      { name: "OCR" },
      { name: "Badminton" },
      {
        name: "Triathlon",
        children: [
          { name: "Tri suit" },
          { name: "Swim accessories" },
          { name: "Cycle accessories" },
          { name: "Run accessories" },
        ],
      },
    ],
  },
  {
    name: "Grooming",
    children: [
      { name: "Haircut" },
      { name: "Massage" },
      { name: "Mani Pedi" },
      { name: "Facials" },
    ],
  },
  {
    name: "Public transport",
    children: [
      { name: "Taxi" },
      { name: "Metro" },
      { name: "Bus" },
      { name: "Bike" },
      { name: "Plane" },
      { name: "Valet" },
    ],
  },
  {
    name: "Fines",
    children: [{ name: "Speeding" }, { name: "Reckless driving" }, { name: "Phone" }],
  },
];

const INCOME_SEED: SeedNode[] = [{ name: "Extra money given" }, { name: "Eidi" }];

async function insertNode(
  node: SeedNode,
  kind: DdCategoryKind,
  parentId: string | null,
  sortOrder: number
): Promise<void> {
  const { data, error } = await supabase
    .from("dd_categories")
    .insert({ parent_id: parentId, kind, name: node.name, sort_order: sortOrder })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const id = (data as { id: string }).id;
  if (node.children && node.children.length > 0) {
    await Promise.all(node.children.map((child, i) => insertNode(child, kind, id, i)));
  }
}

async function seedCategories(kind: DdCategoryKind): Promise<void> {
  const tree = kind === "expense" ? EXPENSE_SEED : INCOME_SEED;
  await Promise.all(tree.map((node, i) => insertNode(node, kind, null, i)));
}

export async function getDdCategories(kind: DdCategoryKind): Promise<DdCategory[]> {
  const { data, error } = await supabase
    .from("dd_categories")
    .select("*")
    .eq("kind", kind)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);

  if ((data ?? []).length === 0) {
    await seedCategories(kind);
    const { data: seeded, error: reErr } = await supabase
      .from("dd_categories")
      .select("*")
      .eq("kind", kind)
      .order("sort_order", { ascending: true });
    if (reErr) throw new Error(reErr.message);
    return (seeded ?? []).map(fromRow);
  }

  return (data ?? []).map(fromRow);
}

export async function getAllDdCategories(): Promise<DdCategory[]> {
  const [expense, income] = await Promise.all([
    getDdCategories("expense"),
    getDdCategories("income"),
  ]);
  return [...expense, ...income];
}

export async function addDdCategory(input: {
  parentId: string | null;
  kind: DdCategoryKind;
  name: string;
}): Promise<void> {
  let countQuery = supabase
    .from("dd_categories")
    .select("id", { count: "exact", head: true })
    .eq("kind", input.kind);
  countQuery =
    input.parentId === null
      ? countQuery.is("parent_id", null)
      : countQuery.eq("parent_id", input.parentId);
  const { count, error: countError } = await countQuery;
  if (countError) throw new Error(countError.message);

  const { error } = await supabase.from("dd_categories").insert({
    parent_id: input.parentId,
    kind: input.kind,
    name: input.name,
    sort_order: count ?? 0,
  });
  if (error) throw new Error(error.message);
}

export async function deleteDdCategory(id: string): Promise<void> {
  const { error } = await supabase.from("dd_categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
