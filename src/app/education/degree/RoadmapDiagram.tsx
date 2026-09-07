"use client";

import { useMemo, useState, useTransition } from "react";
import {
  DEGREE_PLAN_CATEGORY_BORDER,
  DEGREE_PLAN_CATEGORY_STYLE,
  DEGREE_PLAN_COURSES,
  DEGREE_PLAN_EDGES,
  DEGREE_PLAN_TERMS,
  termIndex,
  type DegreePlanCourse,
} from "@/lib/degreePlanCatalog";
import { DEGREE_PLAN_STATUSES, type DegreePlanStatus, type DegreePlanStatusRecord } from "@/lib/types";
import { updateDegreePlanStatus } from "./actions";

const BOX_W = 172;
const BOX_H = 76;
const COL_GAP = 64;
const ROW_GAP = 16;
const PAD_LEFT = 24;
const PAD_TOP = 96;
const PAD_BOTTOM = 40;

const STATUS_COLOR: Record<DegreePlanStatus, string> = {
  completed: "#9ca3af", // gray
  ongoing: "#22c55e", // green
  planned: "#3b82f6", // blue
};

const STATUS_LABEL: Record<DegreePlanStatus, string> = {
  completed: "Completed",
  ongoing: "Ongoing",
  planned: "Planned",
};

function colX(colIndex: number): number {
  return PAD_LEFT + colIndex * (BOX_W + COL_GAP);
}
function rowY(rowIndex: number): number {
  return PAD_TOP + rowIndex * (BOX_H + ROW_GAP);
}

