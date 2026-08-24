import Link from "next/link";
import { MenuButton } from "@/components/MenuButton";
import { DayContent } from "@/components/DayContent";
import { quoteOfTheDay } from "@/lib/quotes";
import { todayStr } from "@/lib/date";

export default async function HomePage(props: PageProps<"/">) {
  const searchParams = await props.searchParams;
  const dateParam = searchParams.date;
  const date = typeof dateParam === "string" ? dateParam : todayStr();

  return (
    <div className="pb-10">
      <div className="flex items-center px-4 pt-4 pb-2">
        <MenuButton />
        <Link
          href="/add?from=/"
          className="ml-auto flex items-center gap-1 rounded-full bg-[var(--color-post)] text-black text-sm font-semibold px-4 py-1.5 active:scale-95 transition-transform"
        >
          <span className="text-base leading-none">+</span> Add post
        </Link>
      </div>

      <div className="px-4 mt-3 mb-6">
        <h1 className="font-display text-4xl tracking-wide leading-none mb-2">
          Welcome back
        </h1>
        <p className="text-sm text-white/45 italic">&ldquo;{quoteOfTheDay()}&rdquo;</p>
      </div>

      <DayContent date={date} basePath="/" />
    </div>
  );
}
