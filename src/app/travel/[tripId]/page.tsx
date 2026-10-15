import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { FinanceSectionTabs } from "@/components/FinanceSectionTabs";
import { getAccounts } from "@/lib/accounts";
import { getTrip, getTripTransactions, getTripWallets } from "@/lib/trips";
import { computeTripWalletBalance } from "@/lib/types";
import { formatTripMoney } from "@/lib/format";
import AddTripCurrencyForm from "./AddTripCurrencyForm";
import AddTripTransactionForm from "./AddTripTransactionForm";
import TripTransactionRow from "./TripTransactionRow";

export const dynamic = "force-dynamic";

export default async function TripPage(props: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await props.params;
  const trip = await getTrip(tripId);
  if (!trip) notFound();

  const [wallets, transactions, accounts] = await Promise.all([
    getTripWallets(tripId),
    getTripTransactions(tripId),
    getAccounts(),
  ]);

  const walletsById = new Map(wallets.map((w) => [w.id, w]));
  const existingCurrencies = wallets.map((w) => w.currency);

  const byDate = new Map<string, typeof transactions>();
  for (const tx of transactions) {
    const list = byDate.get(tx.date);
    if (list) list.push(tx);
    else byDate.set(tx.date, [tx]);
  }
  const dates = Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a));

  return (
    <div className="pb-10">
      <PageHeader
        title={trip.name}
        subtitle="Travel"
        right={
          <Link
            href="/travel"
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-white/5 transition-colors"
          >
            ← Travel
          </Link>
        }
      />
      <div className="flex justify-center mb-4">
        <FinanceSectionTabs active="travel" />
      </div>
      <main className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-3">
          {wallets.map((w) => {
            const balance = computeTripWalletBalance(transactions, w.id);
            return (
              <div
                key={w.id}
                className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-center"
              >
                <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
                  {w.currency}
                </p>
                <p
                  className="font-display text-2xl"
                  style={{ color: balance < 0 ? "var(--color-negative)" : undefined }}
                >
                  {formatTripMoney(balance, w.currency)}
                </p>
              </div>
            );
          })}
          {wallets.length === 0 && (
            <p className="col-span-full text-sm text-[var(--color-fg-dim)] text-center py-4">
              Add a currency below to start logging this trip.
            </p>
          )}
        </div>

        <details className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden" open={wallets.length === 0}>
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: "var(--color-accent)" }}>
              Add a currency
            </span>
            <span className="text-xs text-[var(--color-fg-dim)]">▾</span>
          </summary>
          <div className="px-4 pb-4">
            <AddTripCurrencyForm tripId={tripId} existingCurrencies={existingCurrencies} />
          </div>
        </details>

        {wallets.length > 0 && (
          <>
            <AddTripTransactionForm tripId={tripId} wallets={wallets} accounts={accounts} />

            <section className="mt-6">
              <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-accent)" }}>
                Diary
              </h2>
              <div className="flex flex-col gap-4">
                {dates.map((date) => (
                  <div key={date}>
                    <p className="text-xs font-medium text-[var(--color-fg-dim)] mb-1.5">{date}</p>
                    <div className="flex flex-col gap-2">
                      {byDate.get(date)!.map((tx) => (
                        <TripTransactionRow
                          key={tx.id}
                          tx={tx}
                          walletCurrency={walletsById.get(tx.walletId)?.currency ?? "?"}
                          toWalletCurrency={
                            tx.toWalletId ? (walletsById.get(tx.toWalletId)?.currency ?? null) : null
                          }
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {dates.length === 0 && (
                  <p className="text-sm text-[var(--color-fg-dim)] py-6 text-center">
                    No transactions logged yet.
                  </p>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
