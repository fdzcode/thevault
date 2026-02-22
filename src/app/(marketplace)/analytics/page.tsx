"use client";

import Link from "next/link";
import { api } from "~/trpc/react";

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-zinc-400/10 text-zinc-400",
    paid: "bg-yellow-400/10 text-yellow-400",
    shipped: "bg-blue-400/10 text-blue-400",
    delivered: "bg-green-400/10 text-green-400",
    cancelled: "bg-red-400/10 text-red-400",
  };

  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-zinc-400/10 text-zinc-400"}`}
    >
      {status}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 h-8 w-48 animate-pulse rounded bg-zinc-800" />

      {/* Stat cards skeleton */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-4"
          >
            <div className="mb-2 h-4 w-20 animate-pulse rounded bg-zinc-800" />
            <div className="h-7 w-24 animate-pulse rounded bg-zinc-800" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 h-5 w-36 animate-pulse rounded bg-zinc-800" />
          <div className="h-52 animate-pulse rounded bg-zinc-800/50" />
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4 h-5 w-32 animate-pulse rounded bg-zinc-800" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-8 animate-pulse rounded bg-zinc-800/50"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-4 h-5 w-32 animate-pulse rounded bg-zinc-800" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 animate-pulse rounded bg-zinc-800/50"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading, error } = api.order.sellerAnalytics.useQuery();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold">Seller Analytics</h1>
        <div className="rounded-lg border border-red-800 bg-red-900/20 p-4">
          <p className="text-red-400">
            {error.message === "UNAUTHORIZED"
              ? "You must be signed in to view analytics."
              : `Failed to load analytics: ${error.message}`}
          </p>
          <Link
            href="/login"
            className="mt-2 inline-block text-sm text-zinc-400 underline hover:text-white"
          >
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return null;
  }

  const monthlyEntries = Object.entries(data.monthlyRevenue).sort(
    ([a], [b]) => a.localeCompare(b),
  );
  const maxRevenue = Math.max(...monthlyEntries.map(([, v]) => v), 1);

  const categoryEntries = Object.entries(data.topCategories);
  const maxCategoryCount = Math.max(...categoryEntries.map(([, v]) => v), 1);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Seller Analytics</h1>
        <Link
          href="/orders/sales"
          className="text-sm text-zinc-400 transition hover:text-white"
        >
          View All Sales
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-400">Total Revenue</p>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(data.totalRevenue)}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-400">Total Orders</p>
          <p className="text-2xl font-bold text-white">{data.totalOrders}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-400">Completed Orders</p>
          <p className="text-2xl font-bold text-white">
            {data.completedOrders}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-400">Active Listings</p>
          <p className="text-2xl font-bold text-white">
            {data.activeListings}
          </p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-sm text-zinc-400">Average Rating</p>
          <p className="text-2xl font-bold text-white">
            {data.averageRating != null
              ? `${data.averageRating.toFixed(1)} / 5`
              : "N/A"}
          </p>
          {data.totalReviews > 0 && (
            <p className="mt-0.5 text-xs text-zinc-500">
              {data.totalReviews} review{data.totalReviews !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* Monthly Revenue Chart */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Monthly Revenue
          </h2>
          {monthlyEntries.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-500">
              No revenue data yet
            </p>
          ) : (
            <div className="flex items-end justify-center gap-3">
              {monthlyEntries.map(([month, amount]) => (
                <div key={month} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-zinc-400">
                    {formatCurrency(amount)}
                  </span>
                  <div
                    className="w-10 rounded-t bg-white/20"
                    style={{
                      height: `${(amount / maxRevenue) * 200}px`,
                      minHeight: "4px",
                    }}
                  />
                  <span className="text-xs text-zinc-500">
                    {month.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Categories */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Top Categories
          </h2>
          {categoryEntries.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-500">
              No sales data yet
            </p>
          ) : (
            <div className="space-y-3">
              {categoryEntries.map(([category, count]) => (
                <div key={category}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="capitalize text-zinc-300">{category}</span>
                    <span className="text-zinc-500">
                      {count} sale{count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-800">
                    <div
                      className="h-2 rounded-full bg-white/20"
                      style={{
                        width: `${(count / maxCategoryCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Recent Orders
        </h2>
        {data.recentOrders.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            No orders yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="pb-3 pr-4 font-medium">Listing</th>
                  <th className="pb-3 pr-4 font-medium">Buyer</th>
                  <th className="pb-3 pr-4 font-medium">Amount</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-zinc-800/50 last:border-0"
                  >
                    <td className="py-3 pr-4">
                      <span className="text-zinc-200">
                        {order.listing.title}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-zinc-400">
                      {order.buyer.name ?? "Unknown"}
                    </td>
                    <td className="py-3 pr-4 text-zinc-200">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3 text-zinc-400">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
