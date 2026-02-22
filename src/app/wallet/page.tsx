"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { PLATFORM_FEE_PERCENT } from "~/lib/fees";

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
        className={`inline-block rounded border px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-zinc-800 text-zinc-400 border-zinc-700"}`}
      >
        {status}
      </span>
    );
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Seller Wallet</h1>

      {/* Balance Cards */}
      {balanceLoading ? (
        <p className="text-zinc-500">Loading balance...</p>
      ) : balance ? (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-500">Available Balance</p>
            <p className="mt-1 text-2xl font-bold text-green-400">
              {formatCents(balance.availableAmount)}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-500">Pending Balance</p>
            <p className="mt-1 text-2xl font-bold text-yellow-400">
              {formatCents(balance.pendingAmount)}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-500">Total Earned</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {formatCents(balance.totalEarned)}
            </p>
          </div>
        </div>
      ) : null}

      {/* Platform Fee Info */}
      <div className="mb-8 rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-2 text-sm font-semibold text-zinc-300">
          Platform Fee Information
        </h2>
        <p className="text-sm text-zinc-500">
          The Vault charges a {PLATFORM_FEE_PERCENT}% commission on all sales.
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
            className="rounded bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Request Payout
          </button>
        ) : (
          <form
            onSubmit={handleSubmitPayout}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-5"
          >
            <h2 className="mb-4 text-sm font-semibold text-zinc-300">
              Request Payout
            </h2>
            <div className="mb-4">
              <label
                htmlFor="payout-amount"
                className="mb-1 block text-sm text-zinc-400"
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
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
                required
              />
              {balance && (
                <p className="mt-1 text-xs text-zinc-600">
                  Available: {formatCents(balance.availableAmount)}
                </p>
              )}
            </div>
            <div className="mb-4">
              <label
                htmlFor="payout-method"
                className="mb-1 block text-sm text-zinc-400"
              >
                Payment Method
              </label>
              <select
                id="payout-method"
                value={payoutMethod}
                onChange={(e) =>
                  setPayoutMethod(e.target.value as "stripe" | "crypto")
                }
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-zinc-500 focus:outline-none"
              >
                <option value="stripe">Stripe (Bank Transfer)</option>
                <option value="crypto">Crypto</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={requestPayoutMutation.isPending}
                className="rounded bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
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
                className="rounded border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Payout History */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Payout History</h2>
        {payoutsLoading ? (
          <p className="text-zinc-500">Loading payouts...</p>
        ) : allPayouts.length === 0 ? (
          <div className="rounded border border-zinc-800 p-8 text-center">
            <p className="text-zinc-500">No payout requests yet.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-800 bg-zinc-900 text-zinc-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {allPayouts.map((payout) => (
                    <tr key={payout.id} className="bg-zinc-950">
                      <td className="px-4 py-3 font-medium text-white">
                        {formatCents(payout.amount)}
                      </td>
                      <td className="px-4 py-3 text-zinc-300 capitalize">
                        {payout.method}
                      </td>
                      <td className="px-4 py-3">
                        {statusBadge(payout.status)}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {new Date(payout.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hasNextPage && (
              <div className="mt-4 text-center">
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
      </div>
    </main>
  );
}
