import "server-only";
import { supabase } from "@/lib/supabase";
import { getAllTransactions } from "@/lib/transactions";
import { getAllDdCategories } from "@/lib/ddCategories";
import { addMonths } from "@/lib/format";
import { todayStr } from "@/lib/date";
import type {
  DdCategory,
  PadelBaseline,
  PadelTournamentResult,
  PadelWinning,
  PadelYearlyGames,
} from "@/lib/types";

export async function getPadelBaseline(): Promise<PadelBaseline> {
  const { data, error } = await supabase
    .from("padel_baseline")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  if (error) throw error;
  return {
    spent: data?.spent ?? 0,
    income: data?.income ?? 0,
    tournaments: data?.tournaments ?? 0,
    wins: data?.wins ?? 0,
    runnersUp: data?.runners_up ?? 0,
    knockouts: data?.knockouts ?? 0,
  };
}

export async function setPadelBaseline(input: PadelBaseline): Promise<void> {
  const { error } = await supabase.from("padel_baseline").upsert(
    {
      id: true,
      spent: input.spent,
      income: input.income,
      tournaments: input.tournaments,
      wins: input.wins,
      runners_up: input.runnersUp,
      knockouts: input.knockouts,
    },
    { onConflict: "id" }
  );
  if (error) throw error;
}

