import { PageHeader } from "@/components/PageHeader";
import { FitnessSectionTabs } from "@/components/FitnessSectionTabs";
import { getWeightLogs } from "@/lib/weight";
import { formatDateShort } from "@/lib/date";
import AddWeightForm from "./AddWeightForm";
import WeightRow from "./WeightRow";
import WeightChart from "./WeightChart";

export const dynamic = "force-dynamic";

export default async function WeightPage() {
  const logs = await getWeightLogs();
  const latest = logs.at(-1);

  return (
    <div className="pb-10">
      <PageHeader title="Weight Tracker" />
      <div className="flex justify-center mb-4">
        <FitnessSectionTabs active="weight" />
      </div>
      <main className="mx-auto max-w-3xl px-4 sm:px-6">
        {latest && (
          <div className="mb-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-center">
            <p className="text-xs mb-1" style={{ color: "var(--color-fitness)" }}>
              Latest weight
            </p>
            <p className="font-display text-4xl">{latest.weight} kg</p>
            <p className="text-xs text-white/40 mt-1">{formatDateShort(latest.date)}</p>
          </div>
        )}

        <AddWeightForm />

        <section className="mt-8 mb-8">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-fitness)" }}>
            Entries
          </h2>
          <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <table className="w-full min-w-[420px] border-collapse">
              <thead>
                <tr className="text-left text-xs text-[var(--color-fg-dim)]">
                  <th className="pb-2 pr-3 font-medium">Date</th>
                  <th className="pb-2 pr-3 font-medium">Time</th>
                  <th className="pb-2 pr-3 font-medium">Weight</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {[...logs].reverse().map((log) => (
                  <WeightRow key={log.id} log={log} />
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-sm text-[var(--color-fg-dim)]">
                      No weight entries yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {logs.length > 1 && (
          <section>
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-fitness)" }}>
              Trend
            </h2>
            <WeightChart logs={logs} />
          </section>
        )}
      </main>
    </div>
  );
}
