import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { FinanceSectionTabs } from "@/components/FinanceSectionTabs";
import { getAccount } from "@/lib/accounts";
import { getTransaction } from "@/lib/transactions";
import { getReceivablesForTransaction } from "@/lib/receivables";
import { getPeople } from "@/lib/people";
import { formatMoney } from "@/lib/format";
import AddSplitForm from "../AddSplitForm";
import ReceivableRow from "../ReceivableRow";

export const dynamic = "force-dynamic";

export default async function TransactionReceivablesPage({
  params,
  searchParams,
}: {
  params: Promise<{ transactionId: string }>;
  searchParams: Promise<{ month?: string; account?: string }>;
}) {
  const { transactionId } = await params;
  const search = await searchParams;

  const transaction = await getTransaction(transactionId);
  if (!transaction || transaction.type !== "expense") notFound();

  const [account, receivables, people] = await Promise.all([
    getAccount(transaction.accountId),
    getReceivablesForTransaction(transactionId),
    getPeople(),
  ]);
  if (!account) notFound();

  const peopleById = new Map(people.map((p) => [p.id, p.name]));
  const totalSplit = receivables.reduce((sum, r) => sum + r.amount, 0);
  const outstandingTotal = receivables
    .filter((r) => r.status === "outstanding")
    .reduce((sum, r) => sum + r.amount, 0);
  const remaining = transaction.amount - totalSplit;

  const backQuery = new URLSearchParams();
  if (search.month) backQuery.set("month", search.month);
  if (search.account) backQuery.set("account", search.account);
  const backHref = `/day-to-day${backQuery.size > 0 ? `?${backQuery.toString()}` : ""}`;

  return (
    <div className="pb-10">
      <PageHeader title="Who Owes What" subtitle="Day-to-Day Expenses" />
      <div className="flex justify-center mb-4">
        <FinanceSectionTabs active="day-to-day" />
      </div>
      <main className="mx-auto max-w-xl px-4 sm:px-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-[var(--color-fg-dim)] hover:text-white/80 transition-colors mb-4"
        >
          ← Back to diary
        </Link>

        <div className="mb-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
          <p className="text-xs mb-1" style={{ color: "var(--color-accent)" }}>
            {transaction.note || "Expense"} · {transaction.date}
          </p>
          <p className="font-display text-3xl">{formatMoney(transaction.amount, account.currency)}</p>
          {outstandingTotal > 0 && (
            <p className="text-sm mt-1" style={{ color: "var(--color-negative)" }}>
              {formatMoney(outstandingTotal, account.currency)} still owed to you
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2 mb-6">
          {receivables.map((r) => (
            <ReceivableRow
              key={r.id}
              receivable={r}
              personName={r.personId ? (peopleById.get(r.personId) ?? "Unknown") : "Unknown"}
              accountId={account.id}
              currency={account.currency}
            />
          ))}
          {receivables.length === 0 && (
            <p className="text-sm text-[var(--color-fg-dim)] py-4 text-center">
              Nobody&apos;s been marked as owing you on this expense yet.
            </p>
          )}
        </div>

        {remaining > 0 ? (
          <AddSplitForm transactionId={transactionId} people={people} remaining={remaining} />
        ) : (
          <p className="text-sm text-[var(--color-fg-dim)] text-center">
            The full amount has been split.
          </p>
        )}
      </main>
    </div>
  );
}