export async function getPadelYearlyGames(): Promise<PadelYearlyGames[]> {
  const { data, error } = await supabase
    .from("padel_yearly_games")
    .select("*")
    .order("year", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function upsertPadelYearlyGames(year: number, games: number): Promise<void> {
  const { error } = await supabase
    .from("padel_yearly_games")
    .upsert({ year, games }, { onConflict: "year" });
  if (error) throw error;
}

export async function deletePadelYearlyGames(year: number): Promise<void> {
  const { error } = await supabase.from("padel_yearly_games").delete().eq("year", year);
  if (error) throw error;
}

export async function getPadelWinnings(): Promise<PadelWinning[]> {
  const { data, error } = await supabase
    .from("padel_winnings")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export function totalPadelWinnings(winnings: PadelWinning[]): number {
  return winnings.reduce((sum, w) => sum + w.amount, 0);
}

export async function addPadelWinning(input: { name: string; amount: number }): Promise<void> {
  const { error } = await supabase.from("padel_winnings").insert(input);
  if (error) throw error;
}

export async function updatePadelWinning(
  id: string,
  input: { name: string; amount: number }
): Promise<void> {
  const { error } = await supabase.from("padel_winnings").update(input).eq("id", id);
  if (error) throw error;
}

export async function deletePadelWinning(id: string): Promise<void> {
  const { error } = await supabase.from("padel_winnings").delete().eq("id", id);
  if (error) throw error;
}

type PadelTournamentRow = {
  id: string;
  transaction_id: string | null;
  name: string;
  date: string | null;
  entry_fee: number | null;
  result: PadelTournamentResult | null;
};

export async function getPadelTournamentRows(): Promise<PadelTournamentRow[]> {
  const { data, error } = await supabase.from("padel_tournaments").select("*");
  if (error) throw error;
  return data ?? [];
}

/** Saves the name and result of a tournament tied to a Day-to-Day expense — its date and fee always come from the expense itself. */
export async function saveLinkedPadelTournament(
  transactionId: string,
  input: { name: string; result: PadelTournamentResult | null }
): Promise<void> {
  const { error } = await supabase
    .from("padel_tournaments")
    .upsert({ transaction_id: transactionId, ...input }, { onConflict: "transaction_id" });
  if (error) throw error;
}

export type ManualPadelTournamentInput = {
  name: string;
  date: string | null;
  entry_fee: number | null;
  result: PadelTournamentResult | null;
};

export async function addManualPadelTournament(input: ManualPadelTournamentInput): Promise<void> {
  const { error } = await supabase.from("padel_tournaments").insert(input);
  if (error) throw error;
}

export async function updateManualPadelTournament(id: string, input: ManualPadelTournamentInput): Promise<void> {
  const { error } = await supabase.from("padel_tournaments").update(input).eq("id", id).is("transaction_id", null);
  if (error) throw error;
}

export async function deleteManualPadelTournament(id: string): Promise<void> {
  const { error } = await supabase.from("padel_tournaments").delete().eq("id", id).is("transaction_id", null);
  if (error) throw error;
}

function findPadelCategoryId(categories: DdCategory[]): string | null {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const padel = categories.find(
    (c) =>
      c.kind === "expense" &&
      c.name === "Padel" &&
      c.parentId !== null &&
      byId.get(c.parentId)?.name === "Working out"
  );
  return padel?.id ?? null;
}

function collectDescendantIds(rootId: string, categories: DdCategory[]): Set<string> {
  const ids = new Set([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of categories) {
      if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id);
        grew = true;
      }
    }
  }
  return ids;
}

export type PadelCategoryBreakdown = { name: string; amount: number };

export type PadelPeriodBest = { key: string; count: number };

export type PadelGameCounts = {
  allTime: number;
  thisMonth: number;
  lastMonth: number;
  bestMonth: PadelPeriodBest | null;
  thisYear: number;
  lastYear: number;
  bestYear: PadelPeriodBest | null;
};

export type PadelLoggedTournament = {
  key: string;
  id: string | null; // padel_tournaments row, null for an expense not edited yet
  transactionId: string | null; // set when tied to a Day-to-Day expense
  name: string;
  date: string | null;
  entryFee: number | null;
  result: PadelTournamentResult | null;
};

export type PadelTournamentRecord = {
  played: number;
  wins: number;
  runnersUp: number;
  knockouts: number;
};

export type PadelStats = {
  baseline: PadelBaseline;
  yearlyGames: PadelYearlyGames[];
  winnings: PadelWinning[];
  totalIncome: number;
  totalSpent: number;
  net: number;
  breakdown: PadelCategoryBreakdown[];
  games: PadelGameCounts;
  tournaments: PadelLoggedTournament[];
  record: PadelTournamentRecord;
};

function bestPeriod(counts: Map<string, number>): PadelPeriodBest | null {
  let best: PadelPeriodBest | null = null;
  for (const [key, count] of counts) {
    if (!best || count > best.count) best = { key, count };
  }
  return best;
}

/**
 * Pulls every "Working out > Padel" Day-to-Day expense transaction (any
 * account, any subcategory — Games, Tournaments, Balls, Racket, Clothes,
 * and anything added later) and combines it with the lifetime baseline and
 * logged tournament winnings into one set of Padel Tracker figures. Game
 * counts by year combine each year's historical baseline (padel_yearly_
 * games, from known milestones) with real, dated "Games" transactions in
 * that same year — but month counts come only from real transactions,
 * since there's no month-level breakdown for the historical years.
 */
export async function getPadelStats(): Promise<PadelStats> {
  const [baseline, yearlyGames, winnings, transactions, categories, tournamentRows] = await Promise.all([
    getPadelBaseline(),
    getPadelYearlyGames(),
    getPadelWinnings(),
    getAllTransactions(),
    getAllDdCategories(),
    getPadelTournamentRows(),
  ]);

  const categoriesById = new Map(categories.map((c) => [c.id, c]));
  const padelRootId = findPadelCategoryId(categories);
  const padelIds = padelRootId ? collectDescendantIds(padelRootId, categories) : new Set<string>();
  const gamesId = categories.find((c) => c.parentId === padelRootId && c.name === "Games")?.id ?? null;
  const tournamentsId =
    categories.find((c) => c.parentId === padelRootId && c.name.toLowerCase().startsWith("tournament"))?.id ??
    null;

  const padelTx = transactions.filter(
    (t) => t.type === "expense" && t.categoryId !== null && padelIds.has(t.categoryId)
  );

  const totalSpent = baseline.spent + padelTx.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = baseline.income + totalPadelWinnings(winnings);
  const net = totalIncome - totalSpent;

  const breakdownMap = new Map<string, number>();
  for (const t of padelTx) {
    const cat = categoriesById.get(t.categoryId!);
    const label = cat?.name ?? "Other";
    breakdownMap.set(label, (breakdownMap.get(label) ?? 0) + t.amount);
  }
  const breakdown = Array.from(breakdownMap.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  const gameTx = gamesId ? transactions.filter((t) => t.type === "expense" && t.categoryId === gamesId) : [];

  const today = todayStr();
  const thisMonthKey = today.slice(0, 7);
  const thisYearKey = today.slice(0, 4);
  const lastMonthKey = addMonths(`${thisMonthKey}-01`, -1).slice(0, 7);
  const lastYearKey = String(Number(thisYearKey) - 1);

  const byMonth = new Map<string, number>();
  const byYear = new Map<string, number>();
  for (const t of gameTx) {
    const mKey = t.date.slice(0, 7);
    const yKey = t.date.slice(0, 4);
    byMonth.set(mKey, (byMonth.get(mKey) ?? 0) + 1);
    byYear.set(yKey, (byYear.get(yKey) ?? 0) + 1);
  }

  // Fold each year's historical baseline into the same map real
  // transactions feed, so "this year"/"last year"/"best year" reflect
  // known history plus whatever's actually been logged since.
  const totalBaselineGames = yearlyGames.reduce((sum, y) => sum + y.games, 0);
  for (const { year, games: g } of yearlyGames) {
    const key = String(year);
    byYear.set(key, (byYear.get(key) ?? 0) + g);
  }

  const games: PadelGameCounts = {
    allTime: totalBaselineGames + gameTx.length,
    thisMonth: byMonth.get(thisMonthKey) ?? 0,
    lastMonth: byMonth.get(lastMonthKey) ?? 0,
    bestMonth: bestPeriod(byMonth),
    thisYear: byYear.get(thisYearKey) ?? 0,
    lastYear: byYear.get(lastYearKey) ?? 0,
    bestYear: bestPeriod(byYear),
  };

  // Every "Padel > Tournaments" expense is one tournament entered, plus
  // any added by hand — all added on top of the pre-tracking baseline,
  // with each one's finish (if set) feeding wins / runner-up / knockouts.
  const rowByTx = new Map(
    tournamentRows.filter((r) => r.transaction_id).map((r) => [r.transaction_id!, r])
  );
  const linked: PadelLoggedTournament[] = tournamentsId
    ? transactions
        .filter((t) => t.type === "expense" && t.categoryId === tournamentsId)
        .map((t) => {
          const row = rowByTx.get(t.id);
          return {
            key: `tx-${t.id}`,
            id: row?.id ?? null,
            transactionId: t.id,
            name: row?.name || t.note || "Tournament",
            date: t.date,
            entryFee: t.amount,
            result: row?.result ?? null,
          };
        })
    : [];
  const manual: PadelLoggedTournament[] = tournamentRows
    .filter((r) => !r.transaction_id)
    .map((r) => ({
      key: r.id,
      id: r.id,
      transactionId: null,
      name: r.name || "Tournament",
      date: r.date,
      entryFee: r.entry_fee,
      result: r.result,
    }));
  const tournaments = [...linked, ...manual].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  const countResults = (pred: (r: PadelTournamentResult) => boolean) =>
    tournaments.filter((t) => t.result !== null && pred(t.result)).length;
  const record: PadelTournamentRecord = {
    played: baseline.tournaments + tournaments.length,
    wins: baseline.wins + countResults((r) => r === "winner"),
    runnersUp: baseline.runnersUp + countResults((r) => r === "runner_up"),
    knockouts: baseline.knockouts + countResults((r) => r !== "group"),
  };

  return { baseline, yearlyGames, winnings, totalIncome, totalSpent, net, breakdown, games, tournaments, record };
}
