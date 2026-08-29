import "server-only";
import { supabase } from "@/lib/supabase";
import type { Account, Currency } from "@/lib/types";

type AccountRow = {
  id: string;
  name: string;
  currency: Currency;
  sort_order: number;
};

function fromRow(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    currency: row.currency,
    sortOrder: row.sort_order,
  };
}

const DEFAULT_ACCOUNTS: { name: string; currency: Currency }[] = [
  { name: "UAE", currency: "AED" },
  { name: "UK", currency: "GBP" },
  { name: "India", currency: "INR" },
  { name: "Physical Cash", currency: "AED" },
];

export async function getAccounts(): Promise<Account[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);

  let accounts = data ?? [];

  if (accounts.length === 0) {
    const { error: seedError } = await supabase.from("accounts").insert(
      DEFAULT_ACCOUNTS.map((a, i) => ({ ...a, sort_order: i }))
    );
    if (seedError) throw new Error(seedError.message);
  } else if (!accounts.some((a) => a.name === "Physical Cash")) {
    // Added after the initial seed — top up existing installs on next load
    // instead of requiring a manual DB step.
    const { error: topUpError } = await supabase
      .from("accounts")
      .insert({ name: "Physical Cash", currency: "AED", sort_order: accounts.length });
    if (topUpError) throw new Error(topUpError.message);
  } else {
    return accounts.map(fromRow);
  }

  const { data: refreshed, error: reErr } = await supabase
    .from("accounts")
    .select("*")
    .order("sort_order", { ascending: true });
  if (reErr) throw new Error(reErr.message);
  accounts = refreshed ?? [];

  return accounts.map(fromRow);
}

export async function getAccount(id: string): Promise<Account | null> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? fromRow(data) : null;
}

export async function addAccount(input: { name: string; currency: Currency }): Promise<void> {
  const { count, error: countError } = await supabase
    .from("accounts")
    .select("id", { count: "exact", head: true });
  if (countError) throw new Error(countError.message);

  const { error } = await supabase
    .from("accounts")
    .insert({ ...input, sort_order: count ?? 0 });
  if (error) throw new Error(error.message);
}

export async function deleteAccount(id: string): Promise<void> {
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
