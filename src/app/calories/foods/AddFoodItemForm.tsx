"use client";

import { useActionState, useRef } from "react";
import { createFoodItem } from "../actions";
import { MEAL_TYPES, MEAL_TYPE_LABELS } from "@/lib/types";

export default function AddFoodItemForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (
    prev: { error: string } | undefined,
    formData: FormData
  ) => {
    const result = await createFoodItem(prev, formData);
    if (!result) formRef.current?.reset();
    return result;
  }, undefined);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-2 rounded-xl border border-dashed border-[var(--color-border)] p-3"
    >
      <div className="flex flex-wrap gap-2">
        <input
          name="name"
          placeholder="Name (e.g. Chicken and Rice Lunch)"
          required
          className="min-w-0 flex-1 rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
        />
        <select
          name="mealType"
          defaultValue="snack"
          className="rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
        >
          {MEAL_TYPES.map((mt) => (
            <option key={mt} value={mt}>
              {MEAL_TYPE_LABELS[mt]}
            </option>
          ))}
        </select>
      </div>
      <input
        name="ingredients"
        placeholder="Ingredients (optional, e.g. 3 turkey slices, 3 eggs)"
        className="w-full rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
      />
      <div className="flex items-center gap-2">
        <input
          name="calories"
          type="number"
          step="any"
          placeholder="Calories"
          required
          className="w-32 rounded-lg bg-white/5 border border-[var(--color-border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-accent)]"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--color-accent)] text-black font-medium px-3 py-1.5 text-sm disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add food item"}
        </button>
      </div>
      {state?.error && <p className="text-xs text-[var(--color-negative)]">{state.error}</p>}
    </form>
  );
}
