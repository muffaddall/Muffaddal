export function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 py-6 text-center text-sm text-white/35">
      {label}
    </div>
  );
}
