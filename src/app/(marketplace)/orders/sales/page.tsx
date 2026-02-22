"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { api } from "~/trpc/react";
import { Skeleton } from "~/components/skeleton";

const STATUS_TABS = [
  { label: "All", value: undefined },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-400/10 text-yellow-400",
  paid: "bg-blue-400/10 text-blue-400",
  shipped: "bg-purple-400/10 text-purple-400",
  delivered: "bg-green-400/10 text-green-400",
  cancelled: "bg-red-400/10 text-red-400",
};

function OrderCardSkeleton() {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex gap-4">
        <Skeleton className="h-20 w-20 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
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
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Sales</h1>
        <Link
          href="/orders"
          className="text-sm text-zinc-400 transition hover:text-white"
        >
          View Purchases
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setStatusFilter(tab.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              statusFilter === tab.value
                ? "bg-white text-black"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
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
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
          <p className="text-zinc-500">
            {statusFilter
              ? `No ${statusFilter} sales found.`
              : "No sales yet."}
          </p>
          <Link
            href="/listings/new"
            className="mt-4 inline-block text-sm text-blue-400 hover:text-blue-300"
          >
            Create a Listing
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => {
            const images = JSON.parse(
              order.listing.images,
            ) as string[];
            const firstImage = images[0];

            return (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="flex gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition hover:border-zinc-600"
                >
                  {/* Listing Image */}
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                    {firstImage ? (
                      <Image
                        src={firstImage}
                        alt={order.listing.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-zinc-600">
                        No img
                      </div>
                    )}
                  </div>

                  {/* Order Info */}
                  <div className="flex flex-1 items-start justify-between">
                    <div>
                      <h2 className="font-semibold text-zinc-100">
                        {order.listing.title}
                      </h2>
                      <p className="mt-0.5 text-sm text-zinc-400">
                        Buyer:{" "}
                        {order.buyer.profile?.username ?? order.buyer.name}
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        ${(order.totalAmount / 100).toFixed(2)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-zinc-400/10 text-zinc-400"}`}
                    >
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
