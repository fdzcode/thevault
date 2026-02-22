"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";

export function WishlistButton({
  listingId,
  isLoggedIn,
}: {
  listingId: string;
  isLoggedIn: boolean;
}) {
  const [optimisticWishlisted, setOptimisticWishlisted] = useState<
    boolean | null
  >(null);

  const { data } = api.wishlist.isWishlisted.useQuery(
    { listingId },
    { enabled: isLoggedIn },
  );

  const wishlisted =
    optimisticWishlisted ?? data?.wishlisted ?? false;

  const utils = api.useUtils();

  const toggleMutation = api.wishlist.toggle.useMutation({
    onMutate: () => {
      setOptimisticWishlisted(!wishlisted);
    },
    onSuccess: (result) => {
      setOptimisticWishlisted(result.wishlisted);
      void utils.wishlist.isWishlisted.invalidate({ listingId });
      void utils.wishlist.getMyWishlist.invalidate();
      toast.success(
        result.wishlisted ? "Added to wishlist" : "Removed from wishlist",
      );
    },
    onError: (err) => {
      setOptimisticWishlisted(null);
      toast.error(err.message);
    },
  });

  if (!isLoggedIn) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => toggleMutation.mutate({ listingId })}
      disabled={toggleMutation.isPending}
      className={`flex items-center gap-1.5 text-sm transition disabled:opacity-50 ${
        wishlisted
          ? "text-[#D4AF37]"
          : "text-muted hover:text-[#D4AF37]"
      }`}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill={wishlisted ? "#D4AF37" : "none"}
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
      {wishlisted ? "Wishlisted" : "Wishlist"}
    </button>
  );
}
