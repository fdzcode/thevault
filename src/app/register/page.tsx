"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { api } from "~/trpc/react";
import { EntryGate } from "~/components/entry-gate";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<1 | 2>(1);
  const [inviteCode, setInviteCode] = useState(searchParams.get("invite") ?? "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [memberNumber, setMemberNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateInvite = api.auth.validateInviteCode.useQuery(
    { code: inviteCode },
    { enabled: false },
  );

  const registerMutation = api.auth.register.useMutation();

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await validateInvite.refetch();
    setLoading(false);

    if (result.data?.valid) {
      setStep(2);
    } else {
      setError("Invalid or already-used invite code");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await registerMutation.mutateAsync({
        inviteCode,
        email,
        password,
        name: name || undefined,
      });

      setMemberNumber(result.memberNumber);

      // Auto sign-in
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      setLoading(false);

      if (signInResult?.error) {
        // Registration succeeded but auto-login failed — redirect to login
        router.push("/login");
      } else {
        // Brief pause to show member number before redirecting
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 2000);
      }
    } catch (err) {
      setLoading(false);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Registration failed. Please try again.");
      }
    }
  };

  // Success state — member number reveal
  if (memberNumber) {
    return (
      <EntryGate>
        <div className="glass-card rounded-2xl p-8 space-y-6 text-center">
          <h1 className="font-display text-3xl font-light gradient-text tracking-wide">
            Welcome to The Vault
          </h1>
          <p className="text-[var(--text-muted)]">Your member number is</p>
          <p className="animate-count-up font-mono text-5xl font-bold tracking-widest text-[#D4AF37]">
            {memberNumber}
          </p>
          <p className="text-sm text-[var(--text-muted)]">Redirecting...</p>
        </div>
      </EntryGate>
    );
  }

  return (
    <EntryGate>
      <div className="glass-card rounded-2xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="font-display text-3xl font-light gradient-text tracking-wide">
            Join The Vault
          </h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {step === 1
              ? "Enter your invite code to get started"
              : "Create your account"}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all ${
            step >= 1
              ? "bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-black"
              : "border border-[var(--divider)] text-[var(--text-muted)]"
          }`}>
            {step > 1 ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : "1"}
          </div>
          <div className={`h-px w-8 transition-all ${step > 1 ? "bg-[#D4AF37]" : "bg-[var(--divider)]"}`} />
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all ${
            step >= 2
              ? "bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-black"
              : "border border-[var(--divider)] text-[var(--text-muted)]"
          }`}>
            2
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleValidateCode} className="space-y-4">
            <div>
              <label
                htmlFor="inviteCode"
                className="block text-sm font-medium text-[var(--text-body)] mb-1"
              >
                Invite Code
              </label>
              <input
                id="inviteCode"
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="input-bg w-full rounded-xl border border-[var(--input-border)] px-4 py-3 font-mono uppercase tracking-widest text-[var(--text-heading)] placeholder-[var(--input-placeholder)] transition focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30"
                placeholder="XXXXXXXX"
                maxLength={8}
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading || inviteCode.length === 0}
              className="w-full rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8960C] px-4 py-3 font-semibold text-black transition hover:shadow-lg hover:shadow-[#D4AF37]/20 disabled:opacity-50"
            >
              {loading ? "Checking..." : "Continue"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-4 py-3">
              <span className="text-xs text-[var(--text-muted)]">Invite Code</span>
              <p className="font-mono tracking-widest text-[#D4AF37]">{inviteCode}</p>
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-[var(--text-body)] mb-1"
              >
                Name (optional)
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-bg w-full rounded-xl border border-[var(--input-border)] px-4 py-3 text-[var(--text-heading)] placeholder-[var(--input-placeholder)] transition focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30"
                placeholder="Your name"
              />
            </div>

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
                Password (min 8 characters)
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
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
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setError(null);
              }}
              className="w-full text-sm text-[var(--text-muted)] transition hover:text-[#D4AF37]"
            >
              Use a different invite code
            </button>
          </form>
        )}

        <p className="text-center text-sm text-[var(--text-muted)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[#D4AF37] transition hover:text-[#F4E5C3]"
          >
            Sign in
          </Link>
        </p>
      </div>
    </EntryGate>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
