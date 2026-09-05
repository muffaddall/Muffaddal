import { PageHeader } from "@/components/PageHeader";
import { getAllCourses, getSemesters } from "@/lib/education";
import { computeGpa } from "@/lib/types";
import SemesterRow from "./SemesterRow";
import AddSemesterForm from "./AddSemesterForm";

export const dynamic = "force-dynamic";

export default async function EducationPage() {
  const [semesters, allCourses] = await Promise.all([getSemesters(), getAllCourses()]);

  const coursesBySemester = new Map<string, typeof allCourses>();
  for (const course of allCourses) {
    const list = coursesBySemester.get(course.semesterId);
    if (list) list.push(course);
    else coursesBySemester.set(course.semesterId, [course]);
  }

  const cumulativeGpa = computeGpa(allCourses);
  const totalCredits = allCourses.reduce((sum, c) => sum + c.creditHours, 0);

  return (
    <div className="pb-10">
      <PageHeader title="Education" />
      <main className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="mb-8 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-6 text-center">
          <p className="text-xs mb-1" style={{ color: "var(--color-education)" }}>
            Cumulative GPA
          </p>
          <p className="font-display text-5xl">
            {cumulativeGpa !== null ? cumulativeGpa.toFixed(2) : "—"}
          </p>
          <p className="text-xs text-[var(--color-fg-dim)] mt-2">
            {totalCredits} credit hour{totalCredits === 1 ? "" : "s"} graded so far
          </p>
        </div>

        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-education)" }}>
          Semesters
        </h2>
        <ul className="flex flex-col gap-2 mb-4">
          {semesters.map((semester) => {
            const courses = coursesBySemester.get(semester.id) ?? [];
            const gpa = computeGpa(courses);
            return (
              <SemesterRow
                key={semester.id}
                semester={semester}
                courseCount={courses.length}
                gpa={gpa}
              />
            );
          })}
          {semesters.length === 0 && (
            <li className="text-sm text-[var(--color-fg-dim)] py-6 text-center">
              No semesters yet.
            </li>
          )}
        </ul>

        <AddSemesterForm />
      </main>
    </div>
  );
}
