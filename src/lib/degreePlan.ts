import "server-only";
import { supabase } from "@/lib/supabase";
import type { DegreePlanStatus, DegreePlanStatusRecord } from "@/lib/types";

type StatusRow = {
  course_id: string;
  status: DegreePlanStatus;
  planned_term: string | null;
};

function fromRow(row: StatusRow): DegreePlanStatusRecord {
  return { courseId: row.course_id, status: row.status, plannedTerm: row.planned_term };
}

export async function getDegreePlanStatuses(): Promise<Map<string, DegreePlanStatusRecord>> {
  const { data, error } = await supabase.from("edu_degree_plan_status").select("*");
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map(fromRow).map((r) => [r.courseId, r]));
}

export async function setDegreePlanStatus(input: {
  courseId: string;
  status: DegreePlanStatus;
  plannedTerm: string | null;
}): Promise<void> {
  const { error } = await supabase.from("edu_degree_plan_status").upsert(
    {
      course_id: input.courseId,
      status: input.status,
      planned_term: input.plannedTerm,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "course_id" }
  );
  if (error) throw new Error(error.message);
}
