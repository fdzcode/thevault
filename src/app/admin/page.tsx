"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "~/trpc/react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data: stats, isLoading, error } = api.admin.stats.useQuery();

  useEffect(() => {
    if (error?.data?.code === "FORBIDDEN" || error?.data?.code === "UNAUTHORIZED") {
      router.push("/");
    }
  }, [error, router]);

  if (isLoading) {
    return (
      <main className="page-bg min-h-screen">
        <section className="relative px-4 pt-16 pb-10 overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-800/50 to-transparent">
          <div className="mx-auto max-w-6xl">
            <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.3em] text-muted">Control Center</span>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-4xl font-light text-[var(--text-heading)]">
                Admin <span className="gradient-text">Dashboard</span>
              </h1>
              <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2.5 py-0.5 text-xs font-medium text-[#D4AF37]">
                Admin
              </span>
            </div>
          </div>
        </section>
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="glass-effect rounded-xl px-6 py-4 text-center stat-card"
              >
                <div className="mx-auto mb-2 h-4 w-24 animate-shimmer rounded bg-[var(--divider)]" />
                <div className="mx-auto h-8 w-16 animate-shimmer rounded bg-[var(--divider)]" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-bg min-h-screen flex items-center justify-center">
        <p className="font-display text-xl italic text-muted">Access denied. Redirecting...</p>
      </main>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers ?? 0, href: "/admin/users" },
    { label: "Total Listings", value: stats?.totalListings ?? 0, href: "/admin/listings" },
    { label: "Total Orders", value: stats?.totalOrders ?? 0, href: "/admin/orders" },
    {
      label: "Total Revenue",
      value: `$${((stats?.totalRevenue ?? 0) / 100).toFixed(2)}`,
      href: "/admin/orders",
    },
    {
      label: "Active Disputes",
      value: stats?.activeDisputes ?? 0,
      href: "/admin/disputes",
    },
  ];

  return (
    <main className="page-bg min-h-screen">
      {/* Header */}
      <section className="relative px-4 pt-16 pb-10 overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-800/50 to-transparent">
        <div className="mx-auto max-w-6xl">
          <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.3em] text-muted">Control Center</span>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-4xl font-light text-[var(--text-heading)]">
              Admin <span className="gradient-text">Dashboard</span>
            </h1>
            <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2.5 py-0.5 text-xs font-medium text-[#D4AF37]">
              Admin
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        {/* Stats Cards */}
        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="glass-effect rounded-xl px-6 py-4 text-center stat-card group"
            >
              <p className="mb-1 text-xs tracking-widest uppercase text-muted">{stat.label}</p>
              <p className="font-display text-3xl font-bold text-[var(--text-heading)] transition-colors group-hover:text-[#D4AF37]">
                {stat.value}
              </p>
            </Link>
          ))}
        </div>

        {/* Quick Links */}
        <h2 className="font-display mb-6 text-2xl font-light text-[var(--text-heading)]">
          <span className="gradient-text">Management</span>
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Users", description: "Manage user accounts and roles", href: "/admin/users" },
            { label: "Listings", description: "Review and moderate listings", href: "/admin/listings" },
            { label: "Orders", description: "View all platform orders", href: "/admin/orders" },
            { label: "Disputes", description: "Handle dispute resolution", href: "/admin/disputes" },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="glass-card group rounded-2xl p-6 transition hover:shadow-[0_0_20px_rgba(212,175,55,0.1)]"
            >
              <h3 className="font-display text-lg font-semibold text-[var(--text-heading)] transition-colors group-hover:text-[#D4AF37]">
                {link.label}
              </h3>
              <p className="mt-2 text-sm text-muted">{link.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t divider-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-8">
          <span className="gradient-text font-display text-sm font-bold tracking-[0.2em]">THE VAULT</span>
          <span className="text-xs text-muted tracking-widest">ADMIN PANEL</span>
        </div>
      </footer>
    </main>
  );
}
