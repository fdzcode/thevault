"use client";

import Link from "next/link";
import { api } from "~/trpc/react";

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    open: "bg-yellow-400/10 text-yellow-400",
    under_review: "bg-blue-400/10 text-blue-400",
    resolved_buyer: "bg-green-400/10 text-green-400",
    resolved_seller: "bg-green-400/10 text-green-400",
    closed: "bg-zinc-400/10 text-zinc-400",
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
      className={`rounded px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-zinc-400/10 text-zinc-400"}`}
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
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">My Disputes</h1>

      {isLoading ? (
        <p className="text-zinc-500">Loading...</p>
      ) : allDisputes.length === 0 ? (
        <div className="rounded border border-zinc-800 p-8 text-center">
          <p className="text-zinc-500">No disputes.</p>
        </div>
      ) : (
        <>
          <ul className="space-y-4">
            {allDisputes.map((dispute) => (
              <li key={dispute.id}>
                <div className="rounded border border-zinc-800 p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-white">
                      {dispute.order.listing.title}
                    </h2>
                    {statusBadge(dispute.status)}
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">
                    {reasonLabel(dispute.reason)} &middot;{" "}
                    {new Date(dispute.createdAt).toLocaleDateString()}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Filed by{" "}
                    {dispute.filer.profile?.username ?? dispute.filer.name}{" "}
                    against{" "}
                    {dispute.against.profile?.username ?? dispute.against.name}
                  </p>
                  <div className="mt-3 flex gap-3">
                    <Link
                      href={`/orders/${dispute.order.id}`}
                      className="text-xs text-zinc-400 transition hover:text-white"
                    >
                      View Order
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>

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
