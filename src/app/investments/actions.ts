"use server";

import { revalidatePath } from "next/cache";
import {
  addInvestmentWithdrawal,
  deleteInvestmentMonth,
  deleteInvestmentWithdrawal,
  setAedPerUsdRate,
  upsertInvestmentMonth,
} from "@/lib/investments";
import { inputValueToMonth } from "@/lib/format";

function revalidateInvestments(): void {
  revalidatePath("/investments");
  revalidatePath("/day-to-day");
  revalidatePath("/");
}

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

export async function saveWithdrawal(_prev: FormState, formData: FormData): Promise<FormState> {
  const date = String(formData.get("date") ?? "");
  const amountUsd = Number(formData.get("amountUsd"));
  const exchangeRate = Number(formData.get("exchangeRate"));
  const accountId = String(formData.get("accountId") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!date) return { error: "Date is required." };
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) return { error: "Enter a valid USD amount." };
  if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) return { error: "Enter a valid exchange rate." };
  if (!accountId) return { error: "Choose a destination account." };

  try {
    await addInvestmentWithdrawal({ date, amountUsd, exchangeRate, accountId, note });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save withdrawal." };
  }
  revalidateInvestments();
}

export async function removeWithdrawal(id: string): Promise<void> {
  await deleteInvestmentWithdrawal(id);
  revalidateInvestments();
}
