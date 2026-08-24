import Link from "next/link";
import { getPostsForDate } from "@/lib/posts";
import type { Post } from "@/lib/types";
import { formatDayHeading, formatMonthYear, shiftDate, todayStr } from "@/lib/date";
import { TopBar } from "@/components/TopBar";
import { PostCard } from "@/components/PostCard";
import { EmptyState } from "@/components/EmptyState";

export default async function DayPage(props: PageProps<"/">) {
  const searchParams = await props.searchParams;
  const dateParam = searchParams.date;
  const date = typeof dateParam === "string" ? dateParam : todayStr();
  const isToday = date === todayStr();

  const { shoot, edit, post } = await getPostsForDate(date);

  return (
    <div className="pb-10">
      <TopBar active="day" />

      <div className="px-4 mt-2 mb-5">
        <p className="text-sm text-white/40 mb-0.5">{formatMonthYear(date)}</p>
        <div className="flex items-end justify-between gap-2">
          <h1 className="font-display text-5xl leading-none tracking-wide">
            {formatDayHeading(date)}
          </h1>
          <div className="flex items-center gap-1.5 pb-1">
            <Link
              href={`/?date=${shiftDate(date, -1)}`}
              aria-label="Previous day"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-lg"
            >
              ‹
            </Link>
            {!isToday && (
              <Link
                href="/"
                className="rounded-full bg-white/5 border border-white/10 px-3 h-9 flex items-center text-xs font-medium text-white/70"
              >
                Today
              </Link>
            )}
            <Link
              href={`/?date=${shiftDate(date, 1)}`}
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
        />
        <Section
          label="Edit today"
          color="var(--color-edit)"
          posts={edit}
          emptyLabel="Nothing to edit today"
        />
        <Section
          label="Post today"
          color="var(--color-post)"
          posts={post}
          emptyLabel="Nothing to post today"
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
}: {
  label: string;
  color: string;
  posts: Post[];
  emptyLabel: string;
}) {
  return (
    <section>
      <h2
        className="font-display text-xl tracking-wide mb-2.5"
        style={{ color }}
      >
        {label}
      </h2>
      {posts.length === 0 ? (
        <EmptyState label={emptyLabel} />
      ) : (
        <div className="flex flex-col gap-2.5">
          {posts.map((p) => (
            <PostCard key={`${label}-${p.id}`} post={p} />
          ))}
        </div>
      )}
    </section>
  );
}