export default function RoadmapDiagram({
  statuses,
}: {
  statuses: Record<string, DegreePlanStatusRecord>;
}) {
  const [selected, setSelected] = useState<DegreePlanCourse | null>(null);
  const [localStatuses, setLocalStatuses] = useState(statuses);

  const maxRow = useMemo(
    () => Math.max(...DEGREE_PLAN_COURSES.map((c) => c.row)),
    []
  );
  const width = colX(DEGREE_PLAN_TERMS.length - 1) + BOX_W + PAD_LEFT;
  const height = rowY(maxRow) + BOX_H + PAD_BOTTOM;

  function statusFor(courseId: string): DegreePlanStatus {
    return localStatuses[courseId]?.status ?? "planned";
  }

  function handleSaved(courseId: string, status: DegreePlanStatus, plannedTerm: string | null) {
    setLocalStatuses((prev) => ({ ...prev, [courseId]: { courseId, status, plannedTerm } }));
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0a0e14]">
        <div className="relative" style={{ width, height }}>
          {DEGREE_PLAN_TERMS.map((term, i) => (
            <div
              key={term.id}
              className="absolute top-0 text-center"
              style={{ left: colX(i), width: BOX_W, height: PAD_TOP - 12 }}
            >
              <p className="text-sm font-bold text-white/85 leading-tight">{term.label}</p>
              <p className="text-xs text-white/50 leading-tight">
                {term.sublabel} {term.creditTarget > 0 && `(${term.creditTarget}cr)`}
              </p>
            </div>
          ))}

          <Connectors />

          {DEGREE_PLAN_COURSES.map((course) => (
            <CourseBox
              key={course.id}
              course={course}
              status={statusFor(course.id)}
              onClick={() => setSelected(course)}
            />
          ))}
        </div>
      </div>

      <p className="text-xs text-white/40 mt-2 sm:hidden">Scroll sideways to see later years →</p>

      <Legend />

      {selected && (
        <StatusModal
          course={selected}
          record={localStatuses[selected.id] ?? null}
          onClose={() => setSelected(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function CourseBox({
  course,
  status,
  onClick,
}: {
  course: DegreePlanCourse;
  status: DegreePlanStatus;
  onClick: () => void;
}) {
  const style = DEGREE_PLAN_CATEGORY_STYLE[course.category];
  const accent = DEGREE_PLAN_CATEGORY_BORDER[course.category];
  const isSolidCategory = !accent;

  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute rounded-lg text-left px-2 py-1.5 transition-transform active:scale-[0.97] flex flex-col justify-center"
      style={{
        left: colX(termIndex(course.term)),
        top: rowY(course.row),
        width: BOX_W,
        height: BOX_H,
        backgroundColor: isSolidCategory ? style.bg : "var(--color-surface)",
        color: isSolidCategory ? style.fg : "#e5e7eb",
        border: `3px solid ${STATUS_COLOR[status]}`,
        borderLeft: accent ? `6px solid ${accent}` : `3px solid ${STATUS_COLOR[status]}`,
      }}
    >
      <p className="text-xs font-bold leading-tight truncate">
        {course.code} <span className="font-normal opacity-80">({course.credits}cr)</span>
      </p>
      <p className="text-[11px] leading-snug line-clamp-2 opacity-90">{course.name}</p>
    </button>
  );
}

function Connectors() {
  const paths = DEGREE_PLAN_EDGES.map((edge) => {
    const from = DEGREE_PLAN_COURSES.find((c) => c.id === edge.from);
    const to = DEGREE_PLAN_COURSES.find((c) => c.id === edge.to);
    if (!from || !to) return null;

    const sameTerm = from.term === to.term;
    const fromCol = termIndex(from.term);
    const toCol = termIndex(to.term);

    if (sameTerm) {
      const x = colX(fromCol) + BOX_W / 2;
      const y1 = rowY(from.row) + BOX_H;
      const y2 = rowY(to.row);
      return (
        <line
          key={`${edge.from}-${edge.to}`}
          x1={x}
          y1={y1}
          x2={x}
          y2={y2}
          stroke="#ef4444"
          strokeWidth={2}
          strokeDasharray="4 3"
        />
      );
    }

    const x1 = colX(fromCol) + BOX_W;
    const y1 = rowY(from.row) + BOX_H / 2;
    const x2 = colX(toCol);
    const y2 = rowY(to.row) + BOX_H / 2;
    const midX = x1 + (x2 - x1) / 2;
    const d = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;

    if (edge.kind === "coreq") {
      return (
        <path
          key={`${edge.from}-${edge.to}`}
          d={d}
          fill="none"
          stroke="#ef4444"
          strokeWidth={2}
          strokeDasharray="4 3"
        />
      );
    }

    return (
      <path
        key={`${edge.from}-${edge.to}`}
        d={d}
        fill="none"
        stroke="#6b7280"
        strokeWidth={1.5}
        markerEnd="url(#arrowhead)"
      />
    );
  });

  return (
    <svg className="absolute top-0 left-0 pointer-events-none" width="100%" height="100%" style={{ overflow: "visible" }}>
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#6b7280" />
        </marker>
      </defs>
      {paths}
    </svg>
  );
}

function Legend() {
  const solidCategories = ["structures", "management", "transportation", "geotechnical", "materials", "environ_hydro"] as const;
  const borderedCategories = ["ger_core", "free_elective", "major_elective", "univ_reqt"] as const;

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide mb-2" style={{ color: "var(--color-education)" }}>
          Status
        </p>
        <div className="flex flex-wrap gap-3">
          {DEGREE_PLAN_STATUSES.map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded" style={{ border: `3px solid ${STATUS_COLOR[s]}` }} />
              <span className="text-sm text-white/75">{STATUS_LABEL[s]}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="w-5 border-t-2 border-dashed" style={{ borderColor: "#ef4444" }} />
            <span className="text-sm text-white/75">Pre/Co-requisite</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 border-t" style={{ borderColor: "#6b7280" }} />
            <span className="text-sm text-white/75">Prerequisite</span>
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-bold uppercase tracking-wide mb-2" style={{ color: "var(--color-education)" }}>
          Category
        </p>
        <div className="flex flex-wrap gap-3">
          {solidCategories.map((cat) => (
            <div key={cat} className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded" style={{ backgroundColor: DEGREE_PLAN_CATEGORY_STYLE[cat].bg }} />
              <span className="text-sm text-white/75">{DEGREE_PLAN_CATEGORY_STYLE[cat].label}</span>
            </div>
          ))}
          {borderedCategories.map((cat) => (
            <div key={cat} className="flex items-center gap-1.5">
              <span
                className="w-4 h-4 rounded bg-[var(--color-surface)]"
                style={{ borderLeft: `4px solid ${DEGREE_PLAN_CATEGORY_BORDER[cat]}` }}
              />
              <span className="text-sm text-white/75">{DEGREE_PLAN_CATEGORY_STYLE[cat].label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusModal({
  course,
  record,
  onClose,
  onSaved,
}: {
  course: DegreePlanCourse;
  record: DegreePlanStatusRecord | null;
  onClose: () => void;
  onSaved: (courseId: string, status: DegreePlanStatus, plannedTerm: string | null) => void;
}) {
  const currentStatus = record?.status ?? "planned";
  const [status, setStatus] = useState<DegreePlanStatus>(currentStatus);
  const [plannedTerm, setPlannedTerm] = useState<string>(record?.plannedTerm ?? course.term);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateDegreePlanStatus(course.id, status, status === "planned" ? plannedTerm : null);
      if (result?.error) {
        setError(result.error);
        return;
      }
      onSaved(course.id, status, status === "planned" ? plannedTerm : null);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-[var(--color-surface)] border border-white/10 p-4 flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--color-education)" }}>
            {course.code}
          </p>
          <p className="text-base font-semibold">{course.name}</p>
          <p className="text-sm text-white/50">{course.credits} credit{course.credits === 1 ? "" : "s"}</p>
        </div>

        <div className="flex flex-col gap-2">
          {DEGREE_PLAN_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold border"
              style={{
                borderColor: STATUS_COLOR[s],
                backgroundColor: status === s ? `${STATUS_COLOR[s]}26` : "transparent",
                color: status === s ? STATUS_COLOR[s] : "#e5e7eb",
              }}
            >
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLOR[s] }} />
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        {status === "planned" && (
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-white/50">Plan for</span>
            <select
              value={plannedTerm}
              onChange={(e) => setPlannedTerm(e.target.value)}
              className="rounded-lg bg-white/5 border border-white/10 px-2.5 py-1.5 text-sm outline-none focus:border-[var(--color-education)]"
            >
              {DEGREE_PLAN_TERMS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} {t.sublabel}
                </option>
              ))}
            </select>
          </label>
        )}

        {error && <p className="text-sm text-[var(--color-negative)]">{error}</p>}

        <div className="flex items-center gap-2 mt-1">
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="flex-1 rounded-lg bg-[var(--color-education)] text-black font-bold px-3 py-2 text-sm disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 font-semibold px-3 py-2 text-sm hover:bg-white/5"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
