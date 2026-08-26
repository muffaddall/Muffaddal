import type { ReactNode } from "react";
import { MenuButton } from "@/components/MenuButton";
import { HomeButton } from "@/components/HomeButton";

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
    <div className="relative flex items-center justify-center px-4 pt-4 pb-3 min-h-[4.5rem]">
      <div className="absolute left-4 flex items-center gap-2">
        {showHome && <HomeButton />}
        <MenuButton />
      </div>
      {right && <div className="absolute right-4 flex items-center">{right}</div>}
      <div className="text-center px-16">
        {subtitle && <p className="text-sm text-white/40 mb-0.5">{subtitle}</p>}
        <h1 className="font-display text-5xl sm:text-6xl leading-none tracking-wide">
          {title}
        </h1>
      </div>
    </div>
  );
}
