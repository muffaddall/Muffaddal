import { PageHeader } from "@/components/PageHeader";
import { getAllFormats } from "@/lib/tourneys";
import { PadelSectionTabs } from "../PadelSectionTabs";
import FormatRow from "./FormatRow";
import AddFormatForm from "./AddFormatForm";

export const dynamic = "force-dynamic";

export default async function FormatsPage() {
  const formats = await getAllFormats();

  return (
    <div className="pb-10">
      <PageHeader title="Formats" subtitle="Padel" />
      <div className="flex justify-center mb-4">
        <PadelSectionTabs active="formats" />
      </div>
      <main className="mx-auto max-w-xl px-4 sm:px-6">
        <p className="text-xs text-white/40 mb-6 text-center">
          Save your usual tournament shapes here — group sizes, how many qualify per group, wildcard slots, and
          optionally a court-fee preset — so you can pick one when you draw groups instead of retyping it every time.
        </p>

        <ul className="flex flex-col gap-1 mb-6">
          {formats.map((f) => (
            <FormatRow key={f.id} format={f} />
          ))}
          {formats.length === 0 && <li className="text-sm text-white/30 py-2 text-center">No formats yet.</li>}
        </ul>

        <AddFormatForm />
      </main>
    </div>
  );
}
