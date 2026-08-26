import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { IdeaListSections } from "@/components/IdeaListSections";
import { getGroup, getIdeasForGroup } from "@/lib/groups";

export const dynamic = "force-dynamic";

export default async function VaultGroupPage(props: PageProps<"/vault/group/[id]">) {
  const { id } = await props.params;
  const group = await getGroup(id);
  if (!group) notFound();

  const { scheduled, unscheduled, posted } = await getIdeasForGroup(id);
  const basePath = `/vault/group/${id}`;

  return (
    <div className="pb-10">
      <PageHeader
        title={group.name}
        subtitle={
          <Link href="/vault" className="text-white/40">
            ‹ Idea Vault
          </Link>
        }
        right={
          <Link
            href={`/new-idea?from=${basePath}&group=${id}`}
            className="flex items-center gap-1 rounded-full bg-[var(--color-post)] text-black text-sm font-semibold px-4 py-1.5 active:scale-95 transition-transform"
          >
            <span className="text-base leading-none">+</span> New Idea
          </Link>
        }
      />

      <div className="px-4">
        <IdeaListSections
          scheduled={scheduled}
          unscheduled={unscheduled}
          posted={posted}
          basePath={basePath}
        />
      </div>
    </div>
  );
}
