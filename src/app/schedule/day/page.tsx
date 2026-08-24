import { TopBar } from "@/components/TopBar";
import { DayContent } from "@/components/DayContent";
import { todayStr } from "@/lib/date";

export default async function ScheduleDayPage(props: PageProps<"/schedule/day">) {
  const searchParams = await props.searchParams;
  const dateParam = searchParams.date;
  const date = typeof dateParam === "string" ? dateParam : todayStr();

  return (
    <div className="pb-10">
      <TopBar active="day" />
      <DayContent date={date} basePath="/schedule/day" />
    </div>
  );
}
