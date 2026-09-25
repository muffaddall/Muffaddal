"use server";

import { revalidatePath } from "next/cache";
import {
  addCalorieEntry,
  deleteCalorieEntry,
  setCalorieEntryEaten,
  setCalorieGoals,
  updateWaterAndBurned,
} from "@/lib/calories";
import { addFoodItem, deleteFoodItem } from "@/lib/foodItems";
import { isMealType } from "@/lib/types";

export type FormState = { error: string } | undefined;

/** Parses a macro field from FormData — defaults to 0 when left blank, since not every food needs every macro tracked. */
function parseMacro(formData: FormData, name: string): number | null {
  const raw = formData.get(name);
  if (raw === null || raw === "") return 0;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export async function saveCalorieLog(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const date = String(formData.get("date") ?? "");
  const burned = Number(formData.get("burned"));
  const water = Number(formData.get("water"));

  if (!date) return { error: "Missing date." };
  if (![burned, water].every(Number.isFinite)) {
    return { error: "All values must be numbers." };
  }

  await updateWaterAndBurned(date, water, burned);
  revalidatePath("/calories");
  revalidatePath("/calories/week");
}

export async function saveCalorieGoals(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const calories = Number(formData.get("calories"));
  const burned = Number(formData.get("burned"));
  const protein = Number(formData.get("protein"));
  const carbs = Number(formData.get("carbs"));
  const fat = Number(formData.get("fat"));

  if (![calories, burned, protein, carbs, fat].every((v) => Number.isFinite(v) && v >= 0)) {
    return { error: "All goals must be numbers." };
  }

  await setCalorieGoals({ calories, burned, protein, carbs, fat });
  revalidatePath("/calories");
}

export async function createCalorieEntry(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const date = String(formData.get("date") ?? "");
  const mealTypeRaw = String(formData.get("mealType") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const calories = Number(formData.get("calories"));
  const protein = parseMacro(formData, "protein");
  const carbs = parseMacro(formData, "carbs");
  const fat = parseMacro(formData, "fat");

  if (!date) return { error: "Missing date." };
  if (!isMealType(mealTypeRaw)) return { error: "Invalid meal." };
  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(calories) || calories < 0) return { error: "Calories must be a number." };
  if (protein === null || carbs === null || fat === null) {
    return { error: "Macros must be numbers." };
  }

  await addCalorieEntry({ date, mealType: mealTypeRaw, name, calories, protein, carbs, fat });
  revalidatePath("/calories");
  revalidatePath("/calories/week");
  revalidatePath("/calories/month");
}

export async function removeCalorieEntry(
  id: string,
  date: string,
  mealType: string
): Promise<void> {
  if (!isMealType(mealType)) return;
  await deleteCalorieEntry(id, date, mealType);
  revalidatePath("/calories");
  revalidatePath("/calories/week");
  revalidatePath("/calories/month");
}

export async function toggleCalorieEntryEaten(
  id: string,
  date: string,
  mealType: string,
  eaten: boolean
): Promise<void> {
  if (!isMealType(mealType)) return;
  await setCalorieEntryEaten(id, date, mealType, eaten);
  revalidatePath("/calories");
  revalidatePath("/calories/week");
  revalidatePath("/calories/month");
}

export async function createFoodItem(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const ingredients = String(formData.get("ingredients") ?? "").trim();
  const calories = Number(formData.get("calories"));
  const protein = parseMacro(formData, "protein");
  const carbs = parseMacro(formData, "carbs");
  const fat = parseMacro(formData, "fat");
  const mealTypeRaw = String(formData.get("mealType") ?? "");

  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(calories) || calories < 0) return { error: "Calories must be a number." };
  if (protein === null || carbs === null || fat === null) {
    return { error: "Macros must be numbers." };
  }
  if (!isMealType(mealTypeRaw)) return { error: "Pick a meal type." };

  await addFoodItem({ name, ingredients, calories, protein, carbs, fat, mealType: mealTypeRaw });
  revalidatePath("/calories/foods");
  revalidatePath("/calories");
  revalidatePath("/calories/week");
}

export async function removeFoodItem(id: string): Promise<void> {
  await deleteFoodItem(id);
  revalidatePath("/calories/foods");
  revalidatePath("/calories");
  revalidatePath("/calories/week");
}
