// Static transcription of the AUS Civil Engineering Dept. 2025-2026 course
// roadmap (the "Degree Plan" flowchart) — this is fixed university curriculum
// data, not something the user edits, so it lives in code rather than the
// database (same reasoning as GPA_POINTS in lib/types.ts). What IS
// per-user and DB-backed is each course's plan status — see
// edu_degree_plan_status in schema.sql / lib/degreePlan.ts.
//
// Transcribed from a photo of the printed roadmap with hand markup (X's for
// completed courses, colored circles for personal annotations). Course
// codes/credits for the heavily marked-up first two years were the hardest
// to read with certainty — if anything here is wrong, it's a one-line fix
// in this file.

export type DegreePlanTermId =
  | "y1_fall"
  | "y1_spring"
  | "y2_fall"
  | "y2_spring"
  | "y3_fall"
  | "y3_spring"
  | "summer"
  | "y4_fall"
  | "y4_spring";

export const DEGREE_PLAN_TERMS: { id: DegreePlanTermId; label: string; sublabel: string; creditTarget: number }[] = [
  { id: "y1_fall", label: "First Year", sublabel: "Fall", creditTarget: 16 },
  { id: "y1_spring", label: "First Year", sublabel: "Spring", creditTarget: 17 },
  { id: "y2_fall", label: "Second Year", sublabel: "Fall", creditTarget: 17 },
  { id: "y2_spring", label: "Second Year", sublabel: "Spring", creditTarget: 15 },
  { id: "y3_fall", label: "Third Year", sublabel: "Fall", creditTarget: 17 },
  { id: "y3_spring", label: "Third Year", sublabel: "Spring", creditTarget: 15 },
  { id: "summer", label: "Summer", sublabel: "", creditTarget: 0 },
  { id: "y4_fall", label: "Fourth Year", sublabel: "Fall", creditTarget: 16 },
  { id: "y4_spring", label: "Fourth Year", sublabel: "Spring", creditTarget: 17 },
];

export const DEGREE_PLAN_CATEGORIES = [
  "structures",
  "management",
  "transportation",
  "geotechnical",
  "materials",
  "environ_hydro",
  "general",
  "ger_core",
  "free_elective",
  "major_elective",
  "univ_reqt",
] as const;

export type DegreePlanCategory = (typeof DEGREE_PLAN_CATEGORIES)[number];

// Matches the color key printed at the bottom of the original roadmap.
export const DEGREE_PLAN_CATEGORY_STYLE: Record<DegreePlanCategory, { bg: string; fg: string; label: string }> = {
  structures: { bg: "#3b82f6", fg: "#0b1220", label: "Structures" },
  management: { bg: "#eab308", fg: "#1a1400", label: "Management" },
  transportation: { bg: "#92400e", fg: "#fff7ed", label: "Transportation" },
  geotechnical: { bg: "#15803d", fg: "#eafff1", label: "Geotechnical" },
  materials: { bg: "#dc2626", fg: "#fff1f1", label: "Materials" },
  environ_hydro: { bg: "#7c3aed", fg: "#f5f0ff", label: "Environ/Hydro" },
  general: { bg: "#e5e7eb", fg: "#111827", label: "General / Gen-Ed" },
  ger_core: { bg: "#f5f5f4", fg: "#111827", label: "GER-Core" },
  free_elective: { bg: "#f5f5f4", fg: "#111827", label: "Free Elective" },
  major_elective: { bg: "#f5f5f4", fg: "#111827", label: "Major Elective" },
  univ_reqt: { bg: "#f5f5f4", fg: "#111827", label: "Univ. Req't" },
};

// GER-Core / Free Elective / Major Elective / Univ. Req't boxes are white
// with a colored border in the original — border color matches the legend.
export const DEGREE_PLAN_CATEGORY_BORDER: Partial<Record<DegreePlanCategory, string>> = {
  ger_core: "#dc2626",
  free_elective: "#16a34a",
  major_elective: "#2563eb",
  univ_reqt: "#ca8a04",
};

export type DegreePlanCourse = {
  id: string;
  code: string;
  name: string;
  credits: number;
  term: DegreePlanTermId;
  category: DegreePlanCategory;
  row: number; // vertical order within its term column
};

