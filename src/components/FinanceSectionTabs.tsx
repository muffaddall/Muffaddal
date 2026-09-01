import Link from "next/link";

const ITEMS = [
  { key: "expenses", href: "/expenses", label: "Planned" },
  { key: "day-to-day", href: "/day-to-day", label: "Day-to-Day" },
  { key: "investments", href: "/investments", label: "Investments" },
  { key: "savings", href: "/savings", label: "Savings" },
  { key: "networth", href: "/networth", label: "Net Worth" },
] as const;

export function FinanceSectionTabs({
  active,
}: {
  active: "expenses" | "day-to-day" | "investments" | "savings" | "networth";
}) {
  return (
    <nav className="flex items-center gap-1 rounded-full bg-white/5 p-1 border border-white/10 flex-wrap justify-center">
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
