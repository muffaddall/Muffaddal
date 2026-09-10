"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { createCalorieEntry, removeCalorieEntry, saveCalorieLog } from "./actions";
import type { CalorieEntry, CalorieLog, FoodItem, MealType } from "@/lib/types";

const MEALS: { type: MealType; label: string; color: string }[] = [
  { type: "breakfast", label: "Breakfast", color: "var(--color-post)" },
  { type: "lunch", label: "Lunch", color: "var(--color-fitness)" },
  { type: "dinner", label: "Dinner", color: "var(--color-shoot)" },
  { type: "snack", label: "Snacks", color: "var(--color-edit)" },
];

const inputCls =
  "rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]";

export default function CalorieLogForm({
  date,
  log,
  entries,
  foodItems,
}: {
  date: string;
  log: CalorieLog | null;
  entries: CalorieEntry[];
  foodItems: FoodItem[];
}) {
  const entriesByMeal = (mealType: MealType) => entries.filter((e) => e.mealType === mealType);
  const forMeal = (mealType: MealType) =>
    mealType === "snack"
      ? foodItems.filter((i) => i.mealType === "snack")
      : foodItems.filter((i) => i.mealType === mealType || i.mealType === "snack");

  const [state, formAction, pending] = useActionState(saveCalorieLog, undefined);

  return (
    <div className="flex flex-col gap-3">
      {MEALS.map((meal) => (
        <MealCard
          key={meal.type}
          date={date}
          mealType={meal.type}
          label={meal.label}
          color={meal.color}
          entries={entriesByMeal(meal.type)}
          foodItems={forMeal(meal.type)}
        />
      ))}

      <form
        action={formAction}
        className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
      >
        <input type="hidden" name="date" value={date} />
        <Field label="Water (ml)" name="water" defaultValue={log?.water ?? 0} />
        <div className="border-t border-[var(--color-border)] pt-3">
          <Field label="Calories burned" name="burned" defaultValue={log?.burned ?? 0} />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--color-accent)] text-black font-medium px-3 py-2 text-sm disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save water & burned"}
        </button>
        {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
      </form>
    </div>
  );
}

function MealCard({
  date,
  mealType,
  label,
  color,
  entries,
  foodItems,
}: {
  date: string;
  mealType: MealType;
  label: string;
  color: string;
  entries: CalorieEntry[];
  foodItems: FoodItem[];
}) {
  const total = entries.reduce((sum, e) => sum + e.calories, 0);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <h3 className="text-center text-sm font-semibold" style={{ color }}>
        {label}
      </h3>

      <ul className="flex flex-col gap-1">
        {entries.map((entry) => (
          <EntryRow key={entry.id} entry={entry} />
        ))}
        {entries.length === 0 && (
          <p className="text-xs text-white/40 text-center py-1">No food logged yet</p>
        )}
      </ul>

      {foodItems.length > 0 && <QuickAddFromLibrary date={date} mealType={mealType} items={foodItems} />}
      <AddFoodForm date={date} mealType={mealType} />

      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <span className="text-sm text-white/70">Total</span>
        <span className="text-sm font-semibold tabular-nums">{total} kcal</span>
      </div>
    </div>
  );
}

function EntryRow({ entry }: { entry: CalorieEntry }) {
  const [isDeleting, startDelete] = useTransition();
  return (
    <li className="flex items-center justify-between gap-2 text-sm rounded-lg px-2 py-1 hover:bg-white/5 transition-colors">
      <span className="truncate">{entry.name}</span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="tabular-nums text-white/70">{entry.calories} kcal</span>
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => startDelete(() => removeCalorieEntry(entry.id, entry.date, entry.mealType))}
          className="text-xs text-[var(--color-negative)] hover:opacity-80 disabled:opacity-60"
        >
          {isDeleting ? "…" : "✕"}
        </button>
      </span>
    </li>
  );
}

function QuickAddFromLibrary({
  date,
  mealType,
  items,
}: {
  date: string;
  mealType: MealType;
  items: FoodItem[];
}) {
  const [selectedId, setSelectedId] = useState(items[0].id);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="min-w-0 flex-1 rounded-lg bg-white/5 border border-[var(--color-border)] px-2 py-1 text-xs text-white/70 outline-none focus:border-[var(--color-accent)]"
      >
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name} ({item.calories} kcal)
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          const item = items.find((i) => i.id === selectedId);
          if (!item) return;
          const fd = new FormData();
          fd.set("date", date);
          fd.set("mealType", mealType);
          fd.set("name", item.name);
          fd.set("calories", String(item.calories));
          startTransition(() => {
            createCalorieEntry(undefined, fd);
          });
        }}
        className="shrink-0 rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs text-white/70 hover:bg-white/5 disabled:opacity-60"
      >
        {isPending ? "…" : "+ Add"}
      </button>
    </div>
  );
}

function AddFoodForm({ date, mealType }: { date: string; mealType: MealType }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await createCalorieEntry(prev, formData);
    if (!result) formRef.current?.reset();
    return result;
  }, undefined);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-center gap-1.5">
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="mealType" value={mealType} />
      <input
        name="name"
        placeholder="Food name"
        required
        className={`${inputCls} flex-1 min-w-20 py-1 text-xs`}
      />
      <input
        name="calories"
        type="number"
        step="any"
        min={0}
        placeholder="kcal"
        required
        className={`${inputCls} w-16 py-1 text-xs`}
      />
      <button
        type="submit"
        disabled={pending}
        className="shrink-0 rounded-lg bg-[var(--color-accent)] text-black px-2 py-1 text-xs font-medium disabled:opacity-60"
      >
        {pending ? "…" : "Add"}
      </button>
      {state?.error && <p className="w-full text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: number;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-sm text-white/70">{label}</span>
      <input
        name={name}
        type="number"
        step="any"
        min={0}
        defaultValue={defaultValue}
        className="w-28 rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm text-right outline-none focus:border-[var(--color-accent)]"
      />
    </label>
  );
}
