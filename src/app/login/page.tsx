"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EntryGate } from "~/components/entry-gate";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <EntryGate>
      <div className="glass-card rounded-2xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="font-display text-3xl font-light gradient-text tracking-wide">
            Sign In
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Welcome back to The Vault
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[var(--text-body)] mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-bg w-full rounded-xl border border-[var(--input-border)] px-4 py-3 text-[var(--text-heading)] placeholder-[var(--input-placeholder)] transition focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[var(--text-body)] mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-bg w-full rounded-xl border border-[var(--input-border)] px-4 py-3 text-[var(--text-heading)] placeholder-[var(--input-placeholder)] transition focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30"
              placeholder="********"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8960C] px-4 py-3 font-semibold text-black transition hover:shadow-lg hover:shadow-[#D4AF37]/20 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)]">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-[#D4AF37] transition hover:text-[#F4E5C3]"
          >
            Register with invite code
          </Link>
        </p>
      </div>
    </EntryGate>
  );
}
