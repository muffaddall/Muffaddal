export function StatusTick({
  label,
  done,
  title,
  size = "sm",
}: {
  label: string;
  done: boolean;
  title?: string;
  size?: "sm" | "md";
}) {
  const dims = size === "md" ? "h-6 w-6 text-[11px]" : "h-4 w-4 text-[9px]";

  return (
    <span
      title={title}
      className={`inline-flex items-center justify-center rounded-full font-bold shrink-0 ${dims} ${
        done
          ? "bg-[var(--color-type-static)] text-black"
          : "border border-white/15 text-white/25"
      }`}
    >
      {label}
    </span>
  );
}
