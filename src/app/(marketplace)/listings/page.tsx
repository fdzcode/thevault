import Link from "next/link";
import { api } from "~/trpc/server";

export default async function ListingsPage() {
  const [{ listings }, recentlySold] = await Promise.all([
    api.listing.search({}),
    api.listing.recentlySold(),
  ]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {recentlySold.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Recently Sold
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentlySold.map((item) => (
              <div
                key={item.id}
                className="shrink-0 rounded border border-zinc-800 px-3 py-2"
              >
                <p className="text-sm font-medium text-zinc-300">{item.title}</p>
                <p className="text-xs text-zinc-500">
                  ${(item.price / 100).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

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
