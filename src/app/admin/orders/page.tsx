"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

const STATUS_OPTIONS = ["all", "pending", "paid", "shipped", "delivered", "cancelled"] as const;

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-900/50 text-yellow-400",
    paid: "bg-emerald-900/50 text-emerald-400",
    shipped: "bg-blue-900/50 text-blue-400",
    delivered: "bg-purple-900/50 text-purple-400",
    cancelled: "bg-red-900/50 text-red-400",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        styles[status] ?? "bg-zinc-800 text-zinc-400"
      }`}
    >
      {status}
    </span>
  );
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading, error } = api.admin.getOrders.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 25,
  });

  useEffect(() => {
    if (error?.data?.code === "FORBIDDEN" || error?.data?.code === "UNAUTHORIZED") {
      router.push("/");
    }
  }, [error, router]);

  if (error && (error.data?.code === "FORBIDDEN" || error.data?.code === "UNAUTHORIZED")) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-red-400">Access denied. Redirecting...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-sm text-zinc-400 transition hover:text-white">
            &larr; Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white">Order Management</h1>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
              statusFilter === status
                ? "bg-white text-black"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded border border-zinc-800 bg-zinc-900 p-4">
              <div className="h-4 w-48 rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Listing</th>
                <th className="px-4 py-3 font-medium">Buyer</th>
                <th className="px-4 py-3 font-medium">Seller</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.orders.map((order) => (
                <tr key={order.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-white">
                    {order.listing.title}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    {order.buyer.profile?.username
                      ? `@${order.buyer.profile.username}`
                      : order.buyer.name ?? order.buyer.email ?? "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    {order.seller.profile?.username
                      ? `@${order.seller.profile.username}`
                      : order.seller.name ?? order.seller.email ?? "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">
                    ${(order.totalAmount / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">{statusBadge(order.status)}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {data?.orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
