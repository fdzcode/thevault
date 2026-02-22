"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { api } from "~/trpc/react";

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

  // Success state
  if (memberNumber) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white">
        <div className="w-full max-w-sm space-y-6 px-4 text-center">
          <h1 className="text-3xl font-extrabold">Welcome to The Vault</h1>
          <p className="text-zinc-400">Your member number is</p>
          <p className="text-5xl font-mono font-bold tracking-widest">
            {memberNumber}
          </p>
          <p className="text-sm text-zinc-500">Redirecting...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold">Join The Vault</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {step === 1
              ? "Enter your invite code to get started"
              : "Create your account"}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleValidateCode} className="space-y-4">
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-zinc-300">
                Invite Code
              </label>
              <input
                id="inviteCode"
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-white uppercase tracking-widest placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
                placeholder="XXXXXXXX"
                maxLength={8}
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading || inviteCode.length === 0}
              className="w-full rounded bg-white px-4 py-2 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
            >
              {loading ? "Checking..." : "Continue"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2">
              <span className="text-xs text-zinc-500">Invite Code</span>
              <p className="font-mono tracking-widest">{inviteCode}</p>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-300">
                Name (optional)
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                Password (min 8 characters)
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
                placeholder="********"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-white px-4 py-2 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setError(null);
              }}
              className="w-full text-sm text-zinc-500 hover:text-zinc-300"
            >
              Use a different invite code
            </button>
          </form>
        )}

        <p className="text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="text-white underline hover:text-zinc-300">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
