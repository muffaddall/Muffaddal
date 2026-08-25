export const EXPENSE_CATEGORIES = [
  "recurring",
  "stoppable",
  "installment",
  "debt",
  "one_off",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  recurring: "Recurring every month",
  stoppable: "Recurring but can be stopped",
  installment: "Monthly installment",
  debt: "Debt paying back",
  one_off: "One-off",
};

export type ExpenseEntry = {
  id: string;
  month: string; // yyyy-mm-01
  date_label: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  sort_order: number;
};

export type MonthlyIncome = {
  month: string;
  income: number;
};

export type InvestmentMonth = {
  month: string;
  contribution: number;
  portfolio_value_eom: number | null;
};

export type InvestmentMonthComputed = InvestmentMonth & {
  total_invested: number;
  growth_pct: number | null;
  pnl_pct: number | null;
  dollar_pl: number | null;
};

export type Debt = {
  id: string;
  name: string;
  amount: number;
  created_at: string;
};

export type SavingsMonth = {
  month: string;
  debt_paydown: number;
  big_payment: number;
  savings_kept: number;
  money_kept: number;
};

export type SavingsMonthComputed = SavingsMonth & {
  debt_owed_start: number;
  debt_left: number;
  total_savings: number;
  account_total: number;
};
