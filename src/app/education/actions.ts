"use server";

import { revalidatePath } from "next/cache";
import {
  addAssignment,
  addCourse,
  addDegreeRequirement,
  addExam,
  addExamTopic,
  addGradeCategory,
  addGradeEntry,
  addMeeting,
  addMilestone,
  addSemester,
  deleteAssignment,
  deleteCourse,
  deleteDegreeRequirement,
  deleteExam,
  deleteExamTopic,
  deleteGradeCategory,
  deleteGradeEntry,
  deleteMeeting,
  deleteMilestone,
  deleteSemester,
  logAttendance,
  setAssignmentStatus,
  setCourseGradeScale,
  setExamTopicDone,
  setMilestoneDone,
  updateAssignment,
  updateCourse,
  updateDegreeRequirement,
  updateGradeCategory,
  updateSemester,
} from "@/lib/education";
import { todayStr } from "@/lib/date";
import {
  isAssignmentStatus,
  isAttendanceStatus,
  isCourseGradeValue,
  isDegreeRequirementStatus,
  isExamType,
  isGpaLetterGrade,
  type AssignmentStatus,
  type DegreeRequirementStatus,
  type EduSemesterStatus,
  type ExamType,
  type GpaLetterGrade,
} from "@/lib/types";

export type FormState = { error: string } | undefined;

function parseStatus(value: FormDataEntryValue | null): EduSemesterStatus | null {
  const str = String(value ?? "");
  return str === "current" || str === "past" || str === "upcoming" ? str : null;
}

export async function createSemester(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const status = parseStatus(formData.get("status"));

  if (!name) return { error: "Name is required." };
  if (!startDate || !endDate) return { error: "Start and end dates are required." };
  if (!status) return { error: "Pick a status." };

  await addSemester({ name, startDate, endDate, status });
  revalidatePath("/education");
  revalidatePath("/");
}

export async function editSemester(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const status = parseStatus(formData.get("status"));

  if (!id) return { error: "Missing semester." };
  if (!name) return { error: "Name is required." };
  if (!startDate || !endDate) return { error: "Start and end dates are required." };
  if (!status) return { error: "Pick a status." };

  await updateSemester(id, { name, startDate, endDate, status });
  revalidatePath("/education");
  revalidatePath("/");
}

export async function removeSemester(id: string): Promise<void> {
  await deleteSemester(id);
  revalidatePath("/education");
  revalidatePath("/");
}

