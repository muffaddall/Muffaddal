import Link from "next/link";

const ITEMS = [
  { key: "schedule", href: "/schedule/day", label: "Shoot/Edit" },
  { key: "posting", href: "/posting-schedule", label: "Posting" },
  { key: "vault", href: "/vault", label: "Vault" },
  { key: "podcast", href: "/podcast", label: "Podcast" },
] as const;

export function ContentSectionTabs({
  active,
}: {
  active: "schedule" | "posting" | "vault" | "podcast";
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
