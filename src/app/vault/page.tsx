import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { ContentSectionTabs } from "@/components/ContentSectionTabs";
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
      <div className="flex justify-center px-4 mb-4">
        <ContentSectionTabs active="vault" />
      </div>

      {isEmpty ? (
        <div className="px-4">
          <EmptyState label="No ideas yet. Tap + New Idea to start your first one." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex items-start gap-4 px-4 pb-2" style={{ width: "max-content" }}>
            {groupsData.map(({ group, scheduled, unscheduled, posted }) => {
              const basePath = group ? `/vault/group/${group.id}` : "/vault/ungrouped";
              return (
                <div
                  key={group?.id ?? "ungrouped"}
                  className="w-[300px] shrink-0 rounded-2xl border border-white/8 bg-[var(--color-surface)] p-4"
                >
                  <h2
                    className="font-display text-2xl leading-none mb-4 pb-3 border-b-2 text-white"
                    style={{ borderColor: "var(--color-shoot)" }}
                  >
                    {group ? group.name : "Ungrouped"}
                  </h2>
                  <IdeaListSections
                    scheduled={scheduled}
                    unscheduled={unscheduled}
                    posted={posted}
                    basePath={basePath}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
