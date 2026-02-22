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
    closed: "bg-[var(--divider)] text-[var(--text-muted)]",
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
        styles[status] ?? "bg-[var(--divider)] text-[var(--text-muted)]"
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
      <main className="page-bg min-h-screen flex items-center justify-center">
        <p className="font-display text-xl italic text-muted">Access denied. Redirecting...</p>
      </main>
    );
  }

  const selectedDisputeData = data?.disputes.find((d) => d.id === selectedDispute);

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
              Dispute <span className="gradient-text">Management</span>
            </h1>
            <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2.5 py-0.5 text-xs font-medium text-[#D4AF37]">
              Admin
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        {/* Status Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
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
                    className="glass-card rounded-2xl p-5"
                  >
                    <div className="h-4 w-48 animate-shimmer rounded bg-[var(--divider)]" />
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
                    className={`glass-card w-full rounded-2xl p-5 text-left transition ${
                      selectedDispute === dispute.id
                        ? "border-[#D4AF37]/40 shadow-[0_0_20px_rgba(212,175,55,0.1)]"
                        : "hover:shadow-[0_0_15px_rgba(212,175,55,0.05)]"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--text-heading)]">
                        {dispute.order.listing.title}
                      </span>
                      {statusBadge(dispute.status)}
                    </div>
                    <p className="mb-1 text-xs text-muted">
                      {reasonLabel(dispute.reason)} &middot; $
                      {(dispute.order.totalAmount / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted">
                      Filed by{" "}
                      {dispute.filer.profile?.username
                        ? `@${dispute.filer.profile.username}`
                        : dispute.filer.name ?? dispute.filer.email}{" "}
                      against{" "}
                      {dispute.against.profile?.username
                        ? `@${dispute.against.profile.username}`
                        : dispute.against.name ?? dispute.against.email}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                ))}
                {data?.disputes.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="font-display text-xl italic text-muted">No disputes found.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dispute Detail / Resolution Panel */}
          {selectedDisputeData && (
            <div className="glass-card w-full rounded-2xl p-6 lg:w-96">
              <h3 className="font-display mb-4 text-lg font-light text-[var(--text-heading)]">
                Dispute <span className="gradient-text">Details</span>
              </h3>

              <div className="mb-4 space-y-3 text-sm">
                <div>
                  <span className="text-xs uppercase tracking-widest text-muted">Listing</span>
                  <p className="mt-0.5 text-[var(--text-heading)]">{selectedDisputeData.order.listing.title}</p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-widest text-muted">Amount</span>
                  <p className="mt-0.5 text-[var(--text-heading)]">
                    ${(selectedDisputeData.order.totalAmount / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-widest text-muted">Reason</span>
                  <p className="mt-0.5 text-[var(--text-heading)]">{reasonLabel(selectedDisputeData.reason)}</p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-widest text-muted">Filed by</span>
                  <p className="mt-0.5 text-[var(--text-heading)]">
                    {selectedDisputeData.filer.profile?.username
                      ? `@${selectedDisputeData.filer.profile.username}`
                      : selectedDisputeData.filer.name ?? selectedDisputeData.filer.email}
                  </p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-widest text-muted">Against</span>
                  <p className="mt-0.5 text-[var(--text-heading)]">
                    {selectedDisputeData.against.profile?.username
                      ? `@${selectedDisputeData.against.profile.username}`
                      : selectedDisputeData.against.name ?? selectedDisputeData.against.email}
                  </p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-widest text-muted">Status</span>
                  <div className="mt-1">{statusBadge(selectedDisputeData.status)}</div>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-widest text-muted">Description</span>
                  <p className="mt-1 text-[var(--text-body)]">{selectedDisputeData.description}</p>
                </div>
                {selectedDisputeData.adminNotes && (
                  <div>
                    <span className="text-xs uppercase tracking-widest text-muted">Current Admin Notes</span>
                    <p className="mt-1 text-[var(--text-body)]">{selectedDisputeData.adminNotes}</p>
                  </div>
                )}
                {selectedDisputeData.resolution && (
                  <div>
                    <span className="text-xs uppercase tracking-widest text-muted">Current Resolution</span>
                    <p className="mt-1 text-[var(--text-body)]">{selectedDisputeData.resolution}</p>
                  </div>
                )}
              </div>

              <div className="my-4 h-px divider-line" />

              <h4 className="font-display mb-3 text-sm font-semibold text-[var(--text-heading)]">
                Update Dispute
              </h4>

              {/* Resolution Status */}
              <div className="mb-3">
                <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted">Status</label>
                <select
                  value={resolveStatus}
                  onChange={(e) => setResolveStatus(e.target.value)}
                  className="w-full input-bg rounded-xl border px-3 py-2.5 text-sm text-[var(--text-heading)] outline-none focus:border-[#D4AF37] transition"
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
                <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full input-bg rounded-xl border px-3 py-2.5 text-sm text-[var(--text-heading)] placeholder-[var(--text-muted)] outline-none focus:border-[#D4AF37] transition"
                  placeholder="Internal notes about this dispute..."
                />
              </div>

              {/* Resolution */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs uppercase tracking-widest text-muted">Resolution</label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={3}
                  className="w-full input-bg rounded-xl border px-3 py-2.5 text-sm text-[var(--text-heading)] placeholder-[var(--text-muted)] outline-none focus:border-[#D4AF37] transition"
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
                className="w-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8960C] px-4 py-2.5 text-sm font-semibold text-black transition hover:shadow-lg hover:shadow-[#D4AF37]/25 hover:brightness-110 disabled:opacity-50"
              >
                {resolveDispute.isPending ? "Updating..." : "Update Dispute"}
              </button>

              {resolveDispute.error && (
                <p className="mt-2 text-sm text-red-400">{resolveDispute.error.message}</p>
              )}

              <button
                onClick={() => setSelectedDispute(null)}
                className="glass-card mt-3 w-full rounded-full px-4 py-2.5 text-sm text-muted transition hover:text-[var(--text-heading)]"
              >
                Close Panel
              </button>
            </div>
          )}
        </div>
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
