"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { api } from "~/trpc/react";
import { Skeleton } from "~/components/skeleton";
import { safeParseImages } from "~/lib/constants";
import { OrderStatusBadge } from "~/components/ui/status-badge";

const STATUS_TABS = [
  { label: "All", value: undefined },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
] as const;

function OrderCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex gap-4">
        <Skeleton className="h-20 w-20 shrink-0 rounded-xl" />
        <div className="flex flex-1 items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="space-y-2 flex flex-col items-end">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SalesPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined,
  );

  const { data, isLoading } = api.order.getMyOrders.useQuery({
    role: "seller",
    status: statusFilter,
  });

  const orders = data?.orders ?? [];

  return (
    <main className="page-bg min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <div className="mb-10 text-center">
        <p className="text-muted text-xs tracking-widest uppercase mb-2">Vault Trade Escrow</p>
        <h1 className="font-display text-4xl font-light text-[var(--text-heading)]">
          My <span className="gradient-text">Sales</span>
        </h1>
        <div className="mt-4 flex justify-center">
          <Link
            href="/orders"
            className="glass-card rounded-full px-5 py-2 text-sm text-[#D4AF37] transition hover:border-[#D4AF37]/40"
          >
            View Purchases
          </Link>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setStatusFilter(tab.value)}
            className={`rounded-full px-5 py-2 text-sm transition ${
              statusFilter === tab.value
                ? "bg-[#D4AF37] text-black font-semibold"
                : "glass-effect text-[var(--text-muted)] hover:border-[#D4AF37]/30 hover:text-[var(--text-heading)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/50">
            <svg className="h-8 w-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
            </svg>
          </div>
          <p className="text-muted text-sm">
            {statusFilter
              ? `No ${statusFilter} sales found.`
              : "No sales yet."}
          </p>
          <Link
            href="/listings/new"
            className="mt-4 inline-block rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8960C] px-6 py-2 text-sm font-semibold text-black transition hover:shadow-lg hover:shadow-[#D4AF37]/20"
          >
            Create a Listing
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => {
            const images = safeParseImages(order.listing.images);
            const firstImage = images[0];

            return (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="glass-card flex gap-4 rounded-2xl p-5 transition hover:border-[#D4AF37]/30"
                >
                  {/* Listing Image */}
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[var(--section-bg)]">
                    {firstImage ? (
                      <Image
                        src={firstImage}
                        alt={order.listing.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                        No img
                      </div>
                    )}
                  </div>

                  {/* Order Info */}
                  <div className="flex flex-1 items-center justify-between">
                    <div>
                      <h2 className="font-display text-lg font-light text-[var(--text-heading)]">
                        {order.listing.title}
                      </h2>
                      <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 border border-amber-600/20 font-display text-[10px] text-amber-500">
                          {(order.buyer.profile?.username ?? order.buyer.name ?? "?").charAt(0).toUpperCase()}
                        </span>
                        {order.buyer.profile?.username ?? order.buyer.name}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-display text-xl font-light text-amber-500">
                        ${(order.totalAmount / 100).toFixed(2)}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

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
