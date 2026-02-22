import Link from "next/link";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { SignOutButton } from "./sign-out-button";
import { MobileNav } from "./mobile-nav";

export async function NavBar() {
  const session = await auth();
  const user = session
    ? await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
    : null;

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold text-white">
            The Vault
          </Link>
          {/* Desktop Nav Links */}
          <div className="hidden items-center gap-4 text-sm md:flex">
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
                <Link
                  href="/wallet"
                  className="text-zinc-400 transition hover:text-white"
                >
                  Wallet
                </Link>
                <Link
                  href="/analytics"
                  className="text-zinc-400 transition hover:text-white"
                >
                  Analytics
                </Link>
                <Link
                  href="/wishlist"
                  className="text-zinc-400 transition hover:text-white"
                >
                  Wishlist
                </Link>
                {user?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-amber-400 transition hover:text-amber-300"
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        {/* Desktop Right Side */}
        <div className="hidden items-center gap-4 md:flex">
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

        {/* Mobile Nav */}
        <MobileNav
          isAuthenticated={!!session}
          userRole={user?.role ?? null}
          userName={session?.user?.name ?? null}
          memberNumber={session?.user?.memberNumber ?? null}
        />
      </div>
    </nav>
  );
}
