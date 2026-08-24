import Link from "next/link";
import { notFound } from "next/navigation";
import { MenuButton } from "@/components/MenuButton";
import { IdeaListSections } from "@/components/IdeaListSections";
import { getGroup, getIdeasForGroup } from "@/lib/groups";

export const dynamic = "force-dynamic";

export default async function VaultGroupPage(props: PageProps<"/vault/group/[id]">) {
  const { id } = await props.params;
  const group = await getGroup(id);
  if (!group) notFound();

  const { scheduled, unscheduled } = await getIdeasForGroup(id);
  const basePath = `/vault/group/${id}`;

  return (
    <div className="pb-10">
      <div className="flex items-center px-4 pt-4 pb-2">
        <MenuButton />
        <Link
          href={`/new-idea?from=${basePath}&group=${id}`}
          className="ml-auto flex items-center gap-1 rounded-full bg-[var(--color-post)] text-black text-sm font-semibold px-4 py-1.5 active:scale-95 transition-transform"
        >
          <span className="text-base leading-none">+</span> New Idea
        </Link>
      </div>

      <div className="px-4 mt-3 mb-5">
        <Link href="/vault" className="text-xs text-white/40 mb-1 inline-block">
          ‹ Idea Vault
        </Link>
        <h1 className="font-display text-4xl tracking-wide leading-none">
          {group.name}
        </h1>
      </div>

      <IdeaListSections
        scheduled={scheduled}
        unscheduled={unscheduled}
        basePath={basePath}
      />
    </div>
  );
}