export const DEGREE_PLAN_COURSES: DegreePlanCourse[] = [
  // ---- First Year Fall (16 cr) ----
  { id: "chm101", code: "CHM 101", name: "General Chemistry I", credits: 3, term: "y1_fall", category: "general", row: 0 },
  { id: "chm101l", code: "CHM 101L", name: "General Chemistry Lab I", credits: 1, term: "y1_fall", category: "general", row: 1 },
  { id: "wri101", code: "WRI 101", name: "Academic Writing I", credits: 3, term: "y1_fall", category: "general", row: 2 },
  { id: "mth101", code: "MTH 101", name: "Calculus I", credits: 3, term: "y1_fall", category: "general", row: 3 },
  { id: "phy101", code: "PHY 101", name: "General Physics I", credits: 3, term: "y1_fall", category: "general", row: 4 },
  { id: "phy101l", code: "PHY 101L", name: "General Physics Lab I", credits: 1, term: "y1_fall", category: "general", row: 5 },
  { id: "ngn110", code: "NGN 110", name: "Intro to Engineering & Computing", credits: 1, term: "y1_fall", category: "general", row: 6 },
  { id: "ngn112", code: "NGN 112", name: "AI & Data Analytics", credits: 1, term: "y1_fall", category: "general", row: 7 },

  // ---- First Year Spring (17 cr) ----
  { id: "gercore_behavior", code: "GER-Core", name: "Intro to Psych & Human Behavior", credits: 3, term: "y1_spring", category: "ger_core", row: 0 },
  { id: "wri102", code: "WRI 102", name: "Writing and Argumentation", credits: 3, term: "y1_spring", category: "general", row: 1 },
  { id: "mth102", code: "MTH 102", name: "Calculus II", credits: 3, term: "y1_spring", category: "general", row: 2 },
  { id: "phy102", code: "PHY 102", name: "General Physics II", credits: 3, term: "y1_spring", category: "general", row: 3 },
  { id: "phy102l", code: "PHY 102L", name: "General Physics Lab II", credits: 1, term: "y1_spring", category: "general", row: 4 },
  { id: "ngn111", code: "NGN 111", name: "Fundamentals of Engineering Graphics", credits: 3, term: "y1_spring", category: "general", row: 5 },
  { id: "ngn211stat", code: "NGN 211", name: "Statistical Analysis", credits: 1, term: "y1_spring", category: "general", row: 6 },

  // ---- Second Year Fall (17 cr) ----
  { id: "eng204", code: "ENG 204", name: "Advanced Academic Writing", credits: 3, term: "y2_fall", category: "general", row: 0 },
  { id: "cve222", code: "CVE 222", name: "Statics and Dynamics", credits: 4, term: "y2_fall", category: "structures", row: 1 },
  { id: "cve243", code: "CVE 243", name: "Fundamentals of Geomatics", credits: 3, term: "y2_fall", category: "general", row: 2 },
  { id: "mth225", code: "MTH 225", name: "Differential Equations", credits: 3, term: "y2_fall", category: "general", row: 3 },
  { id: "cve267", code: "CVE 267", name: "Cost Analysis", credits: 3, term: "y2_fall", category: "management", row: 4 },

  // ---- Second Year Spring (15 cr) ----
  { id: "cve240", code: "CVE 240", name: "Fluid Mechanics", credits: 3, term: "y2_spring", category: "environ_hydro", row: 0 },
  { id: "cve223", code: "CVE 223", name: "Mechanics of Materials", credits: 3, term: "y2_spring", category: "structures", row: 1 },
  { id: "cve263", code: "CVE 263", name: "Urban Transportation", credits: 3, term: "y2_spring", category: "transportation", row: 2 },
  { id: "mth203", code: "MTH 203", name: "Calculus III", credits: 3, term: "y2_spring", category: "general", row: 3 },

  // ---- Third Year Fall (17 cr) ----
  { id: "cve341", code: "CVE 341", name: "Water Resources Engineering", credits: 3, term: "y3_fall", category: "environ_hydro", row: 0 },
  { id: "cve301", code: "CVE 301", name: "Theory of Structure", credits: 3, term: "y3_fall", category: "structures", row: 1 },
  { id: "cve331", code: "CVE 331", name: "Geotechnical Engineering Principles", credits: 3, term: "y3_fall", category: "geotechnical", row: 2 },
  { id: "cve303", code: "CVE 303", name: "Geotechnical Engineering Lab", credits: 1, term: "y3_fall", category: "geotechnical", row: 3 },
  { id: "cve224", code: "CVE 224", name: "Materials of Construction", credits: 3, term: "y3_fall", category: "materials", row: 4 },
  { id: "cve202", code: "CVE 202", name: "Construction Materials Lab", credits: 1, term: "y3_fall", category: "materials", row: 5 },
  { id: "gercore_crosscultural", code: "GER-Core", name: "Cross-Cultural Perspectives", credits: 3, term: "y3_fall", category: "ger_core", row: 6 },

  // ---- Third Year Spring (15 cr) ----
  { id: "cve313", code: "CVE 313", name: "R/C Design", credits: 3, term: "y3_spring", category: "structures", row: 0 },
  { id: "cve333", code: "CVE 333", name: "Geotechnical Design", credits: 3, term: "y3_spring", category: "geotechnical", row: 1 },
  { id: "cve363", code: "CVE 363", name: "Highway Design", credits: 3, term: "y3_spring", category: "transportation", row: 2 },
  { id: "cve367", code: "CVE 367", name: "Project Estimation & Planning", credits: 3, term: "y3_spring", category: "management", row: 3 },
  { id: "ien301", code: "IEN 301", name: "Innovation and Entrepreneurial Mindset", credits: 3, term: "y3_spring", category: "univ_reqt", row: 4 },

  // ---- Summer (0 cr) ----
  { id: "ngn397_1", code: "NGN 397-1", name: "Professional Training — Junior II", credits: 0, term: "summer", category: "general", row: 0 },

  // ---- Fourth Year Fall (16 cr) ----
  { id: "cve490", code: "CVE 490", name: "Design Project I (Senior)", credits: 1, term: "y4_fall", category: "general", row: 0 },
  { id: "cve312", code: "CVE 312", name: "Structural Steel Design", credits: 3, term: "y4_fall", category: "structures", row: 1 },
  { id: "cve352", code: "CVE 352", name: "Environmental Engineering", credits: 3, term: "y4_fall", category: "environ_hydro", row: 2 },
  { id: "cve_major1", code: "CVE XXX", name: "Major Elective I", credits: 3, term: "y4_fall", category: "major_elective", row: 3 },
  { id: "cve325", code: "CVE 325", name: "Computational Methods", credits: 3, term: "y4_fall", category: "transportation", row: 4 },
  { id: "gercore_arabworld", code: "GER-Core", name: "History of the Arab World", credits: 3, term: "y4_fall", category: "ger_core", row: 5 },

  // ---- Fourth Year Spring (17 cr) ----
  { id: "cve491", code: "CVE 491", name: "Design Project II", credits: 2, term: "y4_spring", category: "general", row: 0 },
  { id: "fre_elective1", code: "FRE XXX", name: "Free Elective I", credits: 3, term: "y4_spring", category: "free_elective", row: 1 },
  { id: "fre_elective2", code: "FRE XXX", name: "Free Elective II", credits: 3, term: "y4_spring", category: "free_elective", row: 2 },
  { id: "cve_major2", code: "CVE XXX", name: "Major Elective II", credits: 3, term: "y4_spring", category: "major_elective", row: 3 },
  { id: "gercore_artsliterature", code: "GER-Core", name: "Arts and Literature", credits: 3, term: "y4_spring", category: "ger_core", row: 4 },
  { id: "gercore_selected", code: "GER-Core", name: "Selected from General Core Req't", credits: 3, term: "y4_spring", category: "ger_core", row: 5 },
];

