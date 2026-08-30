import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { FinanceSectionTabs } from "@/components/FinanceSectionTabs";
import { getPeople } from "@/lib/people";
import { getAllReceivables } from "@/lib/receivables";
import { getTransactionsByIds } from "@/lib/transactions";
import { getAccounts } from "@/lib/accounts";
import { formatMoney } from "@/lib/format";
import AddPersonForm from "./AddPersonForm";
import OwedEntryRow from "./OwedEntryRow";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const [people, receivables, accounts] = await Promise.all([
    getPeople(),
    getAllReceivables(),
    getAccounts(),
  ]);

  const transactionIds = Array.from(new Set(receivables.map((r) => r.transactionId)));
  const transactions = await getTransactionsByIds(transactionIds);
  const transactionsById = new Map(transactions.map((t) => [t.id, t]));
  const accountsById = new Map(accounts.map((a) => [a.id, a]));

  const peopleById = new Map(people.map((p) => [p.id, p.name]));
  const receivablesByPerson = new Map<string, typeof receivables>();
  for (const r of receivables) {
    const key = r.personId ?? "unassigned";
    const list = receivablesByPerson.get(key);
    if (list) list.push(r);
    else receivablesByPerson.set(key, [r]);
  }

  const personKeys = Array.from(receivablesByPerson.keys())
    .concat(people.map((p) => p.id).filter((id) => !receivablesByPerson.has(id)))
    .filter((key, i, arr) => arr.indexOf(key) === i);

  return (
    <div className="pb-10">
      <PageHeader title="People Owe Me" subtitle="Day-to-Day Expenses" />
      <div className="flex justify-center mb-4">
        <FinanceSectionTabs active="day-to-day" />
      </div>
      <main className="mx-auto max-w-2xl px-4 sm:px-6">
        <Link
          href="/day-to-day"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-fg-dim)] hover:text-white/80 transition-colors mb-4"
        >
          ← Back to Day-to-Day
        </Link>

        <div className="mb-6">
          <AddPersonForm />
        </div>

        <div className="flex flex-col gap-4">
          {personKeys.map((key) => {
            const entries = receivablesByPerson.get(key) ?? [];
            const name = key === "unassigned" ? "Unassigned" : (peopleById.get(key) ?? "Unknown");
            const outstandingTotal = entries
              .filter((r) => r.status === "outstanding")
              .reduce((sum, r) => sum + r.amount, 0);

            return (
              <section key={key} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold">{name}</h2>
                  <span
                    className="font-display text-lg"
                    style={{ color: outstandingTotal > 0 ? "var(--color-negative)" : "var(--color-fg-dim)" }}
                  >
                    {formatMoney(outstandingTotal)} owed
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {entries.map((r) => {
                    const tx = transactionsById.get(r.transactionId);
                    const account = tx ? accountsById.get(tx.accountId) : undefined;
                    return (
                      <OwedEntryRow
                        key={r.id}
                        receivable={r}
                        personName={name}
                        accountId={tx?.accountId ?? ""}
                        currency={account?.currency ?? "AED"}
                        transactionNote={tx?.note ?? ""}
                        transactionDate={tx?.date ?? ""}
                      />
                    );
                  })}
                  {entries.length === 0 && (
                    <p className="text-sm text-[var(--color-fg-dim)] py-2 text-center">
                      Nothing logged yet.
                    </p>
                  )}
                </div>
              </section>
            );
          })}
          {personKeys.length === 0 && (
            <p className="text-sm text-[var(--color-fg-dim)] py-6 text-center">
              No one&apos;s been added yet. Add a person above, then split an expense with them
              from its entry in the diary.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
