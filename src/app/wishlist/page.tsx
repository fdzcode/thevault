"use client";

import Image from "next/image";
import Link from "next/link";
import { api } from "~/trpc/react";
import { toast } from "sonner";

export default function WishlistPage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.wishlist.getMyWishlist.useInfiniteQuery(
      { limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  const utils = api.useUtils();

  const removeMutation = api.wishlist.toggle.useMutation({
    onSuccess: () => {
      void utils.wishlist.getMyWishlist.invalidate();
      toast.success("Removed from wishlist");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const allItems = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">My Wishlist</h1>

      {isLoading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : allItems.length === 0 ? (
        <div className="rounded border border-zinc-800 p-8 text-center">
          <p className="text-zinc-500">Your wishlist is empty.</p>
          <Link
            href="/listings"
            className="mt-4 inline-block text-sm text-zinc-400 transition hover:text-white"
          >
            Browse listings
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allItems.map((item) => {
              const listing = item.listing;
              const images: string[] = (() => {
                try {
                  return JSON.parse(listing.images) as string[];
                } catch {
                  return [];
                }
              })();

              return (
                <div
                  key={item.id}
                  className="rounded border border-zinc-800 p-4 transition hover:border-zinc-600"
                >
                  <Link href={`/listings/${listing.id}`}>
                    {images.length > 0 ? (
                      <div className="relative mb-3 h-40 w-full overflow-hidden rounded">
                        <Image
                          src={images[0]!}
                          alt={listing.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="mb-3 flex h-40 w-full items-center justify-center rounded bg-zinc-800 text-zinc-600">
                        No image
                      </div>
                    )}
                    <h2 className="font-semibold text-white">
                      {listing.title}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-400">
                      ${(listing.price / 100).toFixed(2)}
                    </p>
                  </Link>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-zinc-500">
                      {listing.seller.profile?.displayName ??
                        listing.seller.name}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        removeMutation.mutate({ listingId: listing.id })
                      }
                      disabled={removeMutation.isPending}
                      className="text-xs text-zinc-500 transition hover:text-red-400 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {hasNextPage && (
            <div className="mt-6 text-center">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="rounded border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
              >
                {isFetchingNextPage ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
