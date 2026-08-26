import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { IdeaListSections } from "@/components/IdeaListSections";
import { getIdeasForGroup } from "@/lib/groups";

export const dynamic = "force-dynamic";

export default async function VaultUngroupedPage() {
  const { scheduled, unscheduled } = await getIdeasForGroup(null);
  const basePath = "/vault/ungrouped";

  return (
    <div className="pb-10">
      <PageHeader
        title="Ungrouped"
        subtitle={
          <Link href="/vault" className="text-white/40">
            ‹ Idea Vault
          </Link>
        }
        right={
          <Link
            href={`/new-idea?from=${basePath}`}
            className="flex items-center gap-1 rounded-full bg-[var(--color-post)] text-black text-sm font-semibold px-4 py-1.5 active:scale-95 transition-transform"
          >
            <span className="text-base leading-none">+</span> New Idea
          </Link>
        }
      />

      <IdeaListSections
        scheduled={scheduled}
        unscheduled={unscheduled}
        basePath={basePath}
      />
    </div>
  );
}
