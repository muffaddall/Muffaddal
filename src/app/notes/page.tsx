import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { getNotes } from "@/lib/notes";
import AddNoteForm from "./AddNoteForm";
import NoteCard from "./NoteCard";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const notes = await getNotes();

  return (
    <div className="pb-10">
      <PageHeader title="Notes" />
      <main className="mx-auto max-w-xl px-4 sm:px-6 flex flex-col gap-4">
        <AddNoteForm />
        <div className="flex flex-col gap-2">
          {notes.length === 0 && <EmptyState label="No notes yet — write one above." />}
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      </main>
    </div>
  );
}
