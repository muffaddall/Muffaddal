import Link from "next/link";
import { getPostsForDate } from "@/lib/posts";
import type { ScheduledPost } from "@/lib/types";
import { formatDayHeading, formatMonthYear, shiftDate, todayStr } from "@/lib/date";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/EmptyState";

export async function DayContent({
  date,
  basePath,
}: {
  date: string;
  basePath: string;
}) {
  const isToday = date === todayStr();
  const { shoot, edit, post } = await getPostsForDate(date);

  return (
    <div>
      <div className="px-4 mt-2 mb-5">
        <p className="text-sm text-white/40 mb-0.5">{formatMonthYear(date)}</p>
        <div className="flex items-end justify-between gap-2">
          <h1 className="font-display text-7xl leading-none tracking-wide">
            {formatDayHeading(date)}
          </h1>
          <div className="flex items-center gap-1.5 pb-1">
            <Link
              href={`${basePath}?date=${shiftDate(date, -1)}`}
              aria-label="Previous day"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-lg"
            >
              ‹
            </Link>
            {!isToday && (
              <Link
                href={basePath}
                className="rounded-full bg-white/5 border border-white/10 px-3 h-9 flex items-center text-xs font-medium text-white/70"
              >
                Today
              </Link>
            )}
            <Link
              href={`${basePath}?date=${shiftDate(date, 1)}`}
              aria-label="Next day"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-lg"
            >
              ›
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-6">
        <Section
          label="Shoot today"
          color="var(--color-shoot)"
          posts={shoot}
          emptyLabel="Nothing to shoot today"
          basePath={basePath}
        />
        <Section
          label="Edit today"
          color="var(--color-edit)"
          posts={edit}
          emptyLabel="Nothing to edit today"
          basePath={basePath}
        />
        <Section
          label="Post today"
          color="var(--color-post)"
          posts={post}
          emptyLabel="Nothing to post today"
          basePath={basePath}
        />
      </div>
    </div>
  );
}

function Section({
  label,
  color,
  posts,
  emptyLabel,
  basePath,
}: {
  label: string;
  color: string;
  posts: ScheduledPost[];
  emptyLabel: string;
  basePath: string;
}) {
  return (
    <section>
      <h2
        className="font-display text-2xl tracking-wide mb-2.5"
        style={{ color }}
      >
        {label}
      </h2>
      {posts.length === 0 ? (
        <EmptyState label={emptyLabel} />
      ) : (
        <div className="flex flex-col gap-2.5">
          {posts.map((p) => (
            <PostCard key={`${label}-${p.id}`} post={p} returnTo={basePath} />
          ))}
        </div>
      )}
    </section>
  );
}
