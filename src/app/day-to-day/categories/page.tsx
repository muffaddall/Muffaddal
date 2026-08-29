import { PageHeader } from "@/components/PageHeader";
import { FinanceSectionTabs } from "@/components/FinanceSectionTabs";
import { getDdCategories } from "@/lib/ddCategories";
import { buildCategoryTree, type DdCategoryKind } from "@/lib/types";
import CategoryKindTabs from "./CategoryKindTabs";
import CategoryNode from "./CategoryNode";
import AddCategoryForm from "./AddCategoryForm";

export const dynamic = "force-dynamic";

export default async function DdCategoriesPage(
  props: PageProps<"/day-to-day/categories">
) {
  const searchParams = await props.searchParams;
  const kind: DdCategoryKind = searchParams.kind === "income" ? "income" : "expense";

  const categories = await getDdCategories(kind);
  const tree = buildCategoryTree(categories);

  return (
    <div className="pb-10">
      <PageHeader title="Categories" subtitle="Day-to-Day Expenses" />
      <div className="flex justify-center mb-4">
        <FinanceSectionTabs active="day-to-day" />
      </div>
      <main className="mx-auto max-w-2xl px-4 sm:px-6">
        <CategoryKindTabs active={kind} />

        <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          {tree.length === 0 ? (
            <p className="text-sm text-[var(--color-fg-dim)] text-center py-4">
              No categories yet.
            </p>
          ) : (
            tree.map((node) => <CategoryNode key={node.id} node={node} kind={kind} depth={0} />)
          )}
        </div>

        <div className="mt-4">
          <AddCategoryForm kind={kind} parentId={null} label="Add top-level category" />
        </div>
      </main>
    </div>
  );
}
