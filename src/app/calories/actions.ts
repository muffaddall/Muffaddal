"use server";

import { revalidatePath } from "next/cache";
import { addCalorieEntry, deleteCalorieEntry, updateWaterAndBurned } from "@/lib/calories";
import { addFoodItem, deleteFoodItem } from "@/lib/foodItems";
import { isMealType } from "@/lib/types";

export type FormState = { error: string } | undefined;

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

export async function createCalorieEntry(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const date = String(formData.get("date") ?? "");
  const mealTypeRaw = String(formData.get("mealType") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const calories = Number(formData.get("calories"));

  if (!date) return { error: "Missing date." };
  if (!isMealType(mealTypeRaw)) return { error: "Invalid meal." };
  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(calories) || calories < 0) return { error: "Calories must be a number." };

  await addCalorieEntry({ date, mealType: mealTypeRaw, name, calories });
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

export async function createFoodItem(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const ingredients = String(formData.get("ingredients") ?? "").trim();
  const calories = Number(formData.get("calories"));
  const mealTypeRaw = String(formData.get("mealType") ?? "");

  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(calories) || calories < 0) return { error: "Calories must be a number." };
  if (!isMealType(mealTypeRaw)) return { error: "Pick a meal type." };

  await addFoodItem({ name, ingredients, calories, mealType: mealTypeRaw });
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
