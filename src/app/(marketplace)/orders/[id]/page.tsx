import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { OrderActions } from "~/components/order-actions";
import { safeParseImages } from "~/lib/constants";
import { OrderStatusBadge, PaymentMethodBadge } from "~/components/ui/status-badge";

const ESCROW_STEPS = ["pending", "paid", "shipped", "delivered"] as const;

function EscrowTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx = ESCROW_STEPS.indexOf(currentStatus as typeof ESCROW_STEPS[number]);
  const isCancelled = currentStatus === "cancelled";

  return (
    <div className="glass-card rounded-2xl p-5">
      <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-muted">
        Escrow Status
      </h2>
      <div className="flex items-center gap-2">
        {ESCROW_STEPS.map((step, i) => {
          let stepClass = "escrow-step-pending";
          if (isCancelled) {
            stepClass = "escrow-step-pending";
          } else if (i < currentIdx) {
            stepClass = "escrow-step-done";
          } else if (i === currentIdx) {
            stepClass = "escrow-step-active";
          }

          return (
            <div key={step} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold ${stepClass} ${i === currentIdx && !isCancelled ? "escrow-pulse" : ""}`}
              >
                {i < currentIdx && !isCancelled ? (
                  <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  <span className={i <= currentIdx && !isCancelled ? "text-amber-400" : "text-[var(--text-muted)]"}>{i + 1}</span>
                )}
              </div>
              <span className={`text-[10px] uppercase tracking-wider ${i <= currentIdx && !isCancelled ? "text-[var(--text-heading)]" : "text-muted"}`}>
                {step}
              </span>
              {i < ESCROW_STEPS.length - 1 && (
                <div className={`absolute hidden`} />
              )}
            </div>
          );
        })}
      </div>
      {isCancelled && (
        <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-center text-xs font-medium text-red-400">
          Order Cancelled
        </div>
      )}
    </div>
  );
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  let order;
  try {
    order = await api.order.getById({ id });
  } catch {
    notFound();
  }

  const role = session.user.id === order.buyerId ? "buyer" : "seller";
  const images = safeParseImages(order.listing.images);
  const firstImage = images[0];

  const canDispute =
    role === "buyer" &&
    (order.status === "paid" || order.status === "shipped") &&
    !order.dispute;

  return (
    <main className="page-bg min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <p className="text-muted text-xs tracking-widest uppercase mb-2">Vault Trade Escrow</p>
        <h1 className="font-display text-4xl font-light text-[var(--text-heading)]">
          Trade <span className="gradient-text">#{order.id.slice(-8)}</span>
        </h1>
        <div className="mt-3 flex items-center justify-center gap-3">
          <OrderStatusBadge status={order.status} />
          <PaymentMethodBadge method={order.paymentMethod} />
        </div>
      </div>

      {/* Escrow Timeline */}
      <div className="mb-6">
        <EscrowTimeline currentStatus={order.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Listing Image Card */}
        <div className="glass-card rounded-2xl overflow-hidden !p-0">
          {firstImage ? (
            <div className="relative aspect-square w-full">
              <Image
                src={firstImage}
                alt={order.listing.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ) : (
            <div className="flex aspect-square items-center justify-center bg-[var(--section-bg)] text-muted">
              No Image
            </div>
          )}
          <div className="p-4 border-t border-b divider-line">
            <h2 className="font-display text-lg font-light text-[var(--text-heading)]">
              {order.listing.title}
            </h2>
            <Link
              href={`/listings/${order.listing.id}`}
              className="mt-1 inline-block text-sm font-medium text-[#D4AF37] hover:text-[#F4E5C3] transition-colors"
            >
              View Listing
            </Link>
          </div>
        </div>

        {/* Order Details */}
        <div className="space-y-4">
          {/* Price Breakdown */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-muted">
              Price Breakdown
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b divider-line pb-3">
                <span className="text-muted">Item Total</span>
                <span className="font-display text-2xl font-light text-amber-500">
                  ${(order.totalAmount / 100).toFixed(2)}
                </span>
              </div>
              {order.platformFeeAmount > 0 && (
                <div className="flex justify-between border-b divider-line pb-3">
                  <span className="text-muted">Platform Fee</span>
                  <span className="text-[var(--text-body)]">
                    -${(order.platformFeeAmount / 100).toFixed(2)}
                  </span>
                </div>
              )}
              {order.sellerPayoutAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted">Seller Receives</span>
                  <span className="font-display text-lg font-light text-[#D4AF37]">
                    ${(order.sellerPayoutAmount / 100).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Parties Card */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-muted">
              Parties
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between border-b divider-line pb-3">
                <span className="text-muted">Buyer</span>
                <Link
                  href={
                    order.buyer.profile?.username
                      ? `/profile/${order.buyer.profile.username}`
                      : "#"
                  }
                  className="flex items-center gap-2 font-medium text-[var(--text-heading)] hover:text-[#D4AF37] transition-colors"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 border border-amber-600/20 font-display text-amber-500 text-sm">
                    {(order.buyer.profile?.username ?? order.buyer.name ?? "U").charAt(0).toUpperCase()}
                  </span>
                  {order.buyer.profile?.username ?? order.buyer.name ?? "User"}
                </Link>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Seller</span>
                <Link
                  href={
                    order.seller.profile?.username
                      ? `/profile/${order.seller.profile.username}`
                      : "#"
                  }
                  className="flex items-center gap-2 font-medium text-[var(--text-heading)] hover:text-[#D4AF37] transition-colors"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 border border-amber-600/20 font-display text-amber-500 text-sm">
                    {(order.seller.profile?.username ?? order.seller.name ?? "U").charAt(0).toUpperCase()}
                  </span>
                  {order.seller.profile?.username ?? order.seller.name ?? "User"}
                </Link>
              </div>
            </div>
          </div>

          {/* Crypto Transaction */}
          {order.cryptoTransactionHash && (
            <div className="glass-card rounded-2xl p-5">
              <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-muted">
                Transaction
              </h2>
              <p className="break-all font-mono text-xs text-[var(--text-body)]">
                {order.cryptoTransactionHash}
              </p>
            </div>
          )}

          {/* Dispute Link */}
          {canDispute && (
            <div className="glass-card rounded-2xl border-amber-900/50 bg-amber-950/20 p-5">
              <p className="mb-3 text-sm text-amber-300">
                Having an issue with this order?
              </p>
              <Link
                href={`/disputes/new?orderId=${order.id}`}
                className="inline-block rounded-full bg-gradient-to-r from-amber-600 to-amber-700 px-5 py-2 text-sm font-semibold text-black transition hover:shadow-lg hover:shadow-amber-600/20"
              >
                File a Dispute
              </Link>
            </div>
          )}

          {/* Timestamps */}
          <div className="glass-card rounded-2xl p-5 text-xs text-muted">
            <div className="flex justify-between border-b divider-line pb-2 mb-2">
              <span>Created</span>
              <span className="text-[var(--text-body)]">
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Updated</span>
              <span className="text-[var(--text-body)]">
              {new Date(order.updatedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Actions */}
      <OrderActions
        orderId={order.id}
        role={role}
        status={order.status}
        hasReview={!!order.review}
        trackingNumber={order.trackingNumber}
        shippingCarrier={order.shippingCarrier}
      />

      {/* Footer */}
      <footer className="border-t divider-line mt-12">
        <div className="flex items-center justify-between py-8">
          <span className="gradient-text font-display text-sm font-bold tracking-[0.2em]">
            THE VAULT
          </span>
          <span className="text-xs text-muted tracking-widest">
            PRIVATE &middot; INVITATION ONLY &middot; EST. 2024
          </span>
        </div>
      </footer>
      </div>
    </main>
  );
}
