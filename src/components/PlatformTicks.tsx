import { PLATFORMS } from "@/lib/types";

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
  const dims = size === "md" ? "h-6 w-6 text-[11px]" : "h-4 w-4 text-[9px]";

  return (
    <span className="inline-flex items-center gap-1">
      {PLATFORMS.map(({ key, initial, label }) => {
        const posted = post[key];
        return (
          <span
            key={key}
            title={`${label}: ${posted ? "posted" : "not posted"}`}
            className={`inline-flex items-center justify-center rounded-full font-bold shrink-0 ${dims} ${
              posted
                ? "bg-[var(--color-type-static)] text-black"
                : "border border-white/15 text-white/25"
            }`}
          >
            {initial}
          </span>
        );
      })}
    </span>
  );
}
