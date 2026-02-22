"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { inputClass, goldButtonClass } from "~/lib/constants";

const CARRIERS = [
  { value: "usps", label: "USPS" },
  { value: "ups", label: "UPS" },
  { value: "fedex", label: "FedEx" },
  { value: "dhl", label: "DHL" },
  { value: "other", label: "Other" },
] as const;

function getTrackingUrl(
  carrier: string | null | undefined,
  trackingNumber: string,
): string | null {
  switch (carrier) {
    case "usps":
      return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(trackingNumber)}`;
    case "ups":
      return `https://www.ups.com/track?tracknum=${encodeURIComponent(trackingNumber)}`;
    case "fedex":
      return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(trackingNumber)}`;
    case "dhl":
      return `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${encodeURIComponent(trackingNumber)}`;
    default:
      return null;
  }
}

export function OrderActions({
  orderId,
  role,
  status,
  hasReview,
  trackingNumber: existingTracking,
  shippingCarrier: existingCarrier,
}: {
  orderId: string;
  role: "buyer" | "seller";
  status: string;
  hasReview: boolean;
  trackingNumber?: string | null;
  shippingCarrier?: string | null;
}) {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingCarrier, setShippingCarrier] = useState<string>("usps");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const updateStatus = api.order.updateStatus.useMutation({
    onSuccess: (_data, variables) => {
      const label =
        variables.status === "shipped"
          ? "Order marked as shipped"
          : "Delivery confirmed";
      toast.success(label);
      router.refresh();
    },
    onError: (err) => {
      toast.error(err.message);
      setError(err.message);
    },
  });

  const createReview = api.review.create.useMutation({
    onSuccess: () => {
      toast.success("Review submitted");
      router.refresh();
    },
    onError: (err) => {
      toast.error(err.message);
      setError(err.message);
    },
  });

  const trackingUrl = existingTracking
    ? getTrackingUrl(existingCarrier, existingTracking)
    : null;

  const carrierLabel =
    CARRIERS.find((c) => c.value === existingCarrier)?.label ?? existingCarrier;


  return (
    <div className="mt-8 space-y-5">
      {error && (
        <div className="glass-card rounded-2xl border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Tracking Info Display */}
      {existingTracking && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted">
            Tracking Information
          </h3>
          <div className="space-y-2 text-sm">
            {existingCarrier && (
              <div className="flex justify-between border-b divider-line pb-2">
                <span className="text-muted">Carrier</span>
                <span className="font-medium text-[var(--text-heading)]">
                  {carrierLabel}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted">Tracking</span>
              <span className="font-medium text-[var(--text-heading)]">
                {existingTracking}
              </span>
            </div>
          </div>
          {trackingUrl && (
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8960C] px-5 py-2 text-sm font-semibold text-black transition hover:shadow-lg hover:shadow-[#D4AF37]/20"
            >
              Track Package
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
          )}
        </div>
      )}

      {/* Seller: Ship Order */}
      {role === "seller" && status === "paid" && (
        <div className="glass-card">
          <h3 className="mb-3 font-display font-semibold text-[var(--text-heading)]">Ship Order</h3>
          <div className="mb-3">
            <label
              htmlFor="carrier"
              className="block text-sm font-medium text-[var(--text-body)]"
            >
              Shipping Carrier
            </label>
            <select
              id="carrier"
              value={shippingCarrier}
              onChange={(e) => setShippingCarrier(e.target.value)}
              className={inputClass}
            >
              {CARRIERS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label
              htmlFor="tracking"
              className="block text-sm font-medium text-[var(--text-body)]"
            >
              Tracking Number
            </label>
            <input
              id="tracking"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className={inputClass}
              placeholder="Enter tracking number"
              required
            />
          </div>
          <button
            onClick={() => {
              if (!trackingNumber.trim()) {
                setError("Tracking number is required");
                return;
              }
              updateStatus.mutate({
                id: orderId,
                status: "shipped",
                trackingNumber: trackingNumber.trim(),
                shippingCarrier,
              });
            }}
            disabled={updateStatus.isPending}
            className={goldButtonClass}
          >
            {updateStatus.isPending ? "Updating..." : "Mark Shipped"}
          </button>
        </div>
      )}

      {/* Buyer: Confirm Delivery */}
      {role === "buyer" && status === "shipped" && (
        <div className="glass-card">
          <h3 className="mb-3 font-display font-semibold text-[var(--text-heading)]">Confirm Delivery</h3>
          <p className="mb-3 text-sm text-[var(--text-muted)]">
            Confirm that you have received the item.
          </p>
          <button
            onClick={() =>
              updateStatus.mutate({ id: orderId, status: "delivered" })
            }
            disabled={updateStatus.isPending}
            className={goldButtonClass}
          >
            {updateStatus.isPending ? "Updating..." : "Confirm Delivery"}
          </button>
        </div>
      )}

      {/* Buyer: Leave Review */}
      {role === "buyer" && status === "delivered" && !hasReview && (
        <div className="glass-card">
          <h3 className="mb-3 font-display font-semibold text-[var(--text-heading)]">Leave a Review</h3>
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium text-[var(--text-body)]">
              Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className={`h-10 w-10 rounded-xl border text-sm font-semibold transition ${
                    rating === n
                      ? "border-[#D4AF37] bg-[#D4AF37] text-black"
                      : "border-[var(--divider)] text-[var(--text-body)] hover:border-[#D4AF37]/30"
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
              className="block text-sm font-medium text-[var(--text-body)]"
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
            className={goldButtonClass}
          >
            {createReview.isPending ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      )}
    </div>
  );
}
