import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";

export default function CMinusCPage() {
  return (
    <div className="pb-10">
      <PageHeader title="C- C" subtitle="Tournament" />
      <main className="mx-auto max-w-xl px-4 sm:px-6">
        <EmptyState label="Nothing here yet." />
      </main>
    </div>
  );
}
