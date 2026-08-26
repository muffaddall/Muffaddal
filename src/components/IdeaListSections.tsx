import type { Post, ScheduledPost } from "@/lib/types";
import { PostCard } from "@/components/PostCard";
import { IdeaCard } from "@/components/IdeaCard";
import { EmptyState } from "@/components/EmptyState";

export function IdeaListSections({
  scheduled,
  unscheduled,
  posted,
  basePath,
}: {
  scheduled: ScheduledPost[];
  unscheduled: Post[];
  posted: ScheduledPost[];
  basePath: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <section>
        <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-2 text-white/45">
          Not scheduled
        </h3>
        {unscheduled.length === 0 ? (
          <EmptyState label="Nothing waiting to be scheduled" />
        ) : (
          <div className="flex flex-col gap-2.5">
            {unscheduled.map((p) => (
              <IdeaCard key={p.id} post={p} returnTo={basePath} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h3
          className="text-[11px] font-semibold uppercase tracking-wider mb-2"
          style={{ color: "var(--color-edit)" }}
        >
          Scheduled
        </h3>
        {scheduled.length === 0 ? (
          <EmptyState label="Nothing scheduled yet" />
        ) : (
          <div className="flex flex-col gap-2.5">
            {scheduled.map((p) => (
              <PostCard key={p.id} post={p} returnTo={basePath} />
            ))}
          </div>
        )}
      </section>

      {posted.length > 0 && (
        <section>
          <h3
            className="text-[11px] font-semibold uppercase tracking-wider mb-2"
            style={{ color: "var(--color-post)" }}
          >
            Posted
          </h3>
          <div className="flex flex-col gap-2.5">
            {posted.map((p) => (
              <PostCard key={p.id} post={p} returnTo={basePath} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
