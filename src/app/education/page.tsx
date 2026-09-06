import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { getAllCourses, getSemesters, getUpcomingExamsWithChecklist } from "@/lib/education";
import { computeGpa, daysUntil } from "@/lib/types";
import { formatDateShort, shiftDate, todayStr } from "@/lib/date";
import SemesterRow from "./SemesterRow";
import AddSemesterForm from "./AddSemesterForm";

export const dynamic = "force-dynamic";

export default async function EducationPage() {
  const today = todayStr();
  const [semesters, allCourses, upcomingExams] = await Promise.all([
    getSemesters(),
    getAllCourses(),
    getUpcomingExamsWithChecklist(today, shiftDate(today, 14)),
  ]);

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
        <div className="mb-6 flex gap-2">
          <Link
            href="/education/assignments"
            className="flex-1 text-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-2.5 text-sm font-medium hover:bg-white/5"
          >
            Assignments
          </Link>
          <Link
            href="/education/degree"
            className="flex-1 text-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-2.5 text-sm font-medium hover:bg-white/5"
          >
            Degree plan
          </Link>
        </div>

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

        {upcomingExams.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-education)" }}>
              This week
            </h2>
            <ul className="flex flex-col gap-2">
              {upcomingExams.map((exam) => {
                const remaining = daysUntil(exam.examDate, today);
                return (
                  <li
                    key={exam.id}
                    className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {exam.title}{" "}
                        <span className="text-white/40 font-normal">
                          · {exam.type === "quiz" ? "Quiz" : "Exam"} · {exam.courseName}
                        </span>
                      </p>
                      <p className="text-xs text-[var(--color-fg-dim)]">
                        {formatDateShort(exam.examDate)} · {remaining} day{remaining === 1 ? "" : "s"} away
                        {exam.topicsTotal > 0 && ` · ${exam.topicsDone}/${exam.topicsTotal} topics studied`}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

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
