"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

export default function AdminUsersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = api.admin.getUsers.useQuery({
    search: debouncedSearch || undefined,
    limit: 25,
  });

  const updateRole = api.admin.updateUserRole.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  useEffect(() => {
    if (error?.data?.code === "FORBIDDEN" || error?.data?.code === "UNAUTHORIZED") {
      router.push("/");
    }
  }, [error, router]);

  if (error && (error.data?.code === "FORBIDDEN" || error.data?.code === "UNAUTHORIZED")) {
    return (
      <main className="page-bg min-h-screen flex items-center justify-center">
        <p className="font-display text-xl italic text-muted">Access denied. Redirecting...</p>
      </main>
    );
  }

  return (
    <main className="page-bg min-h-screen">
      {/* Header */}
      <section className="relative px-4 pt-16 pb-10 overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-800/50 to-transparent">
        <div className="mx-auto max-w-6xl">
          <Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-xs uppercase tracking-widest text-[#D4AF37] transition hover:text-[var(--text-heading)]">
            &larr; Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-4xl font-light text-[var(--text-heading)]">
              User <span className="gradient-text">Management</span>
            </h1>
            <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2.5 py-0.5 text-xs font-medium text-[#D4AF37]">
              Admin
            </span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full input-bg rounded-full border px-5 py-3 text-sm text-[var(--text-heading)] placeholder-[var(--text-muted)] outline-none focus:border-[#D4AF37] transition"
          />
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="glass-card rounded-2xl overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-b divider-line px-6 py-4">
                <div className="h-4 w-48 animate-shimmer rounded bg-[var(--divider)]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b divider-line">
                    <th className="px-6 py-3 text-muted text-xs tracking-widest uppercase font-medium">Name</th>
                    <th className="px-6 py-3 text-muted text-xs tracking-widest uppercase font-medium">Email</th>
                    <th className="px-6 py-3 text-muted text-xs tracking-widest uppercase font-medium">Member #</th>
                    <th className="px-6 py-3 text-muted text-xs tracking-widest uppercase font-medium">Role</th>
                    <th className="px-6 py-3 text-muted text-xs tracking-widest uppercase font-medium">Joined</th>
                    <th className="px-6 py-3 text-muted text-xs tracking-widest uppercase font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.users.map((user) => (
                    <tr key={user.id} className="border-b divider-line transition hover:bg-[var(--glass-card-bg)]">
                      <td className="px-6 py-4 text-[var(--text-heading)]">
                        {user.profile?.displayName ?? user.name ?? "No name"}
                        {user.profile?.username && (
                          <span className="ml-2 text-xs text-muted">@{user.profile.username}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-body)]">{user.email ?? "N/A"}</td>
                      <td className="px-6 py-4 text-muted">
                        {user.memberNumber ? `#${user.memberNumber}` : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            user.role === "admin"
                              ? "border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]"
                              : "bg-[var(--divider)] text-muted"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() =>
                            updateRole.mutate({
                              userId: user.id,
                              role: user.role === "admin" ? "user" : "admin",
                            })
                          }
                          disabled={updateRole.isPending}
                          className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                            user.role === "admin"
                              ? "glass-card text-[var(--text-body)] hover:text-[var(--text-heading)]"
                              : "bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-black hover:opacity-90"
                          } disabled:opacity-50`}
                        >
                          {user.role === "admin" ? "Remove Admin" : "Make Admin"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {data?.users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <p className="font-display text-xl italic text-muted">No users found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {updateRole.error && (
          <p className="mt-4 text-sm text-red-400">
            {updateRole.error.message}
          </p>
        )}
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