export async function createCourse(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const semesterId = String(formData.get("semesterId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const courseCode = String(formData.get("courseCode") ?? "").trim();
  const creditHours = Number(formData.get("creditHours"));
  const instructor = String(formData.get("instructor") ?? "").trim();
  const room = String(formData.get("room") ?? "").trim();
  const currentLetterGradeRaw = String(formData.get("currentLetterGrade") ?? "");
  const targetGradeRaw = String(formData.get("targetGrade") ?? "");

  if (!semesterId) return { error: "Missing semester." };
  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(creditHours) || creditHours <= 0) {
    return { error: "Credit hours must be a positive number." };
  }
  const currentLetterGrade = isCourseGradeValue(currentLetterGradeRaw) ? currentLetterGradeRaw : null;
  const targetGrade = isGpaLetterGrade(targetGradeRaw) ? targetGradeRaw : null;

  await addCourse({
    semesterId,
    name,
    courseCode,
    creditHours,
    instructor,
    room,
    currentLetterGrade,
    targetGrade,
  });
  revalidatePath(`/education/${semesterId}`);
  revalidatePath("/education");
  revalidatePath("/");
}

export async function editCourse(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const semesterId = String(formData.get("semesterId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const courseCode = String(formData.get("courseCode") ?? "").trim();
  const creditHours = Number(formData.get("creditHours"));
  const instructor = String(formData.get("instructor") ?? "").trim();
  const room = String(formData.get("room") ?? "").trim();
  const currentLetterGradeRaw = String(formData.get("currentLetterGrade") ?? "");
  const targetGradeRaw = String(formData.get("targetGrade") ?? "");
  const attendanceThresholdRaw = String(formData.get("attendanceThresholdPercent") ?? "").trim();

  if (!id) return { error: "Missing course." };
  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(creditHours) || creditHours <= 0) {
    return { error: "Credit hours must be a positive number." };
  }
  const currentLetterGrade = isCourseGradeValue(currentLetterGradeRaw) ? currentLetterGradeRaw : null;
  const targetGrade = isGpaLetterGrade(targetGradeRaw) ? targetGradeRaw : null;
  let attendanceThresholdPercent: number | null | undefined = undefined;
  if (attendanceThresholdRaw !== "") {
    const parsed = Number(attendanceThresholdRaw);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      return { error: "Attendance threshold must be between 0 and 100." };
    }
    attendanceThresholdPercent = parsed;
  } else if (formData.has("attendanceThresholdPercent")) {
    attendanceThresholdPercent = null;
  }

  await updateCourse(id, {
    name,
    courseCode,
    creditHours,
    instructor,
    room,
    currentLetterGrade,
    targetGrade,
    attendanceThresholdPercent,
  });
  revalidatePath(`/education/${semesterId}`);
  revalidatePath("/education");
  revalidatePath("/");
}

export async function removeCourse(id: string, semesterId: string): Promise<void> {
  await deleteCourse(id);
  revalidatePath(`/education/${semesterId}`);
  revalidatePath("/education");
  revalidatePath("/");
}

export async function saveGradeScale(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const courseId = String(formData.get("courseId") ?? "");
  const semesterId = String(formData.get("semesterId") ?? "");
  const letters = formData.getAll("letter").map(String);
  const percents = formData.getAll("percent").map(String);

  if (!courseId) return { error: "Missing course." };

  const entries: { letterGrade: GpaLetterGrade; minPercent: number }[] = [];
  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i];
    const raw = percents[i]?.trim() ?? "";
    if (raw === "") continue;
    if (!isGpaLetterGrade(letter)) return { error: `Invalid letter grade: ${letter}` };
    const minPercent = Number(raw);
    if (!Number.isFinite(minPercent) || minPercent < 0 || minPercent > 100) {
      return { error: `${letter}'s minimum % must be between 0 and 100.` };
    }
    entries.push({ letterGrade: letter, minPercent });
  }

  await setCourseGradeScale(courseId, entries);
  revalidatePath(`/education/${semesterId}`);
}

// ---- Phase 7: weekly class meetings ----

export async function createMeeting(_prev: FormState, formData: FormData): Promise<FormState> {
  const courseId = String(formData.get("courseId") ?? "");
  const semesterId = String(formData.get("semesterId") ?? "");
  const dayOfWeek = Number(formData.get("dayOfWeek"));
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");

  if (!courseId) return { error: "Missing course." };
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) return { error: "Pick a day." };
  if (!startTime || !endTime) return { error: "Start and end time are required." };
  if (endTime <= startTime) return { error: "End time must be after start time." };

  await addMeeting({ courseId, dayOfWeek, startTime, endTime });
  revalidatePath(`/education/${semesterId}`);
  revalidatePath("/");
}

export async function removeMeeting(id: string, semesterId: string): Promise<void> {
  await deleteMeeting(id);
  revalidatePath(`/education/${semesterId}`);
  revalidatePath("/");
}

// ---- Phase 2: grade categories + entries ----

export async function createGradeCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const courseId = String(formData.get("courseId") ?? "");
  const semesterId = String(formData.get("semesterId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const weight = Number(formData.get("weight"));

  if (!courseId) return { error: "Missing course." };
  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(weight) || weight <= 0 || weight > 100) {
    return { error: "Weight must be between 0 and 100." };
  }

  await addGradeCategory({ courseId, name, weight });
  revalidatePath(`/education/${semesterId}`);
}

export async function editGradeCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const semesterId = String(formData.get("semesterId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const weight = Number(formData.get("weight"));

  if (!id) return { error: "Missing category." };
  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(weight) || weight <= 0 || weight > 100) {
    return { error: "Weight must be between 0 and 100." };
  }

  await updateGradeCategory(id, { name, weight });
  revalidatePath(`/education/${semesterId}`);
}

