import type { PostType } from "@/lib/types";

const TYPE_STYLES: Record<PostType, { bg: string; fg: string }> = {
  Reel: { bg: "rgba(167,139,250,0.16)", fg: "var(--color-type-reel)" },
  Carousel: { bg: "rgba(255,122,198,0.16)", fg: "var(--color-type-carousel)" },
  "Static Post": { bg: "rgba(52,211,153,0.16)", fg: "var(--color-type-static)" },
  Story: { bg: "rgba(99,102,241,0.18)", fg: "var(--color-type-story)" },
  Other: { bg: "rgba(148,163,184,0.16)", fg: "var(--color-type-other)" },
};

export function TypeBadge({ type }: { type: PostType }) {
  const style = TYPE_STYLES[type];
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap"
      style={{ background: style.bg, color: style.fg }}
    >
      {type}
    </span>
  );
}
