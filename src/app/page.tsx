import Link from "next/link";

import { auth } from "~/server/auth";
import { HomeSearch } from "~/components/home-search";

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white">
      <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          The Vault
        </h1>
        <p className="text-lg text-zinc-400">
          Custom designer trading community &amp; marketplace
        </p>

        <HomeSearch />

        <div className="flex gap-4">
          <Link
            href="/listings"
            className="rounded-full bg-white/10 px-8 py-3 font-semibold no-underline transition hover:bg-white/20"
          >
            Browse Listings
          </Link>
          {session ? (
            <Link
              href="/profile"
              className="rounded-full bg-white/10 px-8 py-3 font-semibold no-underline transition hover:bg-white/20"
            >
              My Profile
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-white/10 px-8 py-3 font-semibold no-underline transition hover:bg-white/20"
            >
              Sign in
            </Link>
          )}
        </div>

        {session && (
          <p className="text-sm text-zinc-500">
            Signed in as {session.user?.name}
          </p>
        )}
      </div>
    </main>
  );
}