export async function removeGradeCategory(id: string, semesterId: string): Promise<void> {
  await deleteGradeCategory(id);
  revalidatePath(`/education/${semesterId}`);
}

export async function createGradeEntry(_prev: FormState, formData: FormData): Promise<FormState> {
  const categoryId = String(formData.get("categoryId") ?? "");
  const semesterId = String(formData.get("semesterId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const score = Number(formData.get("score"));
  const maxScore = Number(formData.get("maxScore"));

  if (!categoryId) return { error: "Missing category." };
  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(score) || score < 0) return { error: "Score must be 0 or more." };
  if (!Number.isFinite(maxScore) || maxScore <= 0) return { error: "Max score must be a positive number." };

  await addGradeEntry({ categoryId, name, score, maxScore });
  revalidatePath(`/education/${semesterId}`);
}

export async function removeGradeEntry(id: string, semesterId: string): Promise<void> {
  await deleteGradeEntry(id);
  revalidatePath(`/education/${semesterId}`);
}

// ---- Phase 3: assignments ----

function parseAssignmentFields(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "");
  const statusRaw = String(formData.get("status") ?? "not_started");
  const status: AssignmentStatus = isAssignmentStatus(statusRaw) ? statusRaw : "not_started";
  return { courseId, title, description, dueDate, status };
}

export async function createAssignment(_prev: FormState, formData: FormData): Promise<FormState> {
  const semesterId = String(formData.get("semesterId") ?? "");
  const { courseId, title, description, dueDate, status } = parseAssignmentFields(formData);

  if (!courseId) return { error: "Pick a course." };
  if (!title) return { error: "Title is required." };
  if (!dueDate) return { error: "Due date is required." };

  await addAssignment({ courseId, title, description, dueDate, status });
  if (semesterId) revalidatePath(`/education/${semesterId}`);
  revalidatePath("/education/assignments");
  revalidatePath("/");
}

export async function editAssignment(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const semesterId = String(formData.get("semesterId") ?? "");
  const { title, description, dueDate, status } = parseAssignmentFields(formData);

  if (!id) return { error: "Missing assignment." };
  if (!title) return { error: "Title is required." };
  if (!dueDate) return { error: "Due date is required." };

  await updateAssignment(id, { title, description, dueDate, status });
  if (semesterId) revalidatePath(`/education/${semesterId}`);
  revalidatePath("/education/assignments");
  revalidatePath("/");
}

export async function toggleAssignmentStatus(id: string, status: AssignmentStatus): Promise<void> {
  if (!isAssignmentStatus(status)) return;
  await setAssignmentStatus(id, status);
  revalidatePath("/education/assignments");
  revalidatePath("/");
}

export async function removeAssignment(id: string): Promise<void> {
  await deleteAssignment(id);
  revalidatePath("/education/assignments");
  revalidatePath("/");
}

// ---- Phase 4: exams/quizzes + study schedule ----

