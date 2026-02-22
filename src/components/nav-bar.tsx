import Link from "next/link";
import { auth } from "~/server/auth";
import { SignOutButton } from "./sign-out-button";

export async function NavBar() {
  const session = await auth();

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-white">
            The Vault
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/listings"
              className="text-zinc-400 transition hover:text-white"
            >
              Browse Listings
            </Link>
            {session && (
              <>
                <Link
                  href="/orders"
                  className="text-zinc-400 transition hover:text-white"
                >
                  My Orders
                </Link>
                <Link
                  href="/orders/sales"
                  className="text-zinc-400 transition hover:text-white"
                >
                  My Sales
                </Link>
                <Link
                  href="/messages"
                  className="text-zinc-400 transition hover:text-white"
                >
                  Messages
                </Link>
                <Link
                  href="/profile"
                  className="text-zinc-400 transition hover:text-white"
                >
                  My Profile
                </Link>
                <Link
                  href="/invites"
                  className="text-zinc-400 transition hover:text-white"
                >
                  Invite Codes
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {session ? (
            <>
              <span className="text-sm text-zinc-300">
                {session.user?.name}
                {session.user?.memberNumber && (
                  <span className="ml-1 text-xs text-zinc-500">#{session.user.memberNumber}</span>
                )}
              </span>
              <SignOutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
