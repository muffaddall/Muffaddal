import { notFound } from "next/navigation";
import { getPost } from "@/lib/posts";
import { getGroups } from "@/lib/groups";
import { PostForm } from "@/components/PostForm";

export default async function EditPostPage(props: PageProps<"/edit/[id]">) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const from = searchParams.from;
  const returnTo = typeof from === "string" ? from : "/";
  const scheduleParam = searchParams.schedule;

  const [post, groups] = await Promise.all([getPost(id), getGroups()]);

  if (!post) notFound();

  return (
    <PostForm
      mode="edit"
      postId={post.id}
      initial={post}
      returnTo={returnTo}
      groups={groups}
      initialScheduleOpen={scheduleParam === "1" ? true : undefined}
    />
  );
}
