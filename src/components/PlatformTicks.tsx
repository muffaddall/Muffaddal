import { PLATFORMS } from "@/lib/types";
import { StatusTick } from "@/components/StatusTick";

type PostedFlags = {
  postedTiktok: boolean;
  postedYoutube: boolean;
  postedInstagram: boolean;
};

export function PlatformTicks({
  post,
  size = "sm",
}: {
  post: PostedFlags;
  size?: "sm" | "md";
}) {
  return (
    <span className="inline-flex items-center gap-1">
      {PLATFORMS.map(({ key, initial, label }) => {
        const posted = post[key];
        return (
          <StatusTick
            key={key}
            label={initial}
            done={posted}
            title={`${label}: ${posted ? "posted" : "not posted"}`}
            size={size}
          />
        );
      })}
    </span>
  );
}
