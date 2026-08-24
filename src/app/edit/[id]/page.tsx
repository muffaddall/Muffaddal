import { notFound } from "next/navigation";
import { getPost } from "@/lib/posts";
import { PostForm } from "@/components/PostForm";

export default async function EditPostPage(props: PageProps<"/edit/[id]">) {
  const { id } = await props.params;
  const post = await getPost(id);

  if (!post) notFound();

  return <PostForm mode="edit" postId={post.id} initial={post} />;
}
