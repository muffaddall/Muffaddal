import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { getCurrentCourses } from "@/lib/education";
import QuickAddForm from "./QuickAddForm";

export const dynamic = "force-dynamic";

const TITLES: Record<string, string> = {
  assignment: "Add Assignment",
  quiz: "Add Quiz",
  exam: "Add Exam",
};

export default async function QuickAddPage({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (kind !== "assignment" && kind !== "quiz" && kind !== "exam") notFound();

  const courses = await getCurrentCourses();
  const courseOptions = courses.map((c) => ({
    id: c.id,
    label: c.courseCode ? `${c.name} (${c.courseCode})` : c.name,
  }));

  return (
    <div className="pb-10">
      <PageHeader title={TITLES[kind]} subtitle="Quick Add" />
      <main className="mx-auto max-w-md px-4 sm:px-6">
        <QuickAddForm kind={kind} courseOptions={courseOptions} />
      </main>
    </div>
  );
}
