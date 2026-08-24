import Link from "next/link";
import { MenuButton } from "@/components/MenuButton";
import { EmptyState } from "@/components/EmptyState";
import { getVaultOverview } from "@/lib/groups";

export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const { groups, ungrouped } = await getVaultOverview();
  const hasUngrouped = ungrouped.scheduledCount + ungrouped.unscheduledCount > 0;

  return (
    <div className="pb-10">
      <div className="flex items-center px-4 pt-4 pb-2">
        <MenuButton />
        <Link
          href="/new-idea?from=/vault"
          className="ml-auto flex items-center gap-1 rounded-full bg-[var(--color-post)] text-black text-sm font-semibold px-4 py-1.5 active:scale-95 transition-transform"
        >
          <span className="text-base leading-none">+</span> New Idea
        </Link>
      </div>

      <div className="px-4 mt-3 mb-5">
        <h1 className="font-display text-4xl tracking-wide leading-none">
          Idea Vault
        </h1>
      </div>

      <div className="px-4 flex flex-col gap-2.5">
        {groups.length === 0 && !hasUngrouped && (
          <EmptyState label="No ideas yet. Tap + New Idea to start your first one." />
        )}

        {groups.map(({ group, scheduledCount, unscheduledCount }) => (
          <GroupTile
            key={group.id}
            href={`/vault/group/${group.id}`}
            name={group.name}
            scheduledCount={scheduledCount}
            unscheduledCount={unscheduledCount}
          />
        ))}

        {hasUngrouped && (
          <GroupTile
            href="/vault/ungrouped"
            name="Ungrouped"
            scheduledCount={ungrouped.scheduledCount}
            unscheduledCount={ungrouped.unscheduledCount}
          />
        )}
      </div>
    </div>
  );
}

function GroupTile({
  href,
  name,
  scheduledCount,
  unscheduledCount,
}: {
  href: string;
  name: string;
  scheduledCount: number;
  unscheduledCount: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl bg-[var(--color-surface)] border border-white/8 p-4 active:scale-[0.99] transition-transform"
    >
      <span className="font-semibold text-base">{name}</span>
      <span className="text-xs text-white/45">
        {unscheduledCount > 0 && (
          <span className="text-white/70">{unscheduledCount} to schedule</span>
        )}
        {unscheduledCount > 0 && scheduledCount > 0 && " · "}
        {scheduledCount > 0 && `${scheduledCount} scheduled`}
        {unscheduledCount === 0 && scheduledCount === 0 && "Empty"}
      </span>
    </Link>
  );
}
