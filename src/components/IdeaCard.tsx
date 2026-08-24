import Link from "next/link";
import type { Post } from "@/lib/types";
import { TypeBadge } from "@/components/TypeBadge";

export function IdeaCard({
  post,
  returnTo,
}: {
  post: Post;
  returnTo: string;
}) {
  return (
    <div className="rounded-2xl bg-[var(--color-surface)] border border-white/8 p-4">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="font-semibold text-base leading-snug">{post.name}</h3>
        <TypeBadge type={post.type} />
      </div>

      {post.inspiration && (
        <p className="text-sm text-white/50 line-clamp-2 mb-3">
          {post.inspiration}
        </p>
      )}

      <Link
        href={`/edit/${post.id}?from=${encodeURIComponent(returnTo)}&schedule=1`}
        className="inline-flex items-center gap-1 rounded-full bg-white/8 border border-white/10 px-3.5 py-1.5 text-xs font-medium text-white/85 active:scale-95 transition-transform"
      >
        Schedule
      </Link>
    </div>
  );
}
