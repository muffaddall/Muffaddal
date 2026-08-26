import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { IdeaListSections } from "@/components/IdeaListSections";
import { getVaultData } from "@/lib/groups";

export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const groupsData = await getVaultData();
  const isEmpty = groupsData.every(
    ({ scheduled, unscheduled, posted }) =>
      scheduled.length === 0 && unscheduled.length === 0 && posted.length === 0
  );

  return (
    <div className="pb-10">
      <PageHeader
        title="Idea Vault"
        right={
          <Link
            href="/new-idea?from=/vault"
            className="flex items-center gap-1 rounded-full bg-[var(--color-post)] text-black text-sm font-semibold px-4 py-1.5 active:scale-95 transition-transform"
          >
            <span className="text-base leading-none">+</span> New Idea
          </Link>
        }
      />

      <div className="px-4 flex flex-col gap-8">
        {isEmpty && (
          <EmptyState label="No ideas yet. Tap + New Idea to start your first one." />
        )}

        {groupsData.map(({ group, scheduled, unscheduled, posted }) => {
          const basePath = group ? `/vault/group/${group.id}` : "/vault/ungrouped";
          return (
            <section key={group?.id ?? "ungrouped"}>
              <h2 className="font-display text-3xl tracking-wide leading-none mb-4 pb-2 border-b border-white/10">
                {group ? group.name : "Ungrouped"}
              </h2>
              <IdeaListSections
                scheduled={scheduled}
                unscheduled={unscheduled}
                posted={posted}
                basePath={basePath}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
