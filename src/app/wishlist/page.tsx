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
    <main className="page-bg min-h-screen">
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-800 to-transparent px-4 pb-16 pt-20 text-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/4 h-1 w-1 rounded-full bg-[#D4AF37]/30 animate-gold-pulse" />
          <div className="absolute top-1/2 right-1/3 h-1 w-1 rounded-full bg-[#D4AF37]/20 animate-gold-pulse" style={{ animationDelay: "2s" }} />
        </div>
        <div className="relative z-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/10 animate-float">
            <svg className="h-8 w-8 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </div>
          <p className="text-muted text-xs tracking-widest uppercase mb-3">Collection</p>
          <h1 className="font-display text-5xl font-light gradient-text">My Wishlist</h1>
          <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
          {!isLoading && allItems.length > 0 && (
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              <span className="font-semibold text-[#D4AF37]">{allItems.length}</span> saved item{allItems.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 pb-16">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-4">
                <div className="mb-3 h-40 w-full animate-shimmer rounded-xl bg-[var(--divider)]" />
                <div className="h-5 w-3/4 animate-shimmer rounded-lg bg-[var(--divider)]" />
                <div className="mt-2 h-4 w-1/3 animate-shimmer rounded-lg bg-[var(--divider)]" />
              </div>
            ))}
          </div>
        ) : allItems.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="font-display text-xl italic text-[var(--text-muted)]">Your wishlist is empty.</p>
            <Link
              href="/listings"
              className="mt-6 inline-block rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8960C] px-6 py-2.5 font-semibold text-black transition hover:shadow-lg hover:shadow-[#D4AF37]/20"
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
                    className="trade-card p-4"
                  >
                    <Link href={`/listings/${listing.id}`}>
                      {images.length > 0 ? (
                        <div className="relative mb-3 h-40 w-full overflow-hidden rounded-xl">
                          <Image
                            src={images[0]!}
                            alt={listing.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-300 hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="mb-3 flex h-40 w-full items-center justify-center rounded-xl bg-[var(--card-bg)] text-[var(--text-muted)] text-sm">
                          No image
                        </div>
                      )}
                      <h2 className="font-semibold text-[var(--text-heading)]">
                        {listing.title}
                      </h2>
                      <p className="mt-1 font-display text-lg text-[#D4AF37]">
                        ${(listing.price / 100).toFixed(2)}
                      </p>
                    </Link>
                    <div className="mt-3 flex items-center justify-between border-t border-[var(--divider)] pt-3">
                      <span className="text-xs text-[var(--text-muted)]">
                        {listing.seller.profile?.displayName ??
                          listing.seller.name}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          removeMutation.mutate({ listingId: listing.id })
                        }
                        disabled={removeMutation.isPending}
                        className="rounded-lg px-3 py-1 text-xs text-[var(--text-muted)] transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasNextPage && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="glass-card rounded-xl px-6 py-2.5 font-medium text-[var(--text-body)] transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37] disabled:opacity-50"
                >
                  {isFetchingNextPage ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t divider-line py-8 text-center">
        <p className="font-display text-sm tracking-widest gradient-text">THE VAULT</p>
      </footer>
    </main>
  );
}
