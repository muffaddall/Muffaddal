import "server-only";
import { supabase } from "@/lib/supabase";
import type {
  AssignmentStatus,
  AttendanceStatus,
  CourseGradeValue,
  DegreeRequirementStatus,
  EduAssignment,
  EduAttendanceRecord,
  EduCourse,
  EduCourseGradeScale,
  EduCourseMeeting,
  EduDegreeRequirement,
  EduExam,
  EduExamTopic,
  EduGradeCategory,
  EduGradeEntry,
  EduSemester,
  EduSemesterStatus,
  EduStudyMilestone,
  ExamType,
  GpaLetterGrade,
} from "@/lib/types";
import { DEFAULT_STUDY_MILESTONES } from "@/lib/types";

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
  attendance_threshold_percent: number | null;
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
    attendanceThresholdPercent: row.attendance_threshold_percent,
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

/** Courses in whichever semester(s) are currently marked "current" — used for homepage quick-add. */
export async function getCurrentCourses(): Promise<EduCourse[]> {
  const { data: semesters, error: semError } = await supabase
    .from("edu_semesters")
    .select("id")
    .eq("status", "current");
  if (semError) throw new Error(semError.message);
  const semesterIds = (semesters ?? []).map((s) => s.id as string);
  if (semesterIds.length === 0) return [];

  const { data, error } = await supabase.from("edu_courses").select("*").in("semester_id", semesterIds);
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
    attendanceThresholdPercent?: number | null;
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
      ...(input.attendanceThresholdPercent !== undefined
        ? { attendance_threshold_percent: input.attendanceThresholdPercent }
        : {}),
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

// ---- Phase 7 data: weekly class meetings ----

type MeetingRow = {
  id: string;
  course_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

function meetingFromRow(row: MeetingRow): EduCourseMeeting {
  return {
    id: row.id,
    courseId: row.course_id,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
  };
}

export async function getMeetingsForCourse(courseId: string): Promise<EduCourseMeeting[]> {
  const { data, error } = await supabase
    .from("edu_course_meetings")
    .select("*")
    .eq("course_id", courseId)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(meetingFromRow);
}

export async function getMeetingsForCourses(courseIds: string[]): Promise<Map<string, EduCourseMeeting[]>> {
  if (courseIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("edu_course_meetings")
    .select("*")
    .in("course_id", courseIds)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw new Error(error.message);
  const byCourse = new Map<string, EduCourseMeeting[]>();
  for (const row of (data ?? []).map(meetingFromRow)) {
    const list = byCourse.get(row.courseId);
    if (list) list.push(row);
    else byCourse.set(row.courseId, [row]);
  }
  return byCourse;
}

export async function addMeeting(input: {
  courseId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}): Promise<void> {
  const { error } = await supabase.from("edu_course_meetings").insert({
    course_id: input.courseId,
    day_of_week: input.dayOfWeek,
    start_time: input.startTime,
    end_time: input.endTime,
  });
  if (error) throw new Error(error.message);
}

export async function deleteMeeting(id: string): Promise<void> {
  const { error } = await supabase.from("edu_course_meetings").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- Phase 2 data: grade categories + entries ----

type GradeCategoryRow = {
  id: string;
  course_id: string;
  name: string;
  weight: number;
  sort_order: number;
};

function gradeCategoryFromRow(row: GradeCategoryRow): EduGradeCategory {
  return { id: row.id, courseId: row.course_id, name: row.name, weight: row.weight, sortOrder: row.sort_order };
}

export async function getGradeCategoriesForCourse(courseId: string): Promise<EduGradeCategory[]> {
  const { data, error } = await supabase
    .from("edu_grade_categories")
    .select("*")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(gradeCategoryFromRow);
}

export async function getGradeCategoriesForCourses(courseIds: string[]): Promise<Map<string, EduGradeCategory[]>> {
  if (courseIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("edu_grade_categories")
    .select("*")
    .in("course_id", courseIds)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const byCourse = new Map<string, EduGradeCategory[]>();
  for (const row of (data ?? []).map(gradeCategoryFromRow)) {
    const list = byCourse.get(row.courseId);
    if (list) list.push(row);
    else byCourse.set(row.courseId, [row]);
  }
  return byCourse;
}

export async function addGradeCategory(input: { courseId: string; name: string; weight: number }): Promise<void> {
  const { count, error: countError } = await supabase
    .from("edu_grade_categories")
    .select("id", { count: "exact", head: true })
    .eq("course_id", input.courseId);
  if (countError) throw new Error(countError.message);

  const { error } = await supabase.from("edu_grade_categories").insert({
    course_id: input.courseId,
    name: input.name,
    weight: input.weight,
    sort_order: count ?? 0,
  });
  if (error) throw new Error(error.message);
}

export async function updateGradeCategory(id: string, input: { name: string; weight: number }): Promise<void> {
  const { error } = await supabase
    .from("edu_grade_categories")
    .update({ name: input.name, weight: input.weight })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteGradeCategory(id: string): Promise<void> {
  const { error } = await supabase.from("edu_grade_categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

type GradeEntryRow = {
  id: string;
  category_id: string;
  name: string;
  score: number;
  max_score: number;
  sort_order: number;
};

function gradeEntryFromRow(row: GradeEntryRow): EduGradeEntry {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    score: row.score,
    maxScore: row.max_score,
    sortOrder: row.sort_order,
  };
}

export async function getGradeEntriesForCategories(categoryIds: string[]): Promise<Map<string, EduGradeEntry[]>> {
  if (categoryIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("edu_grade_entries")
    .select("*")
    .in("category_id", categoryIds)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const byCategory = new Map<string, EduGradeEntry[]>();
  for (const row of (data ?? []).map(gradeEntryFromRow)) {
    const list = byCategory.get(row.categoryId);
    if (list) list.push(row);
    else byCategory.set(row.categoryId, [row]);
  }
  return byCategory;
}

export async function addGradeEntry(input: {
  categoryId: string;
  name: string;
  score: number;
  maxScore: number;
}): Promise<void> {
  const { count, error: countError } = await supabase
    .from("edu_grade_entries")
    .select("id", { count: "exact", head: true })
    .eq("category_id", input.categoryId);
  if (countError) throw new Error(countError.message);

  const { error } = await supabase.from("edu_grade_entries").insert({
    category_id: input.categoryId,
    name: input.name,
    score: input.score,
    max_score: input.maxScore,
    sort_order: count ?? 0,
  });
  if (error) throw new Error(error.message);
}

export async function deleteGradeEntry(id: string): Promise<void> {
  const { error } = await supabase.from("edu_grade_entries").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- Phase 3 data: assignments ----

type AssignmentRow = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  due_date: string;
  status: AssignmentStatus;
};

function assignmentFromRow(row: AssignmentRow): EduAssignment {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    status: row.status,
  };
}

export async function getAssignmentsForCourse(courseId: string): Promise<EduAssignment[]> {
  const { data, error } = await supabase
    .from("edu_assignments")
    .select("*")
    .eq("course_id", courseId)
    .order("due_date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(assignmentFromRow);
}

export async function getAssignmentsForCourses(courseIds: string[]): Promise<Map<string, EduAssignment[]>> {
  if (courseIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("edu_assignments")
    .select("*")
    .in("course_id", courseIds)
    .order("due_date", { ascending: true });
  if (error) throw new Error(error.message);
  const byCourse = new Map<string, EduAssignment[]>();
  for (const row of (data ?? []).map(assignmentFromRow)) {
    const list = byCourse.get(row.courseId);
    if (list) list.push(row);
    else byCourse.set(row.courseId, [row]);
  }
  return byCourse;
}

/** Every assignment across every course, sorted by due date — the combined view. */
export async function getAllAssignments(): Promise<EduAssignment[]> {
  const { data, error } = await supabase.from("edu_assignments").select("*").order("due_date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(assignmentFromRow);
}

export async function addAssignment(input: {
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  status: AssignmentStatus;
}): Promise<void> {
  const { error } = await supabase.from("edu_assignments").insert({
    course_id: input.courseId,
    title: input.title,
    description: input.description,
    due_date: input.dueDate,
    status: input.status,
  });
  if (error) throw new Error(error.message);
}

export async function updateAssignment(
  id: string,
  input: { title: string; description: string; dueDate: string; status: AssignmentStatus }
): Promise<void> {
  const { error } = await supabase
    .from("edu_assignments")
    .update({
      title: input.title,
      description: input.description,
      due_date: input.dueDate,
      status: input.status,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setAssignmentStatus(id: string, status: AssignmentStatus): Promise<void> {
  const { error } = await supabase.from("edu_assignments").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteAssignment(id: string): Promise<void> {
  const { error } = await supabase.from("edu_assignments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- Phase 4 data: exams/quizzes + study schedule ----

type ExamRow = {
  id: string;
  course_id: string;
  title: string;
  type: ExamType;
  exam_date: string;
};

function examFromRow(row: ExamRow): EduExam {
  return { id: row.id, courseId: row.course_id, title: row.title, type: row.type, examDate: row.exam_date };
}

export async function getExamsForCourse(courseId: string): Promise<EduExam[]> {
  const { data, error } = await supabase
    .from("edu_exams")
    .select("*")
    .eq("course_id", courseId)
    .order("exam_date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(examFromRow);
}

export async function getExamsForCourses(courseIds: string[]): Promise<Map<string, EduExam[]>> {
  if (courseIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("edu_exams")
    .select("*")
    .in("course_id", courseIds)
    .order("exam_date", { ascending: true });
  if (error) throw new Error(error.message);
  const byCourse = new Map<string, EduExam[]>();
  for (const row of (data ?? []).map(examFromRow)) {
    const list = byCourse.get(row.courseId);
    if (list) list.push(row);
    else byCourse.set(row.courseId, [row]);
  }
  return byCourse;
}

/** Every exam/quiz across every course, sorted by date — used for the this-week dashboard. */
export async function getAllExams(): Promise<EduExam[]> {
  const { data, error } = await supabase.from("edu_exams").select("*").order("exam_date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(examFromRow);
}

export type UpcomingExam = EduExam & { courseName: string; topicsDone: number; topicsTotal: number };

/** Exams/quizzes with exam_date in [fromDate, toDate], with course name + topic checklist progress — powers the "This week" dashboard on /education. */
export async function getUpcomingExamsWithChecklist(fromDate: string, toDate: string): Promise<UpcomingExam[]> {
  const { data, error } = await supabase
    .from("edu_exams")
    .select("*")
    .gte("exam_date", fromDate)
    .lte("exam_date", toDate)
    .order("exam_date", { ascending: true });
  if (error) throw new Error(error.message);
  const exams = (data ?? []).map(examFromRow);
  if (exams.length === 0) return [];

  const courseIds = [...new Set(exams.map((e) => e.courseId))];
  const courseNameById = await getCourseNamesById(courseIds);
  const topicsByExam = await getTopicsForExams(exams.map((e) => e.id));

  return exams.map((exam) => {
    const topics = topicsByExam.get(exam.id) ?? [];
    return {
      ...exam,
      courseName: courseNameById.get(exam.courseId) ?? "",
      topicsDone: topics.filter((t) => t.done).length,
      topicsTotal: topics.length,
    };
  });
}

/** Creates the exam and seeds it with the default study milestones (editable/removable afterward). */
export async function addExam(input: {
  courseId: string;
  title: string;
  type: ExamType;
  examDate: string;
  topics: string[];
}): Promise<void> {
  const { data, error } = await supabase
    .from("edu_exams")
    .insert({ course_id: input.courseId, title: input.title, type: input.type, exam_date: input.examDate })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  const examId = data.id as string;

  if (input.topics.length > 0) {
    const { error: topicsError } = await supabase.from("edu_exam_topics").insert(
      input.topics.map((label, i) => ({ exam_id: examId, label, sort_order: i }))
    );
    if (topicsError) throw new Error(topicsError.message);
  }

  const { error: milestonesError } = await supabase.from("edu_study_milestones").insert(
    DEFAULT_STUDY_MILESTONES.map((m, i) => ({
      exam_id: examId,
      label: m.label,
      offset_days: m.offsetDays,
      sort_order: i,
    }))
  );
  if (milestonesError) throw new Error(milestonesError.message);
}

export async function deleteExam(id: string): Promise<void> {
  const { error } = await supabase.from("edu_exams").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

type ExamTopicRow = { id: string; exam_id: string; label: string; done: boolean; sort_order: number };

function examTopicFromRow(row: ExamTopicRow): EduExamTopic {
  return { id: row.id, examId: row.exam_id, label: row.label, done: row.done, sortOrder: row.sort_order };
}

export async function getTopicsForExams(examIds: string[]): Promise<Map<string, EduExamTopic[]>> {
  if (examIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("edu_exam_topics")
    .select("*")
    .in("exam_id", examIds)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  const byExam = new Map<string, EduExamTopic[]>();
  for (const row of (data ?? []).map(examTopicFromRow)) {
    const list = byExam.get(row.examId);
    if (list) list.push(row);
    else byExam.set(row.examId, [row]);
  }
  return byExam;
}

export async function addExamTopic(examId: string, label: string): Promise<void> {
  const { count, error: countError } = await supabase
    .from("edu_exam_topics")
    .select("id", { count: "exact", head: true })
    .eq("exam_id", examId);
  if (countError) throw new Error(countError.message);
  const { error } = await supabase
    .from("edu_exam_topics")
    .insert({ exam_id: examId, label, sort_order: count ?? 0 });
  if (error) throw new Error(error.message);
}

export async function setExamTopicDone(id: string, done: boolean): Promise<void> {
  const { error } = await supabase.from("edu_exam_topics").update({ done }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteExamTopic(id: string): Promise<void> {
  const { error } = await supabase.from("edu_exam_topics").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

type StudyMilestoneRow = {
  id: string;
  exam_id: string;
  label: string;
  offset_days: number;
  done: boolean;
  sort_order: number;
};

function studyMilestoneFromRow(row: StudyMilestoneRow): EduStudyMilestone {
  return {
    id: row.id,
    examId: row.exam_id,
    label: row.label,
    offsetDays: row.offset_days,
    done: row.done,
    sortOrder: row.sort_order,
  };
}

export async function getMilestonesForExams(examIds: string[]): Promise<Map<string, EduStudyMilestone[]>> {
  if (examIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("edu_study_milestones")
    .select("*")
    .in("exam_id", examIds)
    .order("offset_days", { ascending: false });
  if (error) throw new Error(error.message);
  const byExam = new Map<string, EduStudyMilestone[]>();
  for (const row of (data ?? []).map(studyMilestoneFromRow)) {
    const list = byExam.get(row.examId);
    if (list) list.push(row);
    else byExam.set(row.examId, [row]);
  }
  return byExam;
}

export async function addMilestone(input: { examId: string; label: string; offsetDays: number }): Promise<void> {
  const { count, error: countError } = await supabase
    .from("edu_study_milestones")
    .select("id", { count: "exact", head: true })
    .eq("exam_id", input.examId);
  if (countError) throw new Error(countError.message);
  const { error } = await supabase.from("edu_study_milestones").insert({
    exam_id: input.examId,
    label: input.label,
    offset_days: input.offsetDays,
    sort_order: count ?? 0,
  });
  if (error) throw new Error(error.message);
}

export async function setMilestoneDone(id: string, done: boolean): Promise<void> {
  const { error } = await supabase.from("edu_study_milestones").update({ done }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteMilestone(id: string): Promise<void> {
  const { error } = await supabase.from("edu_study_milestones").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- Phase 5 data: attendance ----

type AttendanceRow = { id: string; course_id: string; date: string; status: AttendanceStatus };

function attendanceFromRow(row: AttendanceRow): EduAttendanceRecord {
  return { id: row.id, courseId: row.course_id, date: row.date, status: row.status };
}

export async function getAttendanceForCourse(courseId: string): Promise<EduAttendanceRecord[]> {
  const { data, error } = await supabase
    .from("edu_attendance")
    .select("*")
    .eq("course_id", courseId)
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(attendanceFromRow);
}

export async function getAttendanceForCourses(courseIds: string[]): Promise<Map<string, EduAttendanceRecord[]>> {
  if (courseIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("edu_attendance")
    .select("*")
    .in("course_id", courseIds)
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  const byCourse = new Map<string, EduAttendanceRecord[]>();
  for (const row of (data ?? []).map(attendanceFromRow)) {
    const list = byCourse.get(row.courseId);
    if (list) list.push(row);
    else byCourse.set(row.courseId, [row]);
  }
  return byCourse;
}

/** One row per (course, date) — logging the same date again overwrites the status, so the homepage's one-tap "Attended" is idempotent. */
export async function logAttendance(input: {
  courseId: string;
  date: string;
  status: AttendanceStatus;
}): Promise<void> {
  const { error } = await supabase
    .from("edu_attendance")
    .upsert(
      { course_id: input.courseId, date: input.date, status: input.status },
      { onConflict: "course_id,date" }
    );
  if (error) throw new Error(error.message);
}

export async function deleteAttendance(id: string): Promise<void> {
  const { error } = await supabase.from("edu_attendance").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- Phase 6 data: degree requirements ----

type DegreeRequirementRow = {
  id: string;
  category: string;
  name: string;
  credit_hours: number;
  status: DegreeRequirementStatus;
  fulfilled_by_course_id: string | null;
  sort_order: number;
};

function degreeRequirementFromRow(row: DegreeRequirementRow): EduDegreeRequirement {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    creditHours: row.credit_hours,
    status: row.status,
    fulfilledByCourseId: row.fulfilled_by_course_id,
    sortOrder: row.sort_order,
  };
}

export async function getDegreeRequirements(): Promise<EduDegreeRequirement[]> {
  const { data, error } = await supabase
    .from("edu_degree_requirements")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(degreeRequirementFromRow);
}

export async function addDegreeRequirement(input: {
  category: string;
  name: string;
  creditHours: number;
  status: DegreeRequirementStatus;
  fulfilledByCourseId: string | null;
}): Promise<void> {
  const { count, error: countError } = await supabase
    .from("edu_degree_requirements")
    .select("id", { count: "exact", head: true });
  if (countError) throw new Error(countError.message);

  const { error } = await supabase.from("edu_degree_requirements").insert({
    category: input.category,
    name: input.name,
    credit_hours: input.creditHours,
    status: input.status,
    fulfilled_by_course_id: input.fulfilledByCourseId,
    sort_order: count ?? 0,
  });
  if (error) throw new Error(error.message);
}

export async function updateDegreeRequirement(
  id: string,
  input: {
    category: string;
    name: string;
    creditHours: number;
    status: DegreeRequirementStatus;
    fulfilledByCourseId: string | null;
  }
): Promise<void> {
  const { error } = await supabase
    .from("edu_degree_requirements")
    .update({
      category: input.category,
      name: input.name,
      credit_hours: input.creditHours,
      status: input.status,
      fulfilled_by_course_id: input.fulfilledByCourseId,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteDegreeRequirement(id: string): Promise<void> {
  const { error } = await supabase.from("edu_degree_requirements").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- Phase 7 data: homepage "Today" view ----

export type TodayClass = {
  courseId: string;
  courseName: string;
  room: string;
  startTime: string;
  endTime: string;
  attendedToday: boolean;
};

/** Today's classes for the current semester's courses, filtered to today's day of week and sorted by start time. */
export async function getTodaysClasses(todayDate: string, dayOfWeek: number): Promise<TodayClass[]> {
  const { data: semesters, error: semError } = await supabase
    .from("edu_semesters")
    .select("id")
    .eq("status", "current");
  if (semError) throw new Error(semError.message);
  const semesterIds = (semesters ?? []).map((s) => s.id as string);
  if (semesterIds.length === 0) return [];

  const { data: courses, error: coursesError } = await supabase
    .from("edu_courses")
    .select("id, name, room")
    .in("semester_id", semesterIds);
  if (coursesError) throw new Error(coursesError.message);
  const courseById = new Map((courses ?? []).map((c) => [c.id as string, c]));
  const courseIds = (courses ?? []).map((c) => c.id as string);
  if (courseIds.length === 0) return [];

  const { data: meetings, error: meetingsError } = await supabase
    .from("edu_course_meetings")
    .select("*")
    .in("course_id", courseIds)
    .eq("day_of_week", dayOfWeek)
    .order("start_time", { ascending: true });
  if (meetingsError) throw new Error(meetingsError.message);

  const { data: attendance, error: attendanceError } = await supabase
    .from("edu_attendance")
    .select("course_id, status")
    .in("course_id", courseIds)
    .eq("date", todayDate);
  if (attendanceError) throw new Error(attendanceError.message);
  const attendedToday = new Set(
    (attendance ?? []).filter((a) => a.status === "attended").map((a) => a.course_id as string)
  );

  return (meetings ?? []).map((m) => {
    const course = courseById.get(m.course_id as string);
    return {
      courseId: m.course_id as string,
      courseName: course?.name ?? "",
      room: course?.room ?? "",
      startTime: (m.start_time as string).slice(0, 5),
      endTime: (m.end_time as string).slice(0, 5),
      attendedToday: attendedToday.has(m.course_id as string),
    };
  });
}

export type TodayDeadline = {
  kind: "assignment" | "exam" | "quiz";
  id: string;
  courseId: string;
  courseName: string;
  title: string;
};

/** Assignments due today + exams/quizzes today, across every course. */
export async function getTodaysDeadlines(todayDate: string): Promise<TodayDeadline[]> {
  const [{ data: assignments, error: aError }, { data: exams, error: eError }] = await Promise.all([
    supabase.from("edu_assignments").select("id, course_id, title").eq("due_date", todayDate),
    supabase.from("edu_exams").select("id, course_id, title, type").eq("exam_date", todayDate),
  ]);
  if (aError) throw new Error(aError.message);
  if (eError) throw new Error(eError.message);

  const courseIds = [...new Set([...(assignments ?? []), ...(exams ?? [])].map((r) => r.course_id as string))];
  const courseNameById = await getCourseNamesById(courseIds);

  const out: TodayDeadline[] = [];
  for (const a of assignments ?? []) {
    out.push({
      kind: "assignment",
      id: a.id as string,
      courseId: a.course_id as string,
      courseName: courseNameById.get(a.course_id as string) ?? "",
      title: a.title as string,
    });
  }
  for (const e of exams ?? []) {
    out.push({
      kind: e.type === "quiz" ? "quiz" : "exam",
      id: e.id as string,
      courseId: e.course_id as string,
      courseName: courseNameById.get(e.course_id as string) ?? "",
      title: e.title as string,
    });
  }
  return out;
}

export type WeekItem = {
  kind: "assignment" | "exam" | "quiz";
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  date: string;
};

/** Assignments/exams/quizzes due in [fromDate, toDate] inclusive, across every course, sorted by date. */
export async function getUpcomingWeekItems(fromDate: string, toDate: string): Promise<WeekItem[]> {
  const [{ data: assignments, error: aError }, { data: exams, error: eError }] = await Promise.all([
    supabase.from("edu_assignments").select("id, course_id, title, due_date").gte("due_date", fromDate).lte("due_date", toDate),
    supabase.from("edu_exams").select("id, course_id, title, type, exam_date").gte("exam_date", fromDate).lte("exam_date", toDate),
  ]);
  if (aError) throw new Error(aError.message);
  if (eError) throw new Error(eError.message);

  const courseIds = [...new Set([...(assignments ?? []), ...(exams ?? [])].map((r) => r.course_id as string))];
  const courseNameById = await getCourseNamesById(courseIds);

  const out: WeekItem[] = [];
  for (const a of assignments ?? []) {
    out.push({
      kind: "assignment",
      id: a.id as string,
      courseId: a.course_id as string,
      courseName: courseNameById.get(a.course_id as string) ?? "",
      title: a.title as string,
      date: a.due_date as string,
    });
  }
  for (const e of exams ?? []) {
    out.push({
      kind: e.type === "quiz" ? "quiz" : "exam",
      id: e.id as string,
      courseId: e.course_id as string,
      courseName: courseNameById.get(e.course_id as string) ?? "",
      title: e.title as string,
      date: e.exam_date as string,
    });
  }
  out.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}

async function getCourseNamesById(courseIds: string[]): Promise<Map<string, string>> {
  if (courseIds.length === 0) return new Map();
  const { data, error } = await supabase.from("edu_courses").select("id, name").in("id", courseIds);
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((c) => [c.id as string, c.name as string]));
}
