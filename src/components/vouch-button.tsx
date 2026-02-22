"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";

export function VouchButton({
  listingId,
  initialCount,
  initialVouched,
  isOwnListing,
  isLoggedIn,
}: {
  listingId: string;
  initialCount: number;
  initialVouched: boolean;
  isOwnListing: boolean;
  isLoggedIn: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [vouched, setVouched] = useState(initialVouched);

  const vouchMutation = api.listing.vouch.useMutation({
    onSuccess: (result) => {
      setVouched(result.vouched);
      setCount((c) => (result.vouched ? c + 1 : c - 1));
      toast.success(result.vouched ? "Vouched for this item" : "Vouch removed");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted">
        {count} {count === 1 ? "member vouches" : "members vouch"} for this item
      </span>
      {isLoggedIn && !isOwnListing && (
        <button
          type="button"
          onClick={() => vouchMutation.mutate({ listingId })}
          disabled={vouchMutation.isPending}
          className={`rounded-xl px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
            vouched
              ? "bg-amber-600/20 text-amber-400 border border-amber-600/30"
              : "glass-card border text-muted hover:text-amber-400 hover:border-amber-600/30"
          }`}
        >
          {vouched ? "Vouched" : "Vouch"}
        </button>
      )}
    </div>
  );
}
