import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { getAllCourses, getDegreeRequirements, getSemesters } from "@/lib/education";
import { computeDegreeProgress, computeOnTrackStatus } from "@/lib/types";
import DegreeRequirementsList from "./DegreeRequirementsList";

export const dynamic = "force-dynamic";

export default async function DegreeRequirementsPage() {
  const [requirements, courses, semesters] = await Promise.all([
    getDegreeRequirements(),
    getAllCourses(),
    getSemesters(),
  ]);

  const progress = computeDegreeProgress(requirements);
  const remainingSemesters = semesters.filter((s) => s.status !== "past").length;
  const { onTrack, neededPerSemester } = computeOnTrackStatus(progress.remainingCredits, remainingSemesters);

  const courseOptions = courses.map((c) => ({
    id: c.id,
    label: c.courseCode ? `${c.name} (${c.courseCode})` : c.name,
  }));
  const courseNameById = Object.fromEntries(courses.map((c) => [c.id, c.name]));

  let onTrackText: string;
  let onTrackColor: string;
  if (onTrack === true) {
    onTrackText =
      progress.remainingCredits <= 0
        ? "All degree requirements complete!"
        : `On track — you need ~${neededPerSemester!.toFixed(1)} credits/semester across ${remainingSemesters} remaining semester${remainingSemesters === 1 ? "" : "s"}.`;
    onTrackColor = "var(--color-positive)";
  } else if (onTrack === false) {
    onTrackText = `Behind pace — you'd need ~${neededPerSemester!.toFixed(1)} credits/semester across ${remainingSemesters} remaining semester${remainingSemesters === 1 ? "" : "s"}, above a typical full load.`;
    onTrackColor = "var(--color-negative)";
  } else {
    onTrackText = "No upcoming/current semesters recorded yet, so pace can't be estimated.";
    onTrackColor = "var(--color-fg-dim)";
  }

  return (
    <div className="pb-10">
      <PageHeader title="Degree Requirements" subtitle="Education" />
      <main className="mx-auto max-w-2xl px-4 sm:px-6">
        <Link
          href="/education/degree"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-fg-dim)] hover:text-white/80 transition-colors mb-4"
        >
          ← Back to Degree Plan
        </Link>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
            <p className="text-xs mb-1" style={{ color: "var(--color-education)" }}>
              Credits completed
            </p>
            <p className="font-display text-2xl">
              {progress.completedCredits} / {progress.totalCredits}
            </p>
          </div>
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
            <p className="text-xs mb-1" style={{ color: "var(--color-education)" }}>
              Remaining
            </p>
            <p className="font-display text-2xl">{progress.remainingCredits}</p>
          </div>
        </div>

        <p className="text-sm font-medium mb-6" style={{ color: onTrackColor }}>
          {onTrackText}
        </p>

        <DegreeRequirementsList
          requirements={requirements}
          courseOptions={courseOptions}
          courseNameById={courseNameById}
        />
      </main>
    </div>
  );
}
