import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import {
  getAssignmentsForCourses,
  getAttendanceForCourses,
  getCoursesForSemester,
  getExamsForCourses,
  getGradeCategoriesForCourses,
  getGradeEntriesForCategories,
  getGradeScalesForCourses,
  getMeetingsForCourses,
  getMilestonesForExams,
  getSemester,
  getTopicsForExams,
} from "@/lib/education";
import { computeGpa } from "@/lib/types";
import { formatDateShort } from "@/lib/date";
import CourseCard from "./CourseCard";
import AddCourseForm from "./AddCourseForm";

export const dynamic = "force-dynamic";

export default async function SemesterPage({
  params,
}: {
  params: Promise<{ semesterId: string }>;
}) {
  const { semesterId } = await params;
  const semester = await getSemester(semesterId);
  if (!semester) notFound();

  const courses = await getCoursesForSemester(semesterId);
  const courseIds = courses.map((c) => c.id);

  const scalesByCourse = await getGradeScalesForCourses(courseIds);
  const categoriesByCourse = await getGradeCategoriesForCourses(courseIds);
  const allCategoryIds = [...categoriesByCourse.values()].flat().map((c) => c.id);
  const entriesByCategory = await getGradeEntriesForCategories(allCategoryIds);
  const meetingsByCourse = await getMeetingsForCourses(courseIds);
  const assignmentsByCourse = await getAssignmentsForCourses(courseIds);
  const examsByCourse = await getExamsForCourses(courseIds);
  const allExamIds = [...examsByCourse.values()].flat().map((e) => e.id);
  const topicsByExam = await getTopicsForExams(allExamIds);
  const milestonesByExam = await getMilestonesForExams(allExamIds);
  const attendanceByCourse = await getAttendanceForCourses(courseIds);

  const gpa = computeGpa(courses);
  const totalCredits = courses.reduce((sum, c) => sum + c.creditHours, 0);

  return (
    <div className="pb-10">
      <PageHeader title={semester.name} subtitle="Education" />
      <main className="mx-auto max-w-2xl px-4 sm:px-6">
        <Link
          href="/education"
          className="inline-flex items-center gap-1 text-sm text-[var(--color-fg-dim)] hover:text-white/80 transition-colors mb-4"
        >
          ← Back to Education
        </Link>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
            <p className="text-xs mb-1" style={{ color: "var(--color-education)" }}>
              Semester GPA
            </p>
            <p className="font-display text-2xl">{gpa !== null ? gpa.toFixed(2) : "—"}</p>
          </div>
          <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4">
            <p className="text-xs mb-1" style={{ color: "var(--color-education)" }}>
              Credit hours
            </p>
            <p className="font-display text-2xl">{totalCredits}</p>
          </div>
        </div>

        <p className="text-xs text-[var(--color-fg-dim)] mb-6">
          {formatDateShort(semester.startDate)} – {formatDateShort(semester.endDate)}
        </p>

        <ul className="flex flex-col gap-2 mb-4">
          {courses.map((course) => {
            const categories = (categoriesByCourse.get(course.id) ?? []).map((cat) => ({
              ...cat,
              entries: entriesByCategory.get(cat.id) ?? [],
            }));
            const exams = (examsByCourse.get(course.id) ?? []).map((exam) => ({
              ...exam,
              topics: topicsByExam.get(exam.id) ?? [],
              milestones: milestonesByExam.get(exam.id) ?? [],
            }));
            return (
              <CourseCard
                key={course.id}
                course={course}
                scale={scalesByCourse.get(course.id) ?? []}
                semesterIsPast={semester.status === "past"}
                gradeCategories={categories}
                meetings={meetingsByCourse.get(course.id) ?? []}
                assignments={assignmentsByCourse.get(course.id) ?? []}
                exams={exams}
                attendance={attendanceByCourse.get(course.id) ?? []}
              />
            );
          })}
          {courses.length === 0 && (
            <li className="text-sm text-[var(--color-fg-dim)] py-6 text-center">
              No courses in this semester yet.
            </li>
          )}
        </ul>

        <AddCourseForm semesterId={semesterId} semesterIsPast={semester.status === "past"} />
      </main>
    </div>
  );
}
