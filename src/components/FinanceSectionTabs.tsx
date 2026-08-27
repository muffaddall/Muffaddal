import Link from "next/link";

const ITEMS = [
  { key: "expenses", href: "/expenses", label: "Expenses" },
  { key: "investments", href: "/investments", label: "Investments" },
  { key: "savings", href: "/savings", label: "Savings" },
] as const;

export function FinanceSectionTabs({
  active,
}: {
  active: "expenses" | "investments" | "savings";
}) {
  return (
    <nav className="flex items-center gap-1 rounded-full bg-white/5 p-1 border border-white/10">
      {ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            active === item.key ? "bg-white/15 text-white" : "text-white/50"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
