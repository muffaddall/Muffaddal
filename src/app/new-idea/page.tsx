import { PostForm } from "@/components/PostForm";
import { getGroups } from "@/lib/groups";

export default async function NewIdeaPage(props: PageProps<"/new-idea">) {
  const searchParams = await props.searchParams;
  const from = searchParams.from;
  const returnTo = typeof from === "string" ? from : "/";
  const groupParam = searchParams.group;
  const initialGroupId = typeof groupParam === "string" ? groupParam : undefined;

  const groups = await getGroups();

  return (
    <PostForm
      mode="add"
      returnTo={returnTo}
      groups={groups}
      initialGroupId={initialGroupId}
    />
  );
}
