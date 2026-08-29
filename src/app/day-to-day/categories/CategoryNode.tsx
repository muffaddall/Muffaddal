"use client";

import { useState, useTransition } from "react";
import { removeCategory } from "./actions";
import AddCategoryForm from "./AddCategoryForm";
import type { DdCategoryKind, DdCategoryNode as DdCategoryNodeType } from "@/lib/types";

export default function CategoryNode({
  node,
  kind,
  depth,
}: {
  node: DdCategoryNodeType;
  kind: DdCategoryKind;
  depth: number;
}) {
  const [isDeleting, startDelete] = useTransition();
  const [addingChild, setAddingChild] = useState(false);

  return (
    <div className={depth > 0 ? "ml-4 mt-1 border-l border-white/8 pl-3" : "mt-1"}>
      <div className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5 transition-colors">
        <span className="text-sm">{node.name}</span>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setAddingChild((v) => !v)}
            className="text-xs"
            style={{ color: "var(--color-accent)" }}
          >
            {addingChild ? "Cancel" : "+ Sub"}
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => startDelete(() => removeCategory(node.id))}
            className="text-xs text-[var(--color-negative)] disabled:opacity-60"
          >
            {isDeleting ? "…" : "Delete"}
          </button>
        </div>
      </div>

      {addingChild && (
        <div className="ml-4 mt-1 mb-2">
          <AddCategoryForm
            kind={kind}
            parentId={node.id}
            label="Sub-category name"
            onDone={() => setAddingChild(false)}
          />
        </div>
      )}

      {node.children.map((child) => (
        <CategoryNode key={child.id} node={child} kind={kind} depth={depth + 1} />
      ))}
    </div>
  );
}
