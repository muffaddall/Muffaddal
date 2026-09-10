import { PageHeader } from "@/components/PageHeader";
import { getAllFormats } from "@/lib/tourneys";
import FormatRow from "./FormatRow";
import AddFormatForm from "./AddFormatForm";

export const dynamic = "force-dynamic";

export default async function FormatsPage() {
  const formats = await getAllFormats();

  return (
    <div className="pb-10">
      <PageHeader title="Formats" subtitle="Padel" />
      <main className="mx-auto max-w-xl px-4 sm:px-6">
        <p className="text-xs text-white/40 mb-6 text-center">
          Save your usual group counts here so you can pick one when you draw groups for a tournament, instead of
          typing a number each time.
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
