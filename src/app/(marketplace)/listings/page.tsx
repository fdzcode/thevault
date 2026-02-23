"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { api } from "~/trpc/react";
import {
  CATEGORIES,
  CONDITIONS,
  LISTING_TYPES,
  SORT_OPTIONS,
  CONDITION_BADGE_STYLES,
  LISTING_TYPE_BADGE_STYLES,
  safeParseImages,
  labelFor,
} from "~/lib/constants";

type CategoryValue = (typeof CATEGORIES)[number]["value"];
type ConditionValue = (typeof CONDITIONS)[number]["value"];
type SortValue = (typeof SORT_OPTIONS)[number]["value"];
type ListingTypeValue = "for_sale" | "trade" | "both" | "";

// "All" prepended for the filter dropdown
const LISTING_TYPE_FILTER_OPTIONS = [{ value: "", label: "All" }, ...LISTING_TYPES] as const;

function listingTypeLabel(value: string): string {
  if (value === "for_sale") return "For Sale";
  if (value === "trade") return "Trade";
  if (value === "both") return "Sale / Trade";
  return value;
}

function SkeletonCard() {
  return (
    <div className="trade-card">
      <div className="aspect-square animate-shimmer bg-gradient-to-br from-zinc-900 to-black" />
      <div className="space-y-2 p-5">
        <div className="h-3 w-1/3 rounded-full bg-[var(--divider)] animate-shimmer" />
        <div className="h-5 w-3/4 rounded-lg bg-[var(--divider)] animate-shimmer" />
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full bg-[var(--divider)] animate-shimmer" />
          <div className="h-5 w-14 rounded-full bg-[var(--divider)] animate-shimmer" />
        </div>
        <div className="h-4 w-1/3 rounded-lg bg-[var(--divider)] animate-shimmer" />
      </div>
    </div>
  );
}

function ListingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [listingType, setListingType] = useState<ListingTypeValue>("");
  const [category, setCategory] = useState<CategoryValue | "">("");
  const [condition, setCondition] = useState<ConditionValue | "">("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<SortValue>("newest");

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setQuery(q);
  }, [searchParams]);

  const recentlySold = api.listing.recentlySold.useQuery();

  const searchInput = {
    query: query || undefined,
    listingType: listingType || undefined,
    category: category || undefined,
    condition: condition || undefined,
    minPrice: minPrice ? Math.round(parseFloat(minPrice) * 100) : undefined,
    maxPrice: maxPrice ? Math.round(parseFloat(maxPrice) * 100) : undefined,
    sort,
    limit: 18,
  };

  const listingsQuery = api.listing.search.useInfiniteQuery(searchInput, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const allListings = listingsQuery.data?.pages.flatMap((p) => p.listings) ?? [];

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (
        entry?.isIntersecting &&
        listingsQuery.hasNextPage &&
        !listingsQuery.isFetchingNextPage
      ) {
        void listingsQuery.fetchNextPage();
      }
    },
    [listingsQuery],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, {
      rootMargin: "200px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  const clearFilters = () => {
    setQuery("");
    setListingType("");
    setCategory("");
    setCondition("");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    router.replace("/listings");
  };

  const hasActiveFilters =
    query || listingType || category || condition || minPrice || maxPrice || sort !== "newest";

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const selectClass =
    "rounded-xl border border-[var(--divider)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-heading)] focus:border-[#D4AF37] focus:outline-none transition";

  return (
    <div className="page-bg min-h-screen">
      {/* Header Area */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 pt-12 pb-8 text-center">
          {/* Floating icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center animate-float">
            <svg className="h-8 w-8 text-[#D4AF37]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-6L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
            </svg>
          </div>
          <p className="gradient-text text-sm font-semibold tracking-widest uppercase mb-2">The Market</p>
          <p className="text-muted text-xs tracking-widest uppercase mb-4">PEER-TO-PEER TRADING</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--text-heading)]">
            Buy. Sell. <span className="gradient-text italic">Trade.</span>
          </h1>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pb-12">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="mb-6">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search listings..."
              className="input-bg w-full rounded-full border pl-11 pr-5 py-3 text-sm focus:outline-none focus:border-[#D4AF37] transition placeholder:text-[var(--input-placeholder)]"
            />
          </div>
        </form>

        {/* Listing Type Filter Pills + List a Piece CTA */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {LISTING_TYPE_FILTER_OPTIONS.map((t) => (
              <button
                key={t.value}
                onClick={() => setListingType(t.value as ListingTypeValue)}
                className={`rounded-full px-5 py-2 text-sm transition ${
                  listingType === t.value
                    ? "bg-[#D4AF37] text-black font-semibold"
                    : "glass-effect text-body border border-white/5 hover:border-[#D4AF37]/30"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <Link
              href="/listings/new"
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#F4E5C3] px-5 py-2.5 text-sm font-semibold text-black transition hover:shadow-lg hover:shadow-[#D4AF37]/20"
            >
              <span className="text-base leading-none">+</span>
              List a Piece
            </Link>
          </div>
        </div>

        {/* Recently Sold Carousel */}
        {recentlySold.data && recentlySold.data.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
              Recently Sold
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {recentlySold.data.map((item) => (
                <div
                  key={item.id}
                  className="shrink-0 glass-card rounded-xl px-4 py-3"
                >
                  <p className="text-sm font-medium text-[var(--text-heading)]">
                    {item.title}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-xs font-semibold text-[#D4AF37]">
                      ${(item.price / 100).toFixed(2)}
                    </p>
                    <span className="badge badge-for-sale !text-[10px] !py-0 !px-1.5">
                      {item.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters Row */}
        <div className="mb-6 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryValue | "")}
              className={selectClass}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Condition
            </label>
            <select
              value={condition}
              onChange={(e) =>
                setCondition(e.target.value as ConditionValue | "")
              }
              className={selectClass}
            >
              <option value="">Any Condition</option>
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Price Range
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                className={`w-24 ${selectClass}`}
              />
              <span className="text-muted">-</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max"
                className={`w-24 ${selectClass}`}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Sort
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortValue)}
              className={selectClass}
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="rounded-full border border-white/5 glass-effect px-4 py-2 text-sm text-muted transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Listing Grid */}
        {listingsQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : allListings.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted font-display text-2xl italic">No listings found.</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-[#D4AF37] underline hover:text-[#F4E5C3]"
              >
                Clear filters and try again
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {allListings.map((listing) => {
                const images = safeParseImages(listing.images);
                const firstImage = images[0];
                const sellerName =
                  listing.seller.profile?.displayName ??
                  listing.seller.profile?.username ??
                  listing.seller.name ??
                  "Unknown";

                return (
                  <Link
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="trade-card group"
                  >
                    <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-zinc-900 to-black">
                      {firstImage ? (
                        <Image
                          src={firstImage}
                          alt={listing.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover transition group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <svg className="h-12 w-12 text-[var(--text-muted)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                          </svg>
                        </div>
                      )}
                      {/* Condition badge — top-left */}
                      <span className={`badge ${CONDITION_BADGE_STYLES[listing.condition] ?? ""} !text-[10px] absolute top-2 left-2`}>
                        {labelFor(CONDITIONS,listing.condition)}
                      </span>
                      {/* Type badge — top-right */}
                      <span className={`badge ${LISTING_TYPE_BADGE_STYLES[listing.listingType] ?? "badge-for-sale"} !text-[10px] absolute top-2 right-2`}>
                        {listingTypeLabel(listing.listingType)}
                      </span>
                    </div>

                    <div className="p-5">
                      <p className="text-xs text-[#D4AF37] tracking-widest uppercase mb-1">
                        {labelFor(CATEGORIES,listing.category)}
                      </p>
                      <h3 className="font-display text-lg font-semibold text-[var(--text-heading)] truncate">
                        {listing.title}
                      </h3>
                      <p className="mt-1 text-lg font-bold text-[#D4AF37]">
                        ${(listing.price / 100).toFixed(2)}
                      </p>
                      <p className="mt-2 truncate text-xs text-muted">
                        {sellerName}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {listingsQuery.isFetchingNextPage && (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            <div ref={sentinelRef} className="h-4" />

            {!listingsQuery.hasNextPage && allListings.length > 0 && (
              <p className="py-8 text-center text-sm text-muted">
                End of results
              </p>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: 'var(--divider)' }}>
        <div className="mx-auto max-w-7xl px-4 py-8 text-center">
          <p className="gradient-text font-display text-sm font-semibold tracking-widest">THE VAULT</p>
        </div>
      </footer>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="page-bg min-h-screen">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 to-transparent" />
            <div className="relative mx-auto max-w-7xl px-4 pt-12 pb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center animate-float">
                <svg className="h-8 w-8 text-[#D4AF37]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-6L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                </svg>
              </div>
              <p className="gradient-text text-sm font-semibold tracking-widest uppercase mb-2">The Market</p>
              <p className="text-muted text-xs tracking-widest uppercase mb-4">PEER-TO-PEER TRADING</p>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--text-heading)]">
                Buy. Sell. <span className="gradient-text italic">Trade.</span>
              </h1>
            </div>
          </div>
          <main className="mx-auto max-w-7xl px-4 pb-12">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </main>
        </div>
      }
    >
      <ListingsContent />
    </Suspense>
  );
}
