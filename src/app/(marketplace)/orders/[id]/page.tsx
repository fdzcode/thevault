import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { OrderActions } from "~/components/order-actions";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-400/10 text-yellow-400",
    paid: "bg-blue-400/10 text-blue-400",
    shipped: "bg-purple-400/10 text-purple-400",
    delivered: "bg-green-400/10 text-green-400",
    cancelled: "bg-red-400/10 text-red-400",
  };
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${colors[status] ?? "bg-zinc-400/10 text-zinc-400"}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
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
  const images = JSON.parse(order.listing.images) as string[];
  const firstImage = images[0];

  const canDispute =
    role === "buyer" &&
    (order.status === "paid" || order.status === "shipped") &&
    !order.dispute;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">
            Order ID: <span className="font-mono text-zinc-400">{order.id}</span>
          </p>
          <h1 className="mt-1 text-2xl font-bold">{order.listing.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              order.paymentMethod === "crypto"
                ? "bg-purple-900/50 text-purple-300"
                : "bg-blue-900/50 text-blue-300"
            }`}
          >
            {order.paymentMethod === "crypto" ? "Crypto" : "Stripe"}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Listing Image Card */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
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
            <div className="flex aspect-square items-center justify-center bg-zinc-800 text-zinc-500">
              No Image
            </div>
          )}
          <div className="p-4">
            <Link
              href={`/listings/${order.listing.id}`}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View Listing
            </Link>
          </div>
        </div>

        {/* Order Details Card */}
        <div className="space-y-4">
          {/* Price Breakdown */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wide">
              Price Breakdown
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Item Total</span>
                <span className="font-medium">
                  ${(order.totalAmount / 100).toFixed(2)}
                </span>
              </div>
              {order.platformFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Platform Fee</span>
                  <span className="text-zinc-500">
                    -${(order.platformFee / 100).toFixed(2)}
                  </span>
                </div>
              )}
              {order.sellerPayout > 0 && (
                <div className="flex justify-between border-t border-zinc-800 pt-2">
                  <span className="text-zinc-400">Seller Receives</span>
                  <span className="font-medium text-green-400">
                    ${(order.sellerPayout / 100).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Parties Card */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wide">
              Parties
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Buyer</span>
                <Link
                  href={
                    order.buyer.profile?.username
                      ? `/profile/${order.buyer.profile.username}`
                      : "#"
                  }
                  className="font-medium text-zinc-200 hover:text-white"
                >
                  {order.buyer.profile?.username ?? order.buyer.name ?? "User"}
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Seller</span>
                <Link
                  href={
                    order.seller.profile?.username
                      ? `/profile/${order.seller.profile.username}`
                      : "#"
                  }
                  className="font-medium text-zinc-200 hover:text-white"
                >
                  {order.seller.profile?.username ?? order.seller.name ?? "User"}
                </Link>
              </div>
            </div>
          </div>

          {/* Crypto Transaction */}
          {order.cryptoTransactionHash && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <h2 className="mb-2 text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                Transaction
              </h2>
              <p className="break-all font-mono text-xs text-zinc-300">
                {order.cryptoTransactionHash}
              </p>
            </div>
          )}

          {/* Dispute Link */}
          {canDispute && (
            <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-4">
              <p className="mb-2 text-sm text-amber-300">
                Having an issue with this order?
              </p>
              <Link
                href={`/disputes/new?orderId=${order.id}`}
                className="text-sm font-medium text-amber-400 hover:text-amber-300"
              >
                File a Dispute
              </Link>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-zinc-600">
            <p>
              Created:{" "}
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p>
              Updated:{" "}
              {new Date(order.updatedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
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
    </main>
  );
}