export async function createExam(_prev: FormState, formData: FormData): Promise<FormState> {
  const courseId = String(formData.get("courseId") ?? "");
  const semesterId = String(formData.get("semesterId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const typeRaw = String(formData.get("type") ?? "exam");
  const examDate = String(formData.get("examDate") ?? "");
  const topicsRaw = String(formData.get("topics") ?? "");

  if (!courseId) return { error: "Pick a course." };
  if (!title) return { error: "Title is required." };
  const type: ExamType = isExamType(typeRaw) ? typeRaw : "exam";
  if (!examDate) return { error: "Date is required." };

  const topics = topicsRaw
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);

  await addExam({ courseId, title, type, examDate, topics });
  if (semesterId) revalidatePath(`/education/${semesterId}`);
  revalidatePath("/education");
  revalidatePath("/");
}

export async function removeExam(id: string, semesterId: string): Promise<void> {
  await deleteExam(id);
  revalidatePath(`/education/${semesterId}`);
  revalidatePath("/education");
  revalidatePath("/");
}

export async function createExamTopic(examId: string, semesterId: string, label: string): Promise<void> {
  if (!label.trim()) return;
  await addExamTopic(examId, label.trim());
  revalidatePath(`/education/${semesterId}`);
}

export async function toggleExamTopic(id: string, done: boolean, semesterId: string): Promise<void> {
  await setExamTopicDone(id, done);
  revalidatePath(`/education/${semesterId}`);
}

export async function removeExamTopic(id: string, semesterId: string): Promise<void> {
  await deleteExamTopic(id);
  revalidatePath(`/education/${semesterId}`);
}

export async function createMilestone(
  examId: string,
  semesterId: string,
  label: string,
  offsetDays: number
): Promise<void> {
  if (!label.trim() || !Number.isFinite(offsetDays) || offsetDays < 0) return;
  await addMilestone({ examId, label: label.trim(), offsetDays });
  revalidatePath(`/education/${semesterId}`);
}

export async function toggleMilestone(id: string, done: boolean, semesterId: string): Promise<void> {
  await setMilestoneDone(id, done);
  revalidatePath(`/education/${semesterId}`);
}

export async function removeMilestone(id: string, semesterId: string): Promise<void> {
  await deleteMilestone(id);
  revalidatePath(`/education/${semesterId}`);
}

// ---- Phase 5: attendance ----

export async function createAttendance(_prev: FormState, formData: FormData): Promise<FormState> {
  const courseId = String(formData.get("courseId") ?? "");
  const semesterId = String(formData.get("semesterId") ?? "");
  const date = String(formData.get("date") ?? "");
  const statusRaw = String(formData.get("status") ?? "attended");

  if (!courseId) return { error: "Missing course." };
  if (!date) return { error: "Date is required." };
  if (!isAttendanceStatus(statusRaw)) return { error: "Invalid status." };

  await logAttendance({ courseId, date, status: statusRaw });
  revalidatePath(`/education/${semesterId}`);
  revalidatePath("/");
}

/** One-tap "Attended" logging from the homepage's Today's classes widget. */
export async function markAttendedToday(courseId: string): Promise<void> {
  await logAttendance({ courseId, date: todayStr(), status: "attended" });
  revalidatePath("/");
}

// ---- Phase 6: degree requirements ----

export async function createDegreeRequirement(_prev: FormState, formData: FormData): Promise<FormState> {
  const category = String(formData.get("category") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const creditHours = Number(formData.get("creditHours"));
  const statusRaw = String(formData.get("status") ?? "not_started");
  const fulfilledByCourseIdRaw = String(formData.get("fulfilledByCourseId") ?? "");

  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(creditHours) || creditHours < 0) return { error: "Credit hours must be 0 or more." };
  const status: DegreeRequirementStatus = isDegreeRequirementStatus(statusRaw) ? statusRaw : "not_started";
  const fulfilledByCourseId = fulfilledByCourseIdRaw || null;

  await addDegreeRequirement({ category, name, creditHours, status, fulfilledByCourseId });
  revalidatePath("/education/degree");
}

export async function editDegreeRequirement(_prev: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id") ?? "");
  const category = String(formData.get("category") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const creditHours = Number(formData.get("creditHours"));
  const statusRaw = String(formData.get("status") ?? "not_started");
  const fulfilledByCourseIdRaw = String(formData.get("fulfilledByCourseId") ?? "");

  if (!id) return { error: "Missing requirement." };
  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(creditHours) || creditHours < 0) return { error: "Credit hours must be 0 or more." };
  const status: DegreeRequirementStatus = isDegreeRequirementStatus(statusRaw) ? statusRaw : "not_started";
  const fulfilledByCourseId = fulfilledByCourseIdRaw || null;

  await updateDegreeRequirement(id, { category, name, creditHours, status, fulfilledByCourseId });
  revalidatePath("/education/degree");
}

export async function removeDegreeRequirement(id: string): Promise<void> {
  await deleteDegreeRequirement(id);
  revalidatePath("/education/degree");
}
