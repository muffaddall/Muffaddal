import { notFound } from "next/navigation";
import { getPost } from "@/lib/posts";
import { PostWizard } from "@/components/PostWizard";

export default async function EditPostPage(props: PageProps<"/edit/[id]">) {
  const { id } = await props.params;
  const post = await getPost(id);

  if (!post) notFound();

  return <PostWizard mode="edit" postId={post.id} initial={post} />;
}
