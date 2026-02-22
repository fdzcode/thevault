"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { api } from "~/trpc/react";

const CATEGORIES = [
  { value: "apparel", label: "Apparel" },
  { value: "accessories", label: "Accessories" },
  { value: "art", label: "Art" },
  { value: "collectibles", label: "Collectibles" },
  { value: "footwear", label: "Footwear" },
  { value: "jewelry", label: "Jewelry" },
  { value: "prints", label: "Prints" },
  { value: "other", label: "Other" },
] as const;

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
] as const;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
] as const;

type CategoryValue = (typeof CATEGORIES)[number]["value"];
type ConditionValue = (typeof CONDITIONS)[number]["value"];
type SortValue = (typeof SORT_OPTIONS)[number]["value"];

function conditionLabel(value: string): string {
  const found = CONDITIONS.find((c) => c.value === value);
  return found ? found.label : value;
}

function categoryLabel(value: string): string {
  const found = CATEGORIES.find((c) => c.value === value);
  return found ? found.label : value;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
      <div className="aspect-square bg-zinc-800" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 rounded bg-zinc-800" />
        <div className="h-4 w-1/3 rounded bg-zinc-800" />
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded bg-zinc-800" />
          <div className="h-5 w-14 rounded bg-zinc-800" />
        </div>
        <div className="h-3 w-1/2 rounded bg-zinc-800" />
      </div>
    </div>
  );
}

function ListingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<CategoryValue | "">("");
  const [condition, setCondition] = useState<ConditionValue | "">("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<SortValue>("newest");

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Sync query from URL search params when they change
  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    setQuery(q);
  }, [searchParams]);

  const recentlySold = api.listing.recentlySold.useQuery();

  const searchInput = {
    query: query || undefined,
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

  // Intersection observer for infinite scroll
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
    setCategory("");
    setCondition("");
    setMinPrice("");
    setMaxPrice("");
    setSort("newest");
    router.replace("/listings");
  };

  const hasActiveFilters =
    query || category || condition || minPrice || maxPrice || sort !== "newest";

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // The query state change will trigger refetch automatically
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {/* Recently Sold Carousel */}
      {recentlySold.data && recentlySold.data.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Recently Sold
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentlySold.data.map((item) => (
              <div
                key={item.id}
                className="shrink-0 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
              >
                <p className="text-sm font-medium text-zinc-300">
                  {item.title}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-xs font-semibold text-emerald-400">
                    ${(item.price / 100).toFixed(2)}
                  </p>
                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] uppercase text-zinc-500">
                    {item.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Browse Listings</h1>
        <Link
          href="/listings/new"
          className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
        >
          Create Listing
        </Link>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="mb-4">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500"
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
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 pl-10 pr-4 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
          />
        </div>
      </form>

      {/* Filters Row */}
      <div className="mb-6 flex flex-wrap items-end gap-3">
        {/* Category */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as CategoryValue | "")}
            className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Condition */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Condition
          </label>
          <select
            value={condition}
            onChange={(e) =>
              setCondition(e.target.value as ConditionValue | "")
            }
            className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
          >
            <option value="">Any Condition</option>
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
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
              className="w-24 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
            />
            <span className="text-zinc-500">-</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max"
              className="w-24 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Sort */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Sort
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortValue)}
            className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="rounded border border-zinc-700 px-3 py-2 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-white"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Listing Grid */}
      {listingsQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : allListings.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg text-zinc-500">No listings found.</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-2 text-sm text-zinc-400 underline hover:text-white"
            >
              Clear filters and try again
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allListings.map((listing) => {
              let images: string[] = [];
              try {
                images = JSON.parse(listing.images) as string[];
              } catch {
                // ignore parse errors
              }
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
                  className="group overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 transition hover:border-zinc-600"
                >
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden bg-zinc-800">
                    {firstImage ? (
                      <Image
                        src={firstImage}
                        alt={listing.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-700">
                        <svg
                          className="h-12 w-12 text-zinc-600"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-3">
                    <h3 className="truncate font-semibold text-white">
                      {listing.title}
                    </h3>
                    <p className="mt-0.5 text-lg font-bold text-emerald-400">
                      ${(listing.price / 100).toFixed(2)}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium capitalize text-zinc-300">
                        {categoryLabel(listing.category)}
                      </span>
                      <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-400">
                        {conditionLabel(listing.condition)}
                      </span>
                    </div>
                    <p className="mt-1.5 truncate text-xs text-zinc-500">
                      {sellerName}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Loading more skeletons */}
          {listingsQuery.isFetchingNextPage && (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-4" />

          {/* End of results */}
          {!listingsQuery.hasNextPage && allListings.length > 0 && (
            <p className="py-8 text-center text-sm text-zinc-600">
              End of results
            </p>
          )}
        </>
      )}
    </main>
  );
}

export default function ListingsPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </main>
      }
    >
      <ListingsContent />
    </Suspense>
  );
}
