import { PageHeader } from "@/components/PageHeader";
import { FitnessSectionTabs } from "@/components/FitnessSectionTabs";
import { getEquipment, equipmentForType } from "@/lib/equipment";
import { getAllWorkoutLogs } from "@/lib/workouts";
import { EQUIPMENT_TYPES, EQUIPMENT_TYPE_LABELS, sumDistanceByEquipment } from "@/lib/types";
import EquipmentRow from "./EquipmentRow";
import AddEquipmentForm from "./AddEquipmentForm";

export const dynamic = "force-dynamic";

export default async function EquipmentPage() {
  const [items, logs] = await Promise.all([getEquipment(), getAllWorkoutLogs()]);
  const totalsByEquipment = sumDistanceByEquipment(logs);

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
              <ul className="flex flex-col gap-1">
                {forType.map((item) => (
                  <EquipmentRow key={item.id} item={item} totalKm={totalsByEquipment.get(item.id) ?? 0} />
                ))}
                {forType.length === 0 && (
                  <li className="text-sm text-white/30 py-2 text-center">No items yet.</li>
                )}
              </ul>
            </section>
          );
        })}

        <AddEquipmentForm />
      </main>
    </div>
  );
}
