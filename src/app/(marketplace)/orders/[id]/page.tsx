import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { OrderActions } from "~/components/order-actions";
import { safeParseImages } from "~/lib/constants";
import { OrderStatusBadge, PaymentMethodBadge } from "~/components/ui/status-badge";

const ESCROW_STEPS = [
  {
    key: "pending",
    label: "Pending",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.35)",
  },
  {
    key: "paid",
    label: "Paid",
    color: "#60a5fa",
    bg: "rgba(96,165,250,0.12)",
    border: "rgba(96,165,250,0.35)",
  },
  {
    key: "shipped",
    label: "Shipped",
    color: "#c084fc",
    bg: "rgba(192,132,252,0.12)",
    border: "rgba(192,132,252,0.35)",
  },
  {
    key: "inspecting",
    label: "Inspecting",
    color: "#D4AF37",
    bg: "rgba(212,175,55,0.12)",
    border: "rgba(212,175,55,0.35)",
  },
  {
    key: "delivered",
    label: "Delivered",
    color: "#34d399",
    bg: "rgba(52,211,153,0.12)",
    border: "rgba(52,211,153,0.35)",
  },
] as const;

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21a.75.75 0 0 0 .75-.75v-3.75a3 3 0 0 0-3-3h-1.5V6.75A2.25 2.25 0 0 0 15 4.5H3.375A1.125 1.125 0 0 0 2.25 5.625v8.625" />
    </svg>
  );
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function StepIcon({ step, reached }: { step: number; reached: boolean }) {
  const color = reached ? undefined : "var(--text-muted)";
  const style = { color, width: 18, height: 18 };
  switch (step) {
    case 0: return <ShieldIcon className="" {...{ style }} />;
    case 1: return <TruckIcon className="" {...{ style }} />;
    case 2: return <PackageIcon className="" {...{ style }} />;
    case 3: return <SearchIcon className="" {...{ style }} />;
    case 4: return <CheckIcon className="" {...{ style }} />;
    default: return null;
  }
}

function EscrowTimeline({ currentStatus }: { currentStatus: string }) {
  // Map actual order statuses to our 5-step display
  const statusMap: Record<string, number> = {
    pending: 0,
    paid: 1,
    shipped: 2,
    inspecting: 3,
    delivered: 4,
  };
  const currentIdx = statusMap[currentStatus] ?? -1;
  const isCancelled = currentStatus === "cancelled";

  return (
    <div className="glass-card rounded-2xl p-5">
      <h2 className="mb-5 font-display text-sm font-semibold uppercase tracking-wide text-muted">
        Escrow Status
      </h2>
      <div className="relative flex items-start">
        {/* Connector line background */}
        <div className="absolute top-5 left-[10%] right-[10%] h-0.5" style={{ background: "rgba(255,255,255,0.06)" }} />
        {/* Connector line fill */}
        {!isCancelled && currentIdx >= 0 && (
          <div
            className="absolute top-5 left-[10%] h-0.5 transition-all duration-700 ease-out"
            style={{
              width: `${Math.min(100, (currentIdx / (ESCROW_STEPS.length - 1)) * 80)}%`,
              background: "linear-gradient(90deg, #D4AF37, #F4E5C3)",
            }}
          />
        )}

        {ESCROW_STEPS.map((step, i) => {
          const isDone = !isCancelled && i < currentIdx;
          const isActive = !isCancelled && i === currentIdx;
          const isReached = !isCancelled && i <= currentIdx;

          return (
            <div key={step.key} className="relative flex flex-1 flex-col items-center gap-2">
              <div
                className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${isActive ? "escrow-pulse" : ""}`}
                style={{
                  background: isReached ? step.bg : "rgba(255,255,255,0.02)",
                  borderColor: isReached ? step.border : "rgba(255,255,255,0.06)",
                  boxShadow: isActive ? `0 0 16px ${step.color}40` : "none",
                }}
              >
                {isDone ? (
                  <CheckIcon className="h-4 w-4 text-emerald-400" />
                ) : (
                  <span style={{ color: isReached ? step.color : undefined }}>
                    <StepIcon step={i} reached={isReached} />
                  </span>
                )}
              </div>
              <span
                className="text-[10px] font-medium uppercase tracking-wider"
                style={{ color: isReached ? step.color : "var(--text-muted)" }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      {isCancelled && (
        <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-center text-xs font-medium text-red-400">
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
