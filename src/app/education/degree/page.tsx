import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { getDegreePlanStatuses } from "@/lib/degreePlan";
import { DEGREE_PLAN_COURSES } from "@/lib/degreePlanCatalog";
import RoadmapDiagram from "./RoadmapDiagram";

export const dynamic = "force-dynamic";

export default async function DegreePlanPage() {
  const statusMap = await getDegreePlanStatuses();
  const statuses = Object.fromEntries(statusMap);

  const totalCredits = DEGREE_PLAN_COURSES.reduce((sum, c) => sum + c.credits, 0);
  const completedCredits = DEGREE_PLAN_COURSES.filter((c) => (statuses[c.id]?.status ?? "planned") === "completed").reduce(
    (sum, c) => sum + c.credits,
    0
  );
  const ongoingCredits = DEGREE_PLAN_COURSES.filter((c) => statuses[c.id]?.status === "ongoing").reduce(
    (sum, c) => sum + c.credits,
    0
  );

  return (
    <div className="pb-10">
      <PageHeader title="Degree Plan" subtitle="Education" />
      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <Link
            href="/education"
            className="inline-flex items-center gap-1 text-sm text-[var(--color-fg-dim)] hover:text-white/80 transition-colors"
          >
            ← Back to Education
          </Link>
          <Link
            href="/education/degree/requirements"
            className="text-sm font-semibold hover:opacity-80"
            style={{ color: "var(--color-education)" }}
          >
            Degree Requirements Checklist →
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-center">
            <p className="text-sm font-bold uppercase tracking-wide mb-1" style={{ color: "var(--color-education)" }}>
              Completed
            </p>
            <p className="font-display text-2xl">{completedCredits} cr</p>
          </div>
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-center">
            <p className="text-sm font-bold uppercase tracking-wide mb-1" style={{ color: "var(--color-education)" }}>
              Ongoing
            </p>
            <p className="font-display text-2xl">{ongoingCredits} cr</p>
          </div>
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-center">
            <p className="text-sm font-bold uppercase tracking-wide mb-1" style={{ color: "var(--color-education)" }}>
              Total
            </p>
            <p className="font-display text-2xl">{totalCredits} cr</p>
          </div>
        </div>

        <p className="text-sm text-white/60 mb-4">
          Tap any course to mark it Completed, Ongoing, or Planned — and pick which term you plan to take it.
        </p>

        <RoadmapDiagram statuses={statuses} />
      </main>
    </div>
  );
}
