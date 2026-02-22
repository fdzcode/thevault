"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

const STATUS_OPTIONS = ["all", "open", "under_review", "resolved_buyer", "resolved_seller", "closed"] as const;

const RESOLUTION_STATUSES = ["under_review", "resolved_buyer", "resolved_seller", "closed"] as const;

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    open: "bg-yellow-900/50 text-yellow-400",
    under_review: "bg-blue-900/50 text-blue-400",
    resolved_buyer: "bg-emerald-900/50 text-emerald-400",
    resolved_seller: "bg-emerald-900/50 text-emerald-400",
    closed: "bg-zinc-800 text-zinc-400",
  };
  const labels: Record<string, string> = {
    open: "Open",
    under_review: "Under Review",
    resolved_buyer: "Resolved (Buyer)",
    resolved_seller: "Resolved (Seller)",
    closed: "Closed",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        styles[status] ?? "bg-zinc-800 text-zinc-400"
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function reasonLabel(reason: string) {
  const labels: Record<string, string> = {
    item_not_received: "Item Not Received",
    item_not_as_described: "Not As Described",
    counterfeit: "Counterfeit",
    other: "Other",
  };
  return labels[reason] ?? reason;
}

export default function AdminDisputesPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);
  const [resolveStatus, setResolveStatus] = useState<string>("under_review");
  const [adminNotes, setAdminNotes] = useState("");
  const [resolution, setResolution] = useState("");

  const { data, isLoading, error, refetch } = api.admin.getDisputes.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 25,
  });

  const resolveDispute = api.admin.resolveDispute.useMutation({
    onSuccess: () => {
      setSelectedDispute(null);
      setAdminNotes("");
      setResolution("");
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
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-red-400">Access denied. Redirecting...</p>
      </main>
    );
  }

  const selectedDisputeData = data?.disputes.find((d) => d.id === selectedDispute);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-sm text-zinc-400 transition hover:text-white">
            &larr; Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white">Dispute Management</h1>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
              statusFilter === status
                ? "bg-white text-black"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            {status === "all"
              ? "All"
              : status === "under_review"
                ? "Under Review"
                : status === "resolved_buyer"
                  ? "Resolved (Buyer)"
                  : status === "resolved_seller"
                    ? "Resolved (Seller)"
                    : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Disputes List */}
        <div className="flex-1">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded border border-zinc-800 bg-zinc-900 p-4"
                >
                  <div className="h-4 w-48 rounded bg-zinc-800" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {data?.disputes.map((dispute) => (
                <button
                  key={dispute.id}
                  onClick={() => {
                    setSelectedDispute(dispute.id);
                    setResolveStatus(dispute.status === "open" ? "under_review" : dispute.status);
                    setAdminNotes(dispute.adminNotes ?? "");
                    setResolution(dispute.resolution ?? "");
                  }}
                  className={`w-full rounded-lg border p-4 text-left transition ${
                    selectedDispute === dispute.id
                      ? "border-zinc-600 bg-zinc-900"
                      : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-white">
                      {dispute.order.listing.title}
                    </span>
                    {statusBadge(dispute.status)}
                  </div>
                  <p className="mb-1 text-xs text-zinc-400">
                    {reasonLabel(dispute.reason)} &middot; $
                    {(dispute.order.totalAmount / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Filed by{" "}
                    {dispute.filer.profile?.username
                      ? `@${dispute.filer.profile.username}`
                      : dispute.filer.name ?? dispute.filer.email}{" "}
                    against{" "}
                    {dispute.against.profile?.username
                      ? `@${dispute.against.profile.username}`
                      : dispute.against.name ?? dispute.against.email}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {new Date(dispute.createdAt).toLocaleDateString()}
                  </p>
                </button>
              ))}
              {data?.disputes.length === 0 && (
                <p className="py-8 text-center text-zinc-500">No disputes found.</p>
              )}
            </div>
          )}
        </div>

        {/* Dispute Detail / Resolution Panel */}
        {selectedDisputeData && (
          <div className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-6 lg:w-96">
            <h3 className="mb-4 text-lg font-semibold text-white">Dispute Details</h3>

            <div className="mb-4 space-y-2 text-sm">
              <div>
                <span className="text-zinc-400">Listing: </span>
                <span className="text-white">{selectedDisputeData.order.listing.title}</span>
              </div>
              <div>
                <span className="text-zinc-400">Amount: </span>
                <span className="text-white">
                  ${(selectedDisputeData.order.totalAmount / 100).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-zinc-400">Reason: </span>
                <span className="text-white">{reasonLabel(selectedDisputeData.reason)}</span>
              </div>
              <div>
                <span className="text-zinc-400">Filed by: </span>
                <span className="text-white">
                  {selectedDisputeData.filer.profile?.username
                    ? `@${selectedDisputeData.filer.profile.username}`
                    : selectedDisputeData.filer.name ?? selectedDisputeData.filer.email}
                </span>
              </div>
              <div>
                <span className="text-zinc-400">Against: </span>
                <span className="text-white">
                  {selectedDisputeData.against.profile?.username
                    ? `@${selectedDisputeData.against.profile.username}`
                    : selectedDisputeData.against.name ?? selectedDisputeData.against.email}
                </span>
              </div>
              <div>
                <span className="text-zinc-400">Status: </span>
                {statusBadge(selectedDisputeData.status)}
              </div>
              <div>
                <span className="text-zinc-400">Description: </span>
                <p className="mt-1 text-zinc-300">{selectedDisputeData.description}</p>
              </div>
              {selectedDisputeData.adminNotes && (
                <div>
                  <span className="text-zinc-400">Current Admin Notes: </span>
                  <p className="mt-1 text-zinc-300">{selectedDisputeData.adminNotes}</p>
                </div>
              )}
              {selectedDisputeData.resolution && (
                <div>
                  <span className="text-zinc-400">Current Resolution: </span>
                  <p className="mt-1 text-zinc-300">{selectedDisputeData.resolution}</p>
                </div>
              )}
            </div>

            <hr className="my-4 border-zinc-800" />

            <h4 className="mb-3 text-sm font-semibold text-white">Update Dispute</h4>

            {/* Resolution Status */}
            <div className="mb-3">
              <label className="mb-1 block text-xs text-zinc-400">Status</label>
              <select
                value={resolveStatus}
                onChange={(e) => setResolveStatus(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
              >
                {RESOLUTION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s === "under_review"
                      ? "Under Review"
                      : s === "resolved_buyer"
                        ? "Resolved (Buyer Wins)"
                        : s === "resolved_seller"
                          ? "Resolved (Seller Wins)"
                          : "Closed"}
                  </option>
                ))}
              </select>
            </div>

            {/* Admin Notes */}
            <div className="mb-3">
              <label className="mb-1 block text-xs text-zinc-400">Admin Notes</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-600"
                placeholder="Internal notes about this dispute..."
              />
            </div>

            {/* Resolution */}
            <div className="mb-4">
              <label className="mb-1 block text-xs text-zinc-400">Resolution</label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={3}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-600"
                placeholder="Resolution details visible to users..."
              />
            </div>

            <button
              onClick={() =>
                resolveDispute.mutate({
                  disputeId: selectedDisputeData.id,
                  status: resolveStatus as typeof RESOLUTION_STATUSES[number],
                  adminNotes: adminNotes || undefined,
                  resolution: resolution || undefined,
                })
              }
              disabled={resolveDispute.isPending}
              className="w-full rounded bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
            >
              {resolveDispute.isPending ? "Updating..." : "Update Dispute"}
            </button>

            {resolveDispute.error && (
              <p className="mt-2 text-sm text-red-400">{resolveDispute.error.message}</p>
            )}

            <button
              onClick={() => setSelectedDispute(null)}
              className="mt-2 w-full rounded px-4 py-2 text-sm text-zinc-400 transition hover:text-white"
            >
              Close Panel
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
