import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { getAllAssignments, getAllCourses } from "@/lib/education";
import AssignmentsList from "./AssignmentsList";

export const dynamic = "force-dynamic";

export default async function AssignmentsPage() {
  const [assignments, courses] = await Promise.all([getAllAssignments(), getAllCourses()]);
  const courseOptions = courses.map((c) => ({ id: c.id, label: c.courseCode ? `${c.name} (${c.courseCode})` : c.name }));
  const courseNameById = new Map(courses.map((c) => [c.id, c.name]));

  return (
    <div className="pb-10">
      <PageHeader title="Assignments" subtitle="Education" />
      <main className="mx-auto max-w-2xl px-4 sm:px-6">
        <Link
          href="/education"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-fg-dim)] hover:text-white/80 transition-colors mb-4"
        >
          ← Back to Education
        </Link>

        <AssignmentsList assignments={assignments} courseNameById={Object.fromEntries(courseNameById)} courseOptions={courseOptions} />
      </main>
    </div>
  );
}
