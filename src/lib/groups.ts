import "server-only";
import { supabase } from "@/lib/supabase";
import { getAllPosts, getPostsByGroup } from "@/lib/posts";
import { isFullyPosted, isScheduled, type Group, type Post, type ScheduledPost } from "@/lib/types";

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

export type IdeaBuckets = {
  scheduled: ScheduledPost[];
  unscheduled: Post[];
  posted: ScheduledPost[];
};

function bucketPosts(posts: Post[]): IdeaBuckets {
  const scheduledAll = posts.filter(isScheduled);
  return {
    scheduled: scheduledAll.filter((p) => !isFullyPosted(p)),
    posted: scheduledAll.filter(isFullyPosted),
    unscheduled: posts.filter((p) => !isScheduled(p)),
  };
}

export async function getIdeasForGroup(groupId: string | null): Promise<IdeaBuckets> {
  const posts = await getPostsByGroup(groupId);
  return bucketPosts(posts);
}

export type VaultGroupData = IdeaBuckets & { group: Group | null };

// Everything the Vault page needs in one shot: every group (plus an
// "ungrouped" bucket) with its ideas already split into
// not-scheduled / scheduled / posted.
export async function getVaultData(): Promise<VaultGroupData[]> {
  const [groups, posts] = await Promise.all([getGroups(), getAllPosts()]);

  const byGroup = new Map<string | null, Post[]>();
  for (const post of posts) {
    const key = post.groupId;
    const list = byGroup.get(key);
    if (list) list.push(post);
    else byGroup.set(key, [post]);
  }

  const result: VaultGroupData[] = groups.map((group) => ({
    group,
    ...bucketPosts(byGroup.get(group.id) ?? []),
  }));

  const ungrouped = byGroup.get(null) ?? [];
  if (ungrouped.length > 0) {
    result.push({ group: null, ...bucketPosts(ungrouped) });
  }

  return result;
}
