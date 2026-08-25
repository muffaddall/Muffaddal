"use server";

import { revalidatePath } from "next/cache";
import { deleteInvestmentMonth, upsertInvestmentMonth } from "@/lib/investments";
import { inputValueToMonth } from "@/lib/format";

export type FormState = { error: string } | undefined;

export async function saveInvestmentMonth(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const monthInput = String(formData.get("month") ?? "");
  const contribution = Number(formData.get("contribution"));
  const portfolioRaw = String(formData.get("portfolio_value_eom") ?? "").trim();

  if (!monthInput) return { error: "Month is required." };
  if (!Number.isFinite(contribution)) return { error: "Contribution must be a number." };

  const portfolio_value_eom = portfolioRaw === "" ? null : Number(portfolioRaw);
  if (portfolio_value_eom !== null && !Number.isFinite(portfolio_value_eom)) {
    return { error: "Portfolio value must be a number." };
  }

  await upsertInvestmentMonth({
    month: inputValueToMonth(monthInput),
    contribution,
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
