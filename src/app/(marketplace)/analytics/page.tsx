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
    pending: "bg-amber-400/10 text-amber-400",
    paid: "bg-yellow-400/10 text-yellow-400",
    shipped: "bg-blue-400/10 text-blue-400",
    delivered: "bg-green-400/10 text-green-400",
    cancelled: "bg-red-400/10 text-red-400",
  };

  return (
    <span
      className={`rounded-xl px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-neutral-400/10 text-neutral-400"}`}
    >
      {status}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <main className="page-bg min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-800 to-transparent px-4 pb-16 pt-20 text-center">
        <div className="relative z-10">
          <div className="mx-auto mb-6 h-16 w-16 animate-shimmer rounded-2xl bg-[var(--divider)]" />
          <div className="mx-auto mb-3 h-4 w-20 animate-shimmer rounded-lg bg-[var(--divider)]" />
          <div className="mx-auto h-12 w-64 animate-shimmer rounded-xl bg-[var(--divider)]" />
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-4 pb-16">
        {/* Stat cards skeleton */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-effect rounded-xl px-6 py-4 text-center stat-card">
              <div className="mb-2 h-4 w-20 mx-auto animate-shimmer rounded-lg bg-[var(--divider)]" />
              <div className="h-8 w-24 mx-auto animate-shimmer rounded-lg bg-[var(--divider)]" />
            </div>
          ))}
        </div>

        {/* Chart skeleton */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <div className="glass-card rounded-2xl p-6">
            <div className="mb-4 h-5 w-36 animate-shimmer rounded-lg bg-[var(--divider)]" />
            <div className="h-52 animate-shimmer rounded-xl bg-[var(--divider)]" />
          </div>
          <div className="glass-card rounded-2xl p-6">
            <div className="mb-4 h-5 w-32 animate-shimmer rounded-lg bg-[var(--divider)]" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 animate-shimmer rounded-lg bg-[var(--divider)]" />
              ))}
            </div>
          </div>
        </div>

        {/* Table skeleton */}
        <div className="glass-card rounded-xl overflow-hidden p-6">
          <div className="mb-4 h-5 w-32 animate-shimmer rounded-lg bg-[var(--divider)]" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-shimmer rounded-lg bg-[var(--divider)]" />
            ))}
          </div>
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
      <main className="page-bg min-h-screen">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h1 className="mb-4 font-display text-4xl font-light text-[var(--text-heading)]">Seller <span className="gradient-text">Analytics</span></h1>
          <div className="glass-card rounded-2xl p-6 border-red-800/30">
            <p className="text-red-400">
              {error.message === "UNAUTHORIZED"
                ? "You must be signed in to view analytics."
                : `Failed to load analytics: ${error.message}`}
            </p>
            <Link
              href="/login"
              className="mt-3 inline-block rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8960C] px-6 py-2.5 font-semibold text-black transition hover:shadow-lg hover:shadow-[#D4AF37]/20"
            >
              Sign in
            </Link>
          </div>
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
    <main className="page-bg min-h-screen">
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-800 to-transparent px-4 pb-16 pt-20 text-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/5 h-1 w-1 rounded-full bg-[#D4AF37]/30 animate-gold-pulse" />
          <div className="absolute bottom-1/3 right-1/4 h-1.5 w-1.5 rounded-full bg-[#D4AF37]/20 animate-gold-pulse" style={{ animationDelay: "1.5s" }} />
        </div>
        <div className="relative z-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/10 animate-float">
            <svg className="h-8 w-8 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
          </div>
          <p className="text-muted text-xs tracking-widest uppercase mb-3">Seller</p>
          <h1 className="font-display text-5xl font-light gradient-text">Analytics</h1>
          <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
          <Link
            href="/orders/sales"
            className="mt-4 inline-block text-sm text-[#D4AF37] transition hover:text-[var(--text-heading)]"
          >
            View All Sales &rarr;
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        {/* Stat Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div className="glass-effect rounded-xl px-6 py-4 text-center stat-card">
            <p className="text-xs text-[var(--text-muted)] tracking-wide uppercase">Total Revenue</p>
            <p className="mt-1 font-display text-3xl font-bold text-[#D4AF37]">
              {formatCurrency(data.totalRevenue)}
            </p>
          </div>
          <div className="glass-effect rounded-xl px-6 py-4 text-center stat-card">
            <p className="text-xs text-[var(--text-muted)] tracking-wide uppercase">Total Orders</p>
            <p className="mt-1 font-display text-3xl font-bold text-[var(--text-heading)]">{data.totalOrders}</p>
          </div>
          <div className="glass-effect rounded-xl px-6 py-4 text-center stat-card">
            <p className="text-xs text-[var(--text-muted)] tracking-wide uppercase">Completed</p>
            <p className="mt-1 font-display text-3xl font-bold text-emerald-400">
              {data.completedOrders}
            </p>
          </div>
          <div className="glass-effect rounded-xl px-6 py-4 text-center stat-card">
            <p className="text-xs text-[var(--text-muted)] tracking-wide uppercase">Active Listings</p>
            <p className="mt-1 font-display text-3xl font-bold text-[var(--text-heading)]">
              {data.activeListings}
            </p>
          </div>
          <div className="glass-effect rounded-xl px-6 py-4 text-center stat-card">
            <p className="text-xs text-[var(--text-muted)] tracking-wide uppercase">Avg Rating</p>
            <p className="mt-1 font-display text-3xl font-bold text-[var(--text-heading)]">
              {data.averageRating != null
                ? `${data.averageRating.toFixed(1)}`
                : "N/A"}
            </p>
            {data.totalReviews > 0 && (
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {data.totalReviews} review{data.totalReviews !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        {/* Charts Row */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Monthly Revenue Chart */}
          <div className="glass-card rounded-2xl p-6">
            <p className="text-muted text-xs tracking-widest uppercase mb-1">Performance</p>
            <h2 className="mb-4 font-display text-xl font-light text-[var(--text-heading)]">
              Monthly <span className="gradient-text">Revenue</span>
            </h2>
            {monthlyEntries.length === 0 ? (
              <p className="py-12 text-center font-display text-sm italic text-[var(--text-muted)]">
                No revenue data yet
              </p>
            ) : (
              <div className="flex items-end justify-center gap-3">
                {monthlyEntries.map(([month, amount]) => (
                  <div key={month} className="flex flex-col items-center gap-1">
                    <span className="text-xs text-[var(--text-body)]">
                      {formatCurrency(amount)}
                    </span>
                    <div
                      className="w-10 rounded-t bg-gradient-to-t from-[#D4AF37]/40 to-[#D4AF37]/20 transition-all duration-300"
                      style={{
                        height: `${(amount / maxRevenue) * 200}px`,
                        minHeight: "4px",
                      }}
                    />
                    <span className="text-xs text-[var(--text-muted)]">
                      {month.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Categories */}
          <div className="glass-card rounded-2xl p-6">
            <p className="text-muted text-xs tracking-widest uppercase mb-1">Breakdown</p>
            <h2 className="mb-4 font-display text-xl font-light text-[var(--text-heading)]">
              Top <span className="gradient-text">Categories</span>
            </h2>
            {categoryEntries.length === 0 ? (
              <p className="py-12 text-center font-display text-sm italic text-[var(--text-muted)]">
                No sales data yet
              </p>
            ) : (
              <div className="space-y-4">
                {categoryEntries.map(([category, count]) => (
                  <div key={category}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="capitalize text-[var(--text-body)]">{category}</span>
                      <span className="font-display text-[#D4AF37]">
                        {count} sale{count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[var(--divider)]">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-[#D4AF37]/60 to-[#D4AF37]/30 transition-all duration-500"
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
        <div>
          <p className="text-muted text-xs tracking-widest uppercase mb-2">Activity</p>
          <h2 className="mb-4 font-display text-2xl font-light text-[var(--text-heading)]">
            Recent <span className="gradient-text">Orders</span>
          </h2>
          {data.recentOrders.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <p className="font-display text-lg italic text-[var(--text-muted)]">
                No orders yet
              </p>
            </div>
          ) : (
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b divider-line">
                      <th className="px-5 py-4 text-xs font-medium tracking-wider uppercase text-[var(--text-muted)]">Listing</th>
                      <th className="px-5 py-4 text-xs font-medium tracking-wider uppercase text-[var(--text-muted)]">Buyer</th>
                      <th className="px-5 py-4 text-xs font-medium tracking-wider uppercase text-[var(--text-muted)]">Amount</th>
                      <th className="px-5 py-4 text-xs font-medium tracking-wider uppercase text-[var(--text-muted)]">Status</th>
                      <th className="px-5 py-4 text-xs font-medium tracking-wider uppercase text-[var(--text-muted)]">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b divider-line last:border-0 transition hover:bg-[rgba(212,175,55,0.03)]"
                      >
                        <td className="px-5 py-4">
                          <span className="text-[var(--text-heading)]">
                            {order.listing.title}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-[var(--text-body)]">
                          {order.buyer.name ?? "Unknown"}
                        </td>
                        <td className="px-5 py-4 font-display font-semibold text-[#D4AF37]">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-5 py-4 text-[var(--text-muted)]">
                          {formatDate(order.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t divider-line py-8 text-center">
        <p className="font-display text-sm tracking-widest gradient-text">THE VAULT</p>
      </footer>
    </main>
  );
}
