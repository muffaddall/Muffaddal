import { PageHeader } from "@/components/PageHeader";
import { FitnessSectionTabs } from "@/components/FitnessSectionTabs";
import { CaloriesTabs } from "@/components/CaloriesTabs";
import { getFoodItems } from "@/lib/foodItems";
import { MEAL_TYPES, MEAL_TYPE_LABELS } from "@/lib/types";
import FoodItemRow from "./FoodItemRow";
import AddFoodItemForm from "./AddFoodItemForm";

export const dynamic = "force-dynamic";

export default async function FoodItemsPage() {
  const items = await getFoodItems();

  return (
    <div className="pb-10">
      <PageHeader title="Food Items" />
      <div className="flex justify-center mb-2">
        <FitnessSectionTabs active="calories" />
      </div>
      <div className="flex justify-center mb-6">
        <CaloriesTabs active="foods" />
      </div>
      <main className="mx-auto max-w-xl px-4 sm:px-6">
        <p className="text-xs text-white/40 mb-6 text-center">
          Saved foods and meals show up as quick-add options on the Day log — a snack shows up in
          every meal&apos;s dropdown, not just Snacks.
        </p>

        {MEAL_TYPES.map((mt) => {
          const forType = items.filter((i) => i.mealType === mt);
          return (
            <section key={mt} className="mb-6">
              <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--color-fitness)" }}>
                {MEAL_TYPE_LABELS[mt]}
              </h2>
              <ul className="flex flex-col gap-1">
                {forType.map((item) => (
                  <FoodItemRow key={item.id} item={item} />
                ))}
                {forType.length === 0 && (
                  <li className="text-sm text-white/30 py-2 text-center">No items yet.</li>
                )}
              </ul>
            </section>
          );
        })}

        <AddFoodItemForm />
      </main>
    </div>
  );
}
