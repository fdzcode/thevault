"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";

export function OrderActions({
  orderId,
  role,
  status,
  hasReview,
}: {
  orderId: string;
  role: "buyer" | "seller";
  status: string;
  hasReview: boolean;
}) {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const updateStatus = api.order.updateStatus.useMutation({
    onSuccess: () => {
      router.refresh();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const createReview = api.review.create.useMutation({
    onSuccess: () => {
      router.refresh();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const inputClass =
    "mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none";

  return (
    <div className="mt-6 space-y-4">
      {error && <p className="text-sm text-red-400">{error}</p>}

      {role === "seller" && status === "paid" && (
        <div className="rounded border border-zinc-800 p-4">
          <h3 className="mb-3 font-semibold">Ship Order</h3>
          <div className="mb-3">
            <label
              htmlFor="tracking"
              className="block text-sm font-medium text-zinc-300"
            >
              Tracking Number (optional)
            </label>
            <input
              id="tracking"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className={inputClass}
              placeholder="Enter tracking number"
            />
          </div>
          <button
            onClick={() =>
              updateStatus.mutate({
                id: orderId,
                status: "shipped",
                trackingNumber: trackingNumber || undefined,
              })
            }
            disabled={updateStatus.isPending}
            className="rounded bg-white px-4 py-2 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {updateStatus.isPending ? "Updating..." : "Mark Shipped"}
          </button>
        </div>
      )}

      {role === "buyer" && status === "shipped" && (
        <div className="rounded border border-zinc-800 p-4">
          <h3 className="mb-3 font-semibold">Confirm Delivery</h3>
          <p className="mb-3 text-sm text-zinc-400">
            Confirm that you have received the item.
          </p>
          <button
            onClick={() =>
              updateStatus.mutate({ id: orderId, status: "delivered" })
            }
            disabled={updateStatus.isPending}
            className="rounded bg-white px-4 py-2 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {updateStatus.isPending ? "Updating..." : "Confirm Delivery"}
          </button>
        </div>
      )}

      {role === "buyer" && status === "delivered" && !hasReview && (
        <div className="rounded border border-zinc-800 p-4">
          <h3 className="mb-3 font-semibold">Leave a Review</h3>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-zinc-300">
              Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={`h-10 w-10 rounded border text-sm font-semibold transition ${
                    rating === n
                      ? "border-white bg-white text-black"
                      : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-zinc-300"
            >
              Comment (optional)
            </label>
            <textarea
              id="comment"
              maxLength={1000}
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className={inputClass}
              placeholder="How was your experience?"
            />
          </div>
          <button
            onClick={() =>
              createReview.mutate({
                orderId,
                rating,
                comment: comment || undefined,
              })
            }
            disabled={createReview.isPending}
            className="rounded bg-white px-4 py-2 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {createReview.isPending ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      )}
    </div>
  );
}
