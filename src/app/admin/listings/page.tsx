"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

const STATUS_OPTIONS = ["all", "active", "sold", "cancelled"] as const;

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    active: "bg-emerald-900/50 text-emerald-400",
    sold: "bg-blue-900/50 text-blue-400",
    cancelled: "bg-red-900/50 text-red-400",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        styles[status] ?? "bg-[var(--divider)] text-[var(--text-muted)]"
      }`}
    >
      {status}
    </span>
  );
}

export default function AdminListingsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error, refetch } = api.admin.getListings.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    search: debouncedSearch || undefined,
    limit: 25,
  });

  const removeListing = api.admin.removeListing.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  useEffect(() => {
    if (error?.data?.code === "FORBIDDEN" || error?.data?.code === "UNAUTHORIZED") {
      router.push("/");
    }
  }, [error, router]);

  if (error && (error.data?.code === "FORBIDDEN" || error.data?.code === "UNAUTHORIZED")) {
    return (
      <main className="page-bg min-h-screen flex items-center justify-center">
        <p className="font-display text-xl italic text-muted">Access denied. Redirecting...</p>
      </main>
    );
  }

  return (
    <main className="page-bg min-h-screen">
      {/* Header */}
      <section className="relative px-4 pt-16 pb-10 overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-800/50 to-transparent">
        <div className="mx-auto max-w-6xl">
          <Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-xs uppercase tracking-widest text-[#D4AF37] transition hover:text-[var(--text-heading)]">
            &larr; Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-4xl font-light text-[var(--text-heading)]">
              Listing <span className="gradient-text">Management</span>
            </h1>
            <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2.5 py-0.5 text-xs font-medium text-[#D4AF37]">
              Admin
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <input
            type="text"
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 input-bg rounded-full border px-5 py-3 text-sm text-[var(--text-heading)] placeholder-[var(--text-muted)] outline-none focus:border-[#D4AF37] transition"
          />
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-full px-4 py-2 text-xs font-medium tracking-wide transition ${
                  statusFilter === status
                    ? "bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-black"
                    : "glass-card text-muted hover:text-[var(--text-heading)]"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Table */}
        {isLoading ? (
          <div className="glass-card rounded-2xl overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-b divider-line px-6 py-4">
                <div className="h-4 w-48 animate-shimmer rounded bg-[var(--divider)]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b divider-line">
                    <th className="px-6 py-3 text-muted text-xs tracking-widest uppercase font-medium">Title</th>
                    <th className="px-6 py-3 text-muted text-xs tracking-widest uppercase font-medium">Seller</th>
                    <th className="px-6 py-3 text-muted text-xs tracking-widest uppercase font-medium">Price</th>
                    <th className="px-6 py-3 text-muted text-xs tracking-widest uppercase font-medium">Category</th>
                    <th className="px-6 py-3 text-muted text-xs tracking-widest uppercase font-medium">Status</th>
                    <th className="px-6 py-3 text-muted text-xs tracking-widest uppercase font-medium">Created</th>
                    <th className="px-6 py-3 text-muted text-xs tracking-widest uppercase font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.listings.map((listing) => (
                    <tr key={listing.id} className="border-b divider-line transition hover:bg-[var(--glass-card-bg)]">
                      <td className="max-w-[200px] truncate px-6 py-4 text-[var(--text-heading)]">
                        {listing.title}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-body)]">
                        {listing.seller.profile?.username
                          ? `@${listing.seller.profile.username}`
                          : listing.seller.name ?? listing.seller.email ?? "Unknown"}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-body)]">
                        ${(listing.price / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-muted">{listing.category}</td>
                      <td className="px-6 py-4">{statusBadge(listing.status)}</td>
                      <td className="px-6 py-4 text-muted">
                        {new Date(listing.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {listing.status === "active" && (
                          <button
                            onClick={() => {
                              if (confirm("Are you sure you want to remove this listing?")) {
                                removeListing.mutate({ listingId: listing.id });
                              }
                            }}
                            disabled={removeListing.isPending}
                            className="rounded-lg bg-red-900/50 px-3 py-1 text-xs font-medium text-red-400 transition hover:bg-red-900 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {data?.listings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <p className="font-display text-xl italic text-muted">No listings found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {removeListing.error && (
          <p className="mt-4 text-sm text-red-400">{removeListing.error.message}</p>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t divider-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-8">
          <span className="gradient-text font-display text-sm font-bold tracking-[0.2em]">THE VAULT</span>
          <span className="text-xs text-muted tracking-widest">ADMIN PANEL</span>
        </div>
      </footer>
    </main>
  );
}
