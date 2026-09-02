import { PageHeader } from "@/components/PageHeader";
import { ContentSectionTabs } from "@/components/ContentSectionTabs";
import { EmptyState } from "@/components/EmptyState";
import { getAllPodcastEpisodes } from "@/lib/podcast";
import { isPodcastScheduled } from "@/lib/types";
import EpisodeRow from "./EpisodeRow";
import AddEpisodeForm from "./AddEpisodeForm";

export const dynamic = "force-dynamic";

export default async function PodcastPage() {
  const episodes = await getAllPodcastEpisodes();
  const ideas = episodes.filter((e) => !isPodcastScheduled(e));
  const scheduled = episodes
    .filter(isPodcastScheduled)
    .sort((a, b) => (a.shootDate ?? "").localeCompare(b.shootDate ?? ""));

  return (
    <div className="pb-10">
      <PageHeader title="Podcast" />
      <div className="flex justify-center px-4 mb-4">
        <ContentSectionTabs active="podcast" />
      </div>

      <main className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="flex justify-center mb-8">
          <AddEpisodeForm />
        </div>

        <section className="mb-8">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-shoot)" }}>
            Podcast Ideas
          </h2>
          {ideas.length === 0 ? (
            <EmptyState label="No podcast ideas yet." />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {ideas.map((episode) => (
                <EpisodeRow key={episode.id} episode={episode} />
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-edit)" }}>
            Podcast Schedule
          </h2>
          {scheduled.length === 0 ? (
            <EmptyState label="Nothing scheduled yet." />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {scheduled.map((episode) => (
                <EpisodeRow key={episode.id} episode={episode} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
