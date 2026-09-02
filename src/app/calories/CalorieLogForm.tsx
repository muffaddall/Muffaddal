"use client";

import { useActionState, useRef, useState } from "react";
import { saveCalorieLog } from "./actions";
import type { CalorieLog, FoodItem, MealType } from "@/lib/types";

export default function CalorieLogForm({
  date,
  log,
  foodItems,
}: {
  date: string;
  log: CalorieLog | null;
  foodItems: FoodItem[];
}) {
  const [state, formAction, pending] = useActionState(saveCalorieLog, undefined);
  const breakfastRef = useRef<HTMLInputElement>(null);
  const lunchRef = useRef<HTMLInputElement>(null);
  const dinnerRef = useRef<HTMLInputElement>(null);
  const snacksRef = useRef<HTMLInputElement>(null);

  const forMeal = (mealType: MealType) =>
    mealType === "snack"
      ? foodItems.filter((i) => i.mealType === "snack")
      : foodItems.filter((i) => i.mealType === mealType || i.mealType === "snack");

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    >
      <input type="hidden" name="date" value={date} />
      <MealField
        label="Breakfast"
        name="breakfast"
        defaultValue={log?.breakfast ?? 0}
        inputRef={breakfastRef}
        items={forMeal("breakfast")}
      />
      <MealField
        label="Lunch"
        name="lunch"
        defaultValue={log?.lunch ?? 0}
        inputRef={lunchRef}
        items={forMeal("lunch")}
      />
      <MealField
        label="Dinner"
        name="dinner"
        defaultValue={log?.dinner ?? 0}
        inputRef={dinnerRef}
        items={forMeal("dinner")}
      />
      <MealField
        label="Snacks"
        name="snacks"
        defaultValue={log?.snacks ?? 0}
        inputRef={snacksRef}
        items={forMeal("snack")}
      />
      <Field label="Water (ml)" name="water" defaultValue={log?.water ?? 0} />
      <div className="border-t border-[var(--color-border)] pt-3">
        <Field label="Calories burned" name="burned" defaultValue={log?.burned ?? 0} />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--color-accent)] text-black font-medium px-3 py-2 text-sm disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save day"}
      </button>
      {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}

function MealField({
  label,
  name,
  defaultValue,
  inputRef,
  items,
}: {
  label: string;
  name: string;
  defaultValue: number;
  inputRef: React.RefObject<HTMLInputElement | null>;
  items: FoodItem[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center justify-between gap-3">
        <span className="text-sm text-white/70">{label}</span>
        <input
          ref={inputRef}
          name={name}
          type="number"
          step="any"
          min={0}
          defaultValue={defaultValue}
          className="w-28 rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm text-right outline-none focus:border-[var(--color-accent)]"
        />
      </label>
      {items.length > 0 && <QuickAdd items={items} inputRef={inputRef} />}
    </div>
  );
}

function QuickAdd({
  items,
  inputRef,
}: {
  items: FoodItem[];
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [selectedId, setSelectedId] = useState(items[0].id);

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
        onClick={() => {
          const item = items.find((i) => i.id === selectedId);
          if (!item || !inputRef.current) return;
          const current = Number(inputRef.current.value) || 0;
          inputRef.current.value = String(current + item.calories);
        }}
        className="shrink-0 rounded-lg border border-[var(--color-border)] px-2 py-1 text-xs text-white/70 hover:bg-white/5"
      >
        + Add
      </button>
    </div>
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
