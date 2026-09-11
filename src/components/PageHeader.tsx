import type { ReactNode } from "react";
import { MenuButton } from "@/components/MenuButton";
import { HomeButton } from "@/components/HomeButton";
import { BackButton } from "@/components/BackButton";
import { NotesButton } from "@/components/NotesButton";

export function PageHeader({
  title,
  subtitle,
  right,
  showHome = true,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  showHome?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 px-4 pt-4 pb-3 min-h-[4.5rem]">
      <div className="flex items-center gap-2 shrink-0">
        <BackButton />
        {showHome && <HomeButton />}
        <MenuButton />
        <NotesButton />
      </div>
      <div className="flex-1 min-w-0 text-center">
        {subtitle && <p className="text-sm text-white/40 mb-0.5 truncate">{subtitle}</p>}
        <h1 className="font-display text-5xl sm:text-6xl leading-none tracking-wide break-words">
          {title}
        </h1>
      </div>
      <div className="flex items-center shrink-0">{right}</div>
    </div>
  );
}
