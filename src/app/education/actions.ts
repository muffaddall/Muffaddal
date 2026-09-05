"use server";

import { revalidatePath } from "next/cache";
import {
  addCourse,
  addSemester,
  deleteCourse,
  deleteSemester,
  setCourseGradeScale,
  updateCourse,
  updateSemester,
} from "@/lib/education";
import {
  isCourseGradeValue,
  isGpaLetterGrade,
  type EduSemesterStatus,
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

  if (!id) return { error: "Missing course." };
  if (!name) return { error: "Name is required." };
  if (!Number.isFinite(creditHours) || creditHours <= 0) {
    return { error: "Credit hours must be a positive number." };
  }
  const currentLetterGrade = isCourseGradeValue(currentLetterGradeRaw) ? currentLetterGradeRaw : null;
  const targetGrade = isGpaLetterGrade(targetGradeRaw) ? targetGradeRaw : null;

  await updateCourse(id, {
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