export type DegreePlanEdgeKind = "prereq" | "coreq";

export type DegreePlanEdge = {
  from: string;
  to: string;
  kind: DegreePlanEdgeKind;
};

export const DEGREE_PLAN_EDGES: DegreePlanEdge[] = [
  // Co-requisites (dotted "Pre/Con" line on the original)
  { from: "chm101", to: "chm101l", kind: "coreq" },
  { from: "phy101", to: "phy101l", kind: "coreq" },
  { from: "phy102", to: "phy102l", kind: "coreq" },
  { from: "cve331", to: "cve303", kind: "coreq" },
  { from: "cve224", to: "cve202", kind: "coreq" },
  { from: "cve267", to: "cve263", kind: "coreq" },

  // Prerequisites
  { from: "mth101", to: "mth102", kind: "prereq" },
  { from: "mth102", to: "mth225", kind: "prereq" },
  { from: "mth102", to: "mth203", kind: "prereq" },
  { from: "phy101", to: "phy102", kind: "prereq" },
  { from: "wri101", to: "wri102", kind: "prereq" },
  { from: "cve222", to: "cve223", kind: "prereq" },
  { from: "cve223", to: "cve301", kind: "prereq" },
  { from: "cve301", to: "cve313", kind: "prereq" },
  { from: "cve313", to: "cve312", kind: "prereq" },
  { from: "cve222", to: "cve240", kind: "prereq" },
  { from: "cve240", to: "cve341", kind: "prereq" },
  { from: "cve341", to: "cve352", kind: "prereq" },
  { from: "cve243", to: "cve263", kind: "prereq" },
  { from: "cve263", to: "cve363", kind: "prereq" },
  { from: "cve222", to: "cve331", kind: "prereq" },
  { from: "cve224", to: "cve331", kind: "prereq" },
  { from: "cve331", to: "cve333", kind: "prereq" },
  { from: "cve267", to: "cve367", kind: "prereq" },
  { from: "mth225", to: "cve301", kind: "prereq" },
  { from: "cve224", to: "cve325", kind: "prereq" },
  { from: "ngn397_1", to: "cve490", kind: "prereq" },
  { from: "cve490", to: "cve491", kind: "prereq" },
];

export function getCourseById(id: string): DegreePlanCourse | undefined {
  return DEGREE_PLAN_COURSES.find((c) => c.id === id);
}

export function termIndex(id: DegreePlanTermId): number {
  return DEGREE_PLAN_TERMS.findIndex((t) => t.id === id);
}
