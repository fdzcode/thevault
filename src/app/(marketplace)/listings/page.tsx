import Link from "next/link";
import { api } from "~/trpc/server";

export default async function ListingsPage() {
  const { listings } = await api.listing.search({});

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Browse Listings</h1>
        <Link
          href="/listings/new"
          className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
        >
          Create Listing
        </Link>
      </div>
      {listings.length === 0 ? (
        <p className="text-zinc-500">No listings yet.</p>
      ) : (
        <ul className="space-y-4">
          {listings.map((listing) => (
            <li key={listing.id}>
              <Link
                href={`/listings/${listing.id}`}
                className="block rounded border border-zinc-800 p-4 hover:border-zinc-600"
              >
                <h2 className="font-semibold">{listing.title}</h2>
                <p className="text-sm text-zinc-400">
                  ${(listing.price / 100).toFixed(2)} &middot;{" "}
                  {listing.category} &middot; {listing.condition}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
