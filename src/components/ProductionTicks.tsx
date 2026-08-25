import { StatusTick } from "@/components/StatusTick";

type ProductionFlags = {
  shotDone: boolean;
  editedDone: boolean;
};

export function ProductionTicks({
  post,
  size = "sm",
}: {
  post: ProductionFlags;
  size?: "sm" | "md";
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <StatusTick
        label="S"
        done={post.shotDone}
        title={`Shot: ${post.shotDone ? "done" : "not done"}`}
        size={size}
      />
      <StatusTick
        label="E"
        done={post.editedDone}
        title={`Edited: ${post.editedDone ? "done" : "not done"}`}
        size={size}
      />
    </span>
  );
}
