"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { PLATFORM_FEE_BPS } from "~/lib/constants";

export default function WalletPage() {
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<"stripe" | "crypto">("stripe");

  const { data: balance, isLoading: balanceLoading } =
    api.payout.getBalance.useQuery();

  const { data: payoutData, isLoading: payoutsLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    api.payout.getMyPayoutRequests.useInfiniteQuery(
      { limit: 20 },
      { getNextPageParam: (lastPage) => lastPage.nextCursor },
    );

  const utils = api.useUtils();

  const requestPayoutMutation = api.payout.requestPayout.useMutation({
    onSuccess: () => {
      toast.success("Payout request submitted");
      setShowPayoutForm(false);
      setPayoutAmount("");
      void utils.payout.getBalance.invalidate();
      void utils.payout.getMyPayoutRequests.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSubmitPayout = (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = Math.round(parseFloat(payoutAmount) * 100);
    if (isNaN(amountCents) || amountCents < 100) {
      toast.error("Minimum payout is $1.00");
      return;
    }
    requestPayoutMutation.mutate({ amount: amountCents, method: payoutMethod });
  };

  const allPayouts = payoutData?.pages.flatMap((page) => page.requests) ?? [];

  const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-900/50 text-yellow-400 border-yellow-700",
      processing: "bg-blue-900/50 text-blue-400 border-blue-700",
      completed: "bg-green-900/50 text-green-400 border-green-700",
      rejected: "bg-red-900/50 text-red-400 border-red-700",
    };
    return (
      <span
        className={`inline-block rounded-xl border px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-[var(--divider)] text-[var(--text-muted)] border-[var(--divider)]"}`}
      >
        {status}
      </span>
    );
  };

  return (
    <main className="page-bg min-h-screen">
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-800 to-transparent px-4 pb-16 pt-20 text-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/5 h-1 w-1 rounded-full bg-[#D4AF37]/30 animate-gold-pulse" />
          <div className="absolute bottom-1/3 right-1/4 h-1.5 w-1.5 rounded-full bg-[#D4AF37]/20 animate-gold-pulse" style={{ animationDelay: "1.5s" }} />
        </div>
        <div className="relative z-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/10 animate-float">
            <svg className="h-8 w-8 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
            </svg>
          </div>
          <p className="text-muted text-xs tracking-widest uppercase mb-3">Seller</p>
          <h1 className="font-display text-5xl font-light gradient-text">Wallet</h1>
          <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 pb-16">
        {/* Balance Cards */}
        {balanceLoading ? (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-effect rounded-xl px-6 py-4 text-center stat-card">
                <div className="mb-2 h-4 w-20 mx-auto animate-shimmer rounded-xl bg-[var(--divider)]" />
                <div className="h-8 w-24 mx-auto animate-shimmer rounded-xl bg-[var(--divider)]" />
              </div>
            ))}
          </div>
        ) : balance ? (
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="glass-effect rounded-xl px-6 py-4 text-center stat-card">
              <p className="text-xs text-[var(--text-muted)] tracking-wide uppercase">Available Balance</p>
              <p className="mt-1 font-display text-3xl font-bold text-[#D4AF37]">
                {formatCents(balance.availableAmount)}
              </p>
            </div>
            <div className="glass-effect rounded-xl px-6 py-4 text-center stat-card">
              <p className="text-xs text-[var(--text-muted)] tracking-wide uppercase">Pending Balance</p>
              <p className="mt-1 font-display text-3xl font-bold text-amber-400">
                {formatCents(balance.pendingAmount)}
              </p>
            </div>
            <div className="glass-effect rounded-xl px-6 py-4 text-center stat-card">
              <p className="text-xs text-[var(--text-muted)] tracking-wide uppercase">Total Earned</p>
              <p className="mt-1 font-display text-3xl font-bold text-[var(--text-heading)]">
                {formatCents(balance.totalEarned)}
              </p>
            </div>
          </div>
        ) : null}

        {/* Platform Fee Info */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <h2 className="mb-2 font-display text-sm font-semibold text-[var(--text-heading)]">
            Platform Fee Information
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            The Vault charges a {PLATFORM_FEE_BPS / 100}% commission on all sales.
            When a buyer purchases your listing, the platform fee is deducted and
            the remaining amount is added to your pending balance. Once the buyer
            confirms delivery, funds move to your available balance and can be
            withdrawn.
          </p>
        </div>

        {/* Request Payout */}
        <div className="mb-8">
          {!showPayoutForm ? (
            <button
              type="button"
              onClick={() => setShowPayoutForm(true)}
              disabled={!balance || balance.availableAmount < 100}
              className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8960C] px-6 py-2.5 font-semibold text-black transition hover:shadow-lg hover:shadow-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Request Payout
            </button>
          ) : (
            <form
              onSubmit={handleSubmitPayout}
              className="glass-card rounded-2xl p-6"
            >
              <h2 className="mb-5 font-display text-lg font-light text-[var(--text-heading)]">
                Request <span className="gradient-text">Payout</span>
              </h2>
              <div className="mb-4">
                <label
                  htmlFor="payout-amount"
                  className="mb-1 block text-sm font-medium text-[var(--text-body)]"
                >
                  Amount (USD)
                </label>
                <input
                  id="payout-amount"
                  type="number"
                  step="0.01"
                  min="1.00"
                  max={balance ? (balance.availableAmount / 100).toFixed(2) : undefined}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="0.00"
                  className="input-bg w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] border border-[var(--input-border)] transition"
                  required
                />
                {balance && (
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Available: {formatCents(balance.availableAmount)}
                  </p>
                )}
              </div>
              <div className="mb-5">
                <label
                  htmlFor="payout-method"
                  className="mb-1 block text-sm font-medium text-[var(--text-body)]"
                >
                  Payment Method
                </label>
                <select
                  id="payout-method"
                  value={payoutMethod}
                  onChange={(e) =>
                    setPayoutMethod(e.target.value as "stripe" | "crypto")
                  }
                  className="input-bg w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] border border-[var(--input-border)] transition"
                >
                  <option value="stripe">Stripe (Bank Transfer)</option>
                  <option value="crypto">Crypto</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={requestPayoutMutation.isPending}
                  className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8960C] px-6 py-2.5 font-semibold text-black transition hover:shadow-lg hover:shadow-[#D4AF37]/20 disabled:opacity-50"
                >
                  {requestPayoutMutation.isPending
                    ? "Submitting..."
                    : "Submit Request"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPayoutForm(false);
                    setPayoutAmount("");
                  }}
                  className="glass-card rounded-xl px-6 py-2.5 font-medium text-[var(--text-body)] transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Payout History */}
        <div>
          <p className="text-muted text-xs tracking-widest uppercase mb-2">History</p>
          <h2 className="mb-4 font-display text-2xl font-light text-[var(--text-heading)]">
            Payout <span className="gradient-text">Requests</span>
          </h2>
          {payoutsLoading ? (
            <div className="glass-card rounded-xl p-6">
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 animate-shimmer rounded-xl bg-[var(--divider)]" />
                ))}
              </div>
            </div>
          ) : allPayouts.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <p className="font-display text-lg italic text-[var(--text-muted)]">No payout requests yet.</p>
            </div>
          ) : (
            <>
              <div className="glass-card rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b divider-line">
                      <th className="px-5 py-4 text-xs font-medium tracking-wider uppercase text-[var(--text-muted)]">Amount</th>
                      <th className="px-5 py-4 text-xs font-medium tracking-wider uppercase text-[var(--text-muted)]">Method</th>
                      <th className="px-5 py-4 text-xs font-medium tracking-wider uppercase text-[var(--text-muted)]">Status</th>
                      <th className="px-5 py-4 text-xs font-medium tracking-wider uppercase text-[var(--text-muted)]">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPayouts.map((payout) => (
                      <tr key={payout.id} className="border-b divider-line last:border-0 transition hover:bg-[rgba(212,175,55,0.03)]">
                        <td className="px-5 py-4 font-display font-semibold text-[var(--text-heading)]">
                          {formatCents(payout.amount)}
                        </td>
                        <td className="px-5 py-4 text-[var(--text-body)] capitalize">
                          {payout.method}
                        </td>
                        <td className="px-5 py-4">
                          {statusBadge(payout.status)}
                        </td>
                        <td className="px-5 py-4 text-[var(--text-muted)]">
                          {new Date(payout.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {hasNextPage && (
                <div className="mt-6 text-center">
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
      </div>

      {/* Footer */}
      <footer className="border-t divider-line py-8 text-center">
        <p className="font-display text-sm tracking-widest gradient-text">THE VAULT</p>
      </footer>
    </main>
  );
}
