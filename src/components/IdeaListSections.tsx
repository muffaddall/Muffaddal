import type { Post, ScheduledPost } from "@/lib/types";
import { PostCard } from "@/components/PostCard";
import { IdeaCard } from "@/components/IdeaCard";
import { EmptyState } from "@/components/EmptyState";

export function IdeaListSections({
  scheduled,
  unscheduled,
  basePath,
}: {
  scheduled: ScheduledPost[];
  unscheduled: Post[];
  basePath: string;
}) {
  return (
    <div className="px-4 flex flex-col gap-6">
      <section>
        <h2 className="font-display text-2xl tracking-wide mb-2.5 text-white/85">
          Not scheduled
        </h2>
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
        <h2 className="font-display text-2xl tracking-wide mb-2.5 text-white/85">
          Scheduled
        </h2>
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
    </div>
  );
}
