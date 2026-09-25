import { PageHeader } from "@/components/PageHeader";
import { FitnessSectionTabs } from "@/components/FitnessSectionTabs";
import { getEquipment, equipmentForType } from "@/lib/equipment";
import { getAllWorkoutLogs } from "@/lib/workouts";
import { EQUIPMENT_TYPES, EQUIPMENT_TYPE_LABELS, computeEquipmentStats } from "@/lib/types";
import EquipmentRow from "./EquipmentRow";
import AddEquipmentForm from "./AddEquipmentForm";

export const dynamic = "force-dynamic";

export default async function EquipmentPage() {
  const [items, logs] = await Promise.all([getEquipment(), getAllWorkoutLogs()]);
  const statsByEquipment = computeEquipmentStats(logs);

  return (
    <div className="pb-10">
      <PageHeader title="Equipment" subtitle="Workout Tracker" />
      <div className="flex justify-center mb-6">
        <FitnessSectionTabs active="workouts" />
      </div>
      <main className="mx-auto max-w-xl px-4 sm:px-6">
        <p className="text-xs text-white/40 mb-6 text-center">
          Your gear — pick which one you used when logging a run or ride on the Running/Cycling
          pages.
        </p>

        {EQUIPMENT_TYPES.map((type) => {
          const forType = equipmentForType(items, type);
          return (
            <section key={type} className="mb-6">
              <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--color-fitness)" }}>
                {EQUIPMENT_TYPE_LABELS[type]}s
              </h2>
              {forType.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="text-left text-xs text-[var(--color-fg-dim)]">
                        <th className="pb-2 pr-3 font-medium">Total distance</th>
                        <th className="pb-2 font-medium">Name</th>
                        <th className="pb-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {forType.map((item) => (
                        <EquipmentRow
                          key={item.id}
                          item={item}
                          stats={
                            statsByEquipment.get(item.id) ?? {
                              totalKm: 0,
                              workoutCount: 0,
                              lastUsed: null,
                            }
                          }
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-white/30 py-2 text-center">No items yet.</p>
              )}
            </section>
          );
        })}

        <AddEquipmentForm />
      </main>
    </div>
  );
}
