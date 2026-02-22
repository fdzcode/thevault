"use client";

import Link from "next/link";
import { api } from "~/trpc/react";

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    open: "bg-yellow-400/10 text-yellow-400",
    under_review: "bg-blue-400/10 text-blue-400",
    resolved_buyer: "bg-green-400/10 text-green-400",
    resolved_seller: "bg-green-400/10 text-green-400",
    closed: "bg-neutral-400/10 text-neutral-400",
  };
  const label: Record<string, string> = {
    open: "Open",
    under_review: "Under Review",
    resolved_buyer: "Resolved (Buyer)",
    resolved_seller: "Resolved (Seller)",
    closed: "Closed",
  };
  return (
    <span
      className={`rounded-xl px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-neutral-400/10 text-neutral-400"}`}
    >
      {label[status] ?? status}
    </span>
  );
}

function reasonLabel(reason: string) {
  const labels: Record<string, string> = {
    item_not_received: "Item Not Received",
    item_not_as_described: "Item Not As Described",
    counterfeit: "Counterfeit",
    other: "Other",
  };
  return labels[reason] ?? reason;
}

export default function DisputesPage() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.dispute.getMyDisputes.useInfiniteQuery(
      { limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  const allDisputes = data?.pages.flatMap((page) => page.disputes) ?? [];

  return (
    <main className="page-bg min-h-screen">
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-800 to-transparent px-4 pb-16 pt-20 text-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 h-1 w-1 rounded-full bg-[#D4AF37]/30 animate-gold-pulse" />
          <div className="absolute bottom-1/3 right-1/3 h-1 w-1 rounded-full bg-[#D4AF37]/20 animate-gold-pulse" style={{ animationDelay: "2s" }} />
        </div>
        <div className="relative z-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/10 animate-float">
            <svg className="h-8 w-8 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <p className="text-muted text-xs tracking-widest uppercase mb-3">Resolution Center</p>
          <h1 className="font-display text-5xl font-light gradient-text">My Disputes</h1>
          <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 pb-16">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-6">
                <div className="mb-3 h-5 w-2/3 animate-shimmer rounded-lg bg-[var(--divider)]" />
                <div className="h-4 w-1/2 animate-shimmer rounded-lg bg-[var(--divider)]" />
              </div>
            ))}
          </div>
        ) : allDisputes.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <p className="font-display text-xl italic text-[var(--text-muted)]">No disputes.</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">All clear -- no open disputes.</p>
          </div>
        ) : (
          <>
            <ul className="space-y-4">
              {allDisputes.map((dispute) => (
                <li key={dispute.id}>
                  <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-lg font-semibold text-[var(--text-heading)]">
                        {dispute.order.listing.title}
                      </h2>
                      {statusBadge(dispute.status)}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-[var(--text-body)]">
                      <span className="inline-block rounded-lg bg-[#D4AF37]/10 px-2 py-0.5 text-xs text-[#D4AF37]">
                        {reasonLabel(dispute.reason)}
                      </span>
                      <span className="text-[var(--text-muted)]">&middot;</span>
                      <span className="text-[var(--text-muted)]">
                        {new Date(dispute.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                      Filed by{" "}
                      <span className="text-[var(--text-body)]">{dispute.filer.profile?.username ?? dispute.filer.name}</span>{" "}
                      against{" "}
                      <span className="text-[var(--text-body)]">{dispute.against.profile?.username ?? dispute.against.name}</span>
                    </p>
                    <div className="mt-4 border-t border-[var(--divider)] pt-4">
                      <Link
                        href={`/orders/${dispute.order.id}`}
                        className="inline-block rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8960C] px-4 py-2 text-xs font-semibold text-black transition hover:shadow-lg hover:shadow-[#D4AF37]/20"
                      >
                        View Order
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

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
