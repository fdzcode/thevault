import Link from "next/link";

import { auth } from "~/server/auth";
import { HomeSearch } from "~/components/home-search";

export default async function Home() {
  const session = await auth();

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center px-4 py-28 sm:py-36 overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900">
        {/* Floating gold particles with pulse */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/5 h-1 w-1 rounded-full bg-[#D4AF37]/30 animate-gold-pulse" style={{ animationDelay: "0s" }} />
          <div className="absolute top-1/3 right-1/3 h-1.5 w-1.5 rounded-full bg-[#D4AF37]/20 animate-gold-pulse" style={{ animationDelay: "1.5s" }} />
          <div className="absolute bottom-1/4 left-1/3 h-1 w-1 rounded-full bg-[#D4AF37]/25 animate-gold-pulse" style={{ animationDelay: "3s" }} />
          <div className="absolute top-1/2 right-1/5 h-0.5 w-0.5 rounded-full bg-[#D4AF37]/30 animate-gold-pulse" style={{ animationDelay: "0.8s" }} />
          <div className="absolute bottom-1/3 right-1/2 h-1 w-1 rounded-full bg-[#D4AF37]/15 animate-gold-pulse" style={{ animationDelay: "2.2s" }} />
          <div className="absolute top-1/5 right-1/4 h-0.5 w-0.5 rounded-full bg-[#D4AF37]/20 animate-gold-pulse" style={{ animationDelay: "4s" }} />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 text-center">
          {/* EST label */}
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-muted)] animate-fade-in">
            EST. 2024
          </span>

          <h1 className="font-display text-5xl font-light tracking-tight sm:text-7xl text-amber-500 animate-fade-in">
            Welcome to The Vault
          </h1>

          <p className="max-w-lg text-lg text-zinc-400 text-[var(--text-body)] animate-slide-up" style={{ animationDelay: "0.2s" }}>
            A private marketplace for custom designer pieces.
            <br />
            <span className="text-[#D4AF37] font-medium">Invite-only.</span> Curated. Authenticated.
          </p>

          <div className="w-full max-w-xl animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <HomeSearch />
          </div>

          <div className="flex gap-4 animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <Link
              href="/listings"
              className="rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8960C] px-8 py-3 font-semibold text-black no-underline transition hover:shadow-lg hover:shadow-[#D4AF37]/25 hover:brightness-110"
            >
              Browse Listings
            </Link>
            <Link
              href={session ? "/listings/new" : "/login"}
              className="glass-card rounded-full px-8 py-3 font-semibold text-[var(--text-heading)] no-underline transition hover:border-[#D4AF37]/40"
            >
              List a Piece
            </Link>
          </div>

          {session && (
            <p className="text-sm text-[var(--text-muted)]">
              Welcome back, <span className="text-[#D4AF37]">{session.user?.name}</span>
            </p>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="mx-auto max-w-4xl px-4 -mt-12 relative z-20">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="glass-effect rounded-xl p-6 text-center stat-card">
            <p className="font-display text-3xl font-bold text-[#D4AF37]">200+</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Active Listings</p>
          </div>
          <div className="glass-effect rounded-xl p-6 text-center stat-card">
            <p className="font-display text-3xl font-bold text-emerald-400">500+</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Completed Trades</p>
          </div>
          <div className="glass-effect rounded-xl p-6 text-center stat-card">
            <p className="font-display text-3xl font-bold text-purple-400">150+</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Verified Members</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-5xl px-4 py-24">
        <h2 className="mb-12 text-center font-display text-3xl font-bold text-[var(--text-heading)]">
          How <span className="gradient-text">It Works</span>
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Card I */}
          <div className="shimmer-border glass-card rounded-xl p-8 text-center">
            <span className="block font-display text-sm text-[var(--text-muted)] tracking-widest mb-3">I</span>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">
              <svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
              </svg>
            </div>
            <h3 className="mb-2 font-display text-lg italic text-[var(--text-heading)]">
              You&apos;re Invited
            </h3>
            <p className="text-sm text-[var(--text-body)]">
              Every member is vouched for by someone inside. No exceptions.
            </p>
          </div>

          {/* Card II */}
          <div className="shimmer-border glass-card rounded-xl p-8 text-center">
            <span className="block font-display text-sm text-[var(--text-muted)] tracking-widest mb-3">II</span>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">
              <svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <h3 className="mb-2 font-display text-lg italic text-[var(--text-heading)]">
              You List
            </h3>
            <p className="text-sm text-[var(--text-body)]">
              Post what you&apos;re selling or trading with photos, price, and what you&apos;d accept.
            </p>
          </div>

          {/* Card III */}
          <div className="shimmer-border glass-card rounded-xl p-8 text-center">
            <span className="block font-display text-sm text-[var(--text-muted)] tracking-widest mb-3">III</span>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37]/10 text-[#D4AF37]">
              <svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <h3 className="mb-2 font-display text-lg italic text-[var(--text-heading)]">
              You Deal
            </h3>
            <p className="text-sm text-[var(--text-body)]">
              Connect directly. Platform escrow. Cash or crypto.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t divider-line mt-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-8">
          <span className="gradient-text font-display text-sm font-bold tracking-[0.2em]">
            THE VAULT
          </span>
          <span className="text-xs text-[var(--text-muted)] tracking-widest">
            PRIVATE &middot; INVITATION ONLY &middot; EST. 2024
          </span>
        </div>
      </footer>
    </main>
  );
}
