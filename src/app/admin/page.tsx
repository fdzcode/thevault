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
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold text-white">Admin Dashboard</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-zinc-800 bg-zinc-900 p-6"
            >
              <div className="mb-2 h-4 w-24 rounded bg-zinc-800" />
              <div className="h-8 w-16 rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-red-400">Access denied. Redirecting...</p>
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
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-white">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 transition hover:border-zinc-600"
          >
            <p className="mb-1 text-sm text-zinc-400">{stat.label}</p>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Quick Links */}
      <h2 className="mb-4 text-lg font-semibold text-white">Management</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Users", description: "Manage user accounts and roles", href: "/admin/users" },
          { label: "Listings", description: "Review and moderate listings", href: "/admin/listings" },
          { label: "Orders", description: "View all platform orders", href: "/admin/orders" },
          { label: "Disputes", description: "Handle dispute resolution", href: "/admin/disputes" },
        ].map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition hover:border-zinc-600"
          >
            <h3 className="font-semibold text-white">{link.label}</h3>
            <p className="mt-1 text-sm text-zinc-400">{link.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
