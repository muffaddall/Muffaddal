import { CATEGORY_LABELS, type ExpenseCategory } from "@/lib/types";

const DOT_CLASS: Record<ExpenseCategory, string> = {
  recurring: "bg-[var(--color-cat-recurring)]",
  stoppable: "bg-[var(--color-cat-stoppable)]",
  installment: "bg-[var(--color-cat-installment)]",
  debt: "bg-[var(--color-cat-debt)]",
  savings: "bg-[var(--color-cat-savings)]",
  one_off: "bg-[var(--color-cat-one_off)]",
};

export default function CategoryBadge({ category }: { category: ExpenseCategory }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-fg-dim)]">
      <span className={`h-2 w-2 shrink-0 rounded-full ${DOT_CLASS[category]}`} />
      {CATEGORY_LABELS[category]}
    </span>
  );
}
