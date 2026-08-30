import Link from "next/link";
import type { Account } from "@/lib/types";

export default function AccountQuickTabs({
  accounts,
  selectedAccountId,
  basePath,
  extraQuery,
}: {
  accounts: Account[];
  selectedAccountId: string | null;
  basePath: string;
  /** e.g. "month=2026-08" or "year=2026" — carried through on every tab link. */
  extraQuery?: string;
}) {
  return (
    <nav className="flex items-center gap-1 rounded-full bg-white/5 p-1 border border-white/10 overflow-x-auto">
      {accounts.map((account) => (
        <Link
          key={account.id}
          href={`${basePath}?${extraQuery ? `${extraQuery}&` : ""}account=${account.id}`}
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedAccountId === account.id ? "bg-white/15 text-white" : "text-white/50"
          }`}
        >
          {account.name}
        </Link>
      ))}
    </nav>
  );
}
