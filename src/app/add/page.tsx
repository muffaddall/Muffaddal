import { PostForm } from "@/components/PostForm";

export default async function AddPostPage(props: PageProps<"/add">) {
  const searchParams = await props.searchParams;
  const from = searchParams.from;
  const returnTo = typeof from === "string" ? from : "/";

  return <PostForm mode="add" returnTo={returnTo} />;
}
