import type { TourneyGroupWithStandings } from "@/lib/tourneys";

export default function GroupsSummary({ groups }: { groups: TourneyGroupWithStandings[] }) {
  return (
    <div className="flex flex-col gap-2">
      {groups.map((g) => (
        <div key={g.group.id} className="rounded-xl bg-white/5 border border-white/8 p-3">
          <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--color-community)" }}>
            {g.group.name}
          </p>
          <ul className="flex flex-col gap-0.5">
            {g.teams.map((t) => (
              <li key={t.id} className="text-sm text-white/80">
                {t.playerAName} &amp; {t.playerBName}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
