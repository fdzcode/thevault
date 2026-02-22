"use client";

import { useState } from "react";
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
    },
  });

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-500">
        {count} {count === 1 ? "member vouches" : "members vouch"} for this item
      </span>
      {isLoggedIn && !isOwnListing && (
        <button
          type="button"
          onClick={() => vouchMutation.mutate({ listingId })}
          disabled={vouchMutation.isPending}
          className="text-xs text-zinc-400 transition hover:text-zinc-200 disabled:opacity-50"
        >
          {vouched ? "Unvouch" : "Vouch"}
        </button>
      )}
    </div>
  );
}
