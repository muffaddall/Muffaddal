import Link from "next/link";

const ITEMS = [
  { key: "calories", href: "/calories", label: "Calories" },
  { key: "weight", href: "/weight", label: "Weight" },
  { key: "workouts", href: "/workouts", label: "Workouts" },
] as const;

export function FitnessSectionTabs({
  active,
}: {
  active: "calories" | "weight" | "workouts";
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
