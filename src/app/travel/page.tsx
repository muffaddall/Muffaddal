import { PageHeader } from "@/components/PageHeader";
import { FinanceSectionTabs } from "@/components/FinanceSectionTabs";
import { getAllTripWallets, getTrips } from "@/lib/trips";
import type { TripWallet } from "@/lib/types";
import AddTripForm from "./AddTripForm";
import TripRow from "./TripRow";

export const dynamic = "force-dynamic";

export default async function TravelPage() {
  const [trips, wallets] = await Promise.all([getTrips(), getAllTripWallets()]);

  const walletsByTrip = new Map<string, TripWallet[]>();
  for (const w of wallets) {
    const list = walletsByTrip.get(w.tripId);
    if (list) list.push(w);
    else walletsByTrip.set(w.tripId, [w]);
  }

  return (
    <div className="pb-10">
      <PageHeader title="Travel" />
      <div className="flex justify-center mb-4">
        <FinanceSectionTabs active="travel" />
      </div>
      <main className="mx-auto max-w-2xl px-4 sm:px-6">
        <p className="text-xs text-[var(--color-fg-dim)] mb-4 text-center">
          Each trip gets its own currency wallets and expense diary, kept separate from your
          regular Day-to-Day accounts.
        </p>
        <ul className="flex flex-col gap-2 mb-6">
          {trips.map((trip) => (
            <TripRow key={trip.id} trip={trip} wallets={walletsByTrip.get(trip.id) ?? []} />
          ))}
          {trips.length === 0 && (
            <li className="text-sm text-[var(--color-fg-dim)] py-6 text-center">No trips yet.</li>
          )}
        </ul>
        <AddTripForm />
      </main>
    </div>
  );
}
