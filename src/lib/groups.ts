import "server-only";
import { supabase } from "@/lib/supabase";
import { getPostsByGroup } from "@/lib/posts";
import { isScheduled, type Group, type Post, type ScheduledPost } from "@/lib/types";

type GroupRow = {
  id: string;
  name: string;
  created_at: string;
};

function fromRow(row: GroupRow): Group {
  return { id: row.id, name: row.name, createdAt: row.created_at };
}

export async function getGroups(): Promise<Group[]> {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function getGroup(id: string): Promise<Group | null> {
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? fromRow(data) : null;
}

export async function createGroup(name: string): Promise<Group> {
  const { data, error } = await supabase
    .from("groups")
    .insert({ name })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return fromRow(data);
}

export async function getIdeasForGroup(groupId: string | null): Promise<{
  scheduled: ScheduledPost[];
  unscheduled: Post[];
}> {
  const posts = await getPostsByGroup(groupId);
  return {
    scheduled: posts.filter(isScheduled),
    unscheduled: posts.filter((p) => !isScheduled(p)),
  };
}

export type VaultOverview = {
  groups: { group: Group; scheduledCount: number; unscheduledCount: number }[];
  ungrouped: { scheduledCount: number; unscheduledCount: number };
};

export async function getVaultOverview(): Promise<VaultOverview> {
  const [groups, { data: postRows, error }] = await Promise.all([
    getGroups(),
    supabase.from("posts").select("group_id, post_date"),
  ]);

  if (error) throw new Error(error.message);

  const counts = new Map<string, { scheduledCount: number; unscheduledCount: number }>();
  let ungroupedScheduled = 0;
  let ungroupedUnscheduled = 0;

  for (const row of postRows ?? []) {
    const scheduled = row.post_date !== null;
    if (row.group_id === null) {
      if (scheduled) ungroupedScheduled += 1;
      else ungroupedUnscheduled += 1;
      continue;
    }
    const entry = counts.get(row.group_id) ?? { scheduledCount: 0, unscheduledCount: 0 };
    if (scheduled) entry.scheduledCount += 1;
    else entry.unscheduledCount += 1;
    counts.set(row.group_id, entry);
  }

  return {
    groups: groups.map((group) => ({
      group,
      scheduledCount: counts.get(group.id)?.scheduledCount ?? 0,
      unscheduledCount: counts.get(group.id)?.unscheduledCount ?? 0,
    })),
    ungrouped: {
      scheduledCount: ungroupedScheduled,
      unscheduledCount: ungroupedUnscheduled,
    },
  };
}
