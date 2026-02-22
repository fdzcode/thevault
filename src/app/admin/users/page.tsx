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
          <h1 className="text-2xl font-bold text-white">User Management</h1>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-zinc-600"
        />
      </div>

      {/* Users Table */}
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
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Member #</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.users.map((user) => (
                <tr key={user.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                  <td className="px-4 py-3 text-white">
                    {user.profile?.displayName ?? user.name ?? "No name"}
                    {user.profile?.username && (
                      <span className="ml-2 text-xs text-zinc-500">@{user.profile.username}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{user.email ?? "N/A"}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {user.memberNumber ? `#${user.memberNumber}` : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-amber-900/50 text-amber-400"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        updateRole.mutate({
                          userId: user.id,
                          role: user.role === "admin" ? "user" : "admin",
                        })
                      }
                      disabled={updateRole.isPending}
                      className={`rounded px-3 py-1 text-xs font-medium transition ${
                        user.role === "admin"
                          ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                          : "bg-amber-900/50 text-amber-400 hover:bg-amber-900"
                      } disabled:opacity-50`}
                    >
                      {user.role === "admin" ? "Remove Admin" : "Make Admin"}
                    </button>
                  </td>
                </tr>
              ))}
              {data?.users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {updateRole.error && (
        <p className="mt-4 text-sm text-red-400">
          {updateRole.error.message}
        </p>
      )}
    </main>
  );
}
