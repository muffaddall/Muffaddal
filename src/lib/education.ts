import "server-only";
import { supabase } from "@/lib/supabase";
import type {
  CourseGradeValue,
  EduCourse,
  EduCourseGradeScale,
  EduSemester,
  EduSemesterStatus,
  GpaLetterGrade,
} from "@/lib/types";

type SemesterRow = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: EduSemesterStatus;
};

function semesterFromRow(row: SemesterRow): EduSemester {
  return {
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
  };
}

export async function getSemesters(): Promise<EduSemester[]> {
  const { data, error } = await supabase
    .from("edu_semesters")
    .select("*")
    .order("start_date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(semesterFromRow);
}

export async function getSemester(id: string): Promise<EduSemester | null> {
  const { data, error } = await supabase
    .from("edu_semesters")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? semesterFromRow(data) : null;
}

export async function addSemester(input: {
  name: string;
  startDate: string;
  endDate: string;
  status: EduSemesterStatus;
}): Promise<void> {
  const { error } = await supabase.from("edu_semesters").insert({
    name: input.name,
    start_date: input.startDate,
    end_date: input.endDate,
    status: input.status,
  });
  if (error) throw new Error(error.message);
}

export async function updateSemester(
  id: string,
  input: { name: string; startDate: string; endDate: string; status: EduSemesterStatus }
): Promise<void> {
  const { error } = await supabase
    .from("edu_semesters")
    .update({
      name: input.name,
      start_date: input.startDate,
      end_date: input.endDate,
      status: input.status,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteSemester(id: string): Promise<void> {
  const { error } = await supabase.from("edu_semesters").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

type CourseRow = {
  id: string;
  semester_id: string;
  name: string;
  course_code: string;
  credit_hours: number;
  instructor: string;
  room: string;
  current_letter_grade: CourseGradeValue | null;
  target_grade: GpaLetterGrade | null;
  sort_order: number;
};

function courseFromRow(row: CourseRow): EduCourse {
  return {
    id: row.id,
    semesterId: row.semester_id,
    name: row.name,
    courseCode: row.course_code,
    creditHours: row.credit_hours,
    instructor: row.instructor,
    room: row.room,
    currentLetterGrade: row.current_letter_grade,
    targetGrade: row.target_grade,
    sortOrder: row.sort_order,
  };
}

export async function getCoursesForSemester(semesterId: string): Promise<EduCourse[]> {
  const { data, error } = await supabase
    .from("edu_courses")
    .select("*")
    .eq("semester_id", semesterId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(courseFromRow);
}

/** Every course across every semester — used for cumulative GPA. */
export async function getAllCourses(): Promise<EduCourse[]> {
  const { data, error } = await supabase.from("edu_courses").select("*");
  if (error) throw new Error(error.message);
  return (data ?? []).map(courseFromRow);
}

export async function addCourse(input: {
  semesterId: string;
  name: string;
  courseCode: string;
  creditHours: number;
  instructor: string;
  room: string;
  currentLetterGrade: CourseGradeValue | null;
  targetGrade: GpaLetterGrade | null;
}): Promise<void> {
  const { count, error: countError } = await supabase
    .from("edu_courses")
    .select("id", { count: "exact", head: true })
    .eq("semester_id", input.semesterId);
  if (countError) throw new Error(countError.message);

  const { error } = await supabase.from("edu_courses").insert({
    semester_id: input.semesterId,
    name: input.name,
    course_code: input.courseCode,
    credit_hours: input.creditHours,
    instructor: input.instructor,
    room: input.room,
    current_letter_grade: input.currentLetterGrade,
    target_grade: input.targetGrade,
    sort_order: count ?? 0,
  });
  if (error) throw new Error(error.message);
}

export async function updateCourse(
  id: string,
  input: {
    name: string;
    courseCode: string;
    creditHours: number;
    instructor: string;
    room: string;
    currentLetterGrade: CourseGradeValue | null;
    targetGrade: GpaLetterGrade | null;
  }
): Promise<void> {
  const { error } = await supabase
    .from("edu_courses")
    .update({
      name: input.name,
      course_code: input.courseCode,
      credit_hours: input.creditHours,
      instructor: input.instructor,
      room: input.room,
      current_letter_grade: input.currentLetterGrade,
      target_grade: input.targetGrade,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteCourse(id: string): Promise<void> {
  const { error } = await supabase.from("edu_courses").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

type GradeScaleRow = {
  id: string;
  course_id: string;
  letter_grade: GpaLetterGrade;
  min_percent: number;
};

function gradeScaleFromRow(row: GradeScaleRow): EduCourseGradeScale {
  return {
    id: row.id,
    courseId: row.course_id,
    letterGrade: row.letter_grade,
    minPercent: row.min_percent,
  };
}

export async function getGradeScaleForCourse(courseId: string): Promise<EduCourseGradeScale[]> {
  const { data, error } = await supabase
    .from("edu_course_grade_scale")
    .select("*")
    .eq("course_id", courseId)
    .order("min_percent", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(gradeScaleFromRow);
}

export async function getGradeScalesForCourses(
  courseIds: string[]
): Promise<Map<string, EduCourseGradeScale[]>> {
  if (courseIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("edu_course_grade_scale")
    .select("*")
    .in("course_id", courseIds)
    .order("min_percent", { ascending: false });
  if (error) throw new Error(error.message);

  const byCourse = new Map<string, EduCourseGradeScale[]>();
  for (const row of (data ?? []).map(gradeScaleFromRow)) {
    const list = byCourse.get(row.courseId);
    if (list) list.push(row);
    else byCourse.set(row.courseId, [row]);
  }
  return byCourse;
}

/** Replaces a course's entire grade scale with exactly these entries. */
export async function setCourseGradeScale(
  courseId: string,
  entries: { letterGrade: GpaLetterGrade; minPercent: number }[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("edu_course_grade_scale")
    .delete()
    .eq("course_id", courseId);
  if (deleteError) throw new Error(deleteError.message);

  if (entries.length === 0) return;

  const { error: insertError } = await supabase.from("edu_course_grade_scale").insert(
    entries.map((e) => ({
      course_id: courseId,
      letter_grade: e.letterGrade,
      min_percent: e.minPercent,
    }))
  );
  if (insertError) throw new Error(insertError.message);
}
