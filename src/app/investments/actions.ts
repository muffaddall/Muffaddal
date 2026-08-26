"use server";

import { revalidatePath } from "next/cache";
import { deleteInvestmentMonth, setAedPerUsdRate, upsertInvestmentMonth } from "@/lib/investments";
import { inputValueToMonth } from "@/lib/format";

export type FormState = { error: string } | undefined;

export async function saveInvestmentMonth(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const monthInput = String(formData.get("month") ?? "");
  const portfolioRaw = String(formData.get("portfolio_value_eom") ?? "").trim();

  if (!monthInput) return { error: "Month is required." };

  const portfolio_value_eom = portfolioRaw === "" ? null : Number(portfolioRaw);
  if (portfolio_value_eom !== null && !Number.isFinite(portfolio_value_eom)) {
    return { error: "Portfolio value must be a number." };
  }

  await upsertInvestmentMonth({
    month: inputValueToMonth(monthInput),
    portfolio_value_eom,
  });
  revalidatePath("/investments");
  revalidatePath("/");
}

export async function removeInvestmentMonth(month: string): Promise<void> {
  await deleteInvestmentMonth(month);
  revalidatePath("/investments");
  revalidatePath("/");
}

export async function saveAedPerUsdRate(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const rate = Number(formData.get("rate"));
  if (!Number.isFinite(rate) || rate <= 0) return { error: "Rate must be a positive number." };

  await setAedPerUsdRate(rate);
  revalidatePath("/investments");
  revalidatePath("/");
}
