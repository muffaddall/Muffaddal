import Link from "next/link";
import { format } from "date-fns";
import type { ScheduledPost } from "@/lib/types";
import { parseDateStr } from "@/lib/date";
import { TypeBadge } from "@/components/TypeBadge";

function shortDate(date: string) {
  return format(parseDateStr(date), "MMM d");
}

export function PostCard({
  post,
  returnTo = "/",
}: {
  post: ScheduledPost;
  returnTo?: string;
}) {
  return (
    <Link
      href={`/edit/${post.id}?from=${encodeURIComponent(returnTo)}`}
      className="block rounded-2xl bg-[var(--color-surface)] border border-white/8 p-4 active:scale-[0.99] transition-transform"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="font-semibold text-base leading-snug">{post.name}</h3>
        <TypeBadge type={post.type} />
      </div>

      {post.idea && (
        <p className="text-sm text-white/55 line-clamp-2 mb-3">{post.idea}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-white/45">
        <span className="flex items-center gap-1">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--color-shoot)" }}
          />
          {shortDate(post.shootDate)}
        </span>
        <span className="flex items-center gap-1">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--color-edit)" }}
          />
          {shortDate(post.editDate)}
        </span>
        <span className="flex items-center gap-1">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--color-post)" }}
          />
          {shortDate(post.postDate)}
        </span>
      </div>
    </Link>
  );
}
