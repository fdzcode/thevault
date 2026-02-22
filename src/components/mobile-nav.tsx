"use client";

import Link from "next/link";
import { useState } from "react";
import { SignOutButton } from "./sign-out-button";

interface MobileNavProps {
  isAuthenticated: boolean;
  userRole: string | null;
  userName: string | null;
  memberNumber: string | null;
}

export function MobileNav({
  isAuthenticated,
  userRole,
  userName,
  memberNumber,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? (
          <svg
            className="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        )}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-72 transform bg-zinc-950 border-l border-zinc-800 transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Menu Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <span className="text-lg font-bold text-white">Menu</span>
            <button
              onClick={() => setOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
              aria-label="Close menu"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* User Info */}
          {isAuthenticated && userName && (
            <div className="border-b border-zinc-800 px-4 py-3">
              <p className="text-sm font-medium text-zinc-200">
                {userName}
                {memberNumber && (
                  <span className="ml-1 text-xs text-zinc-500">
                    #{memberNumber}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Links */}
          <nav className="flex-1 overflow-y-auto px-2 py-3">
            <div className="space-y-1">
              <MobileNavLink href="/listings" onClick={() => setOpen(false)}>
                Browse Listings
              </MobileNavLink>

              {isAuthenticated && (
                <>
                  <MobileNavLink
                    href="/orders"
                    onClick={() => setOpen(false)}
                  >
                    My Orders
                  </MobileNavLink>
                  <MobileNavLink
                    href="/orders/sales"
                    onClick={() => setOpen(false)}
                  >
                    My Sales
                  </MobileNavLink>
                  <MobileNavLink
                    href="/messages"
                    onClick={() => setOpen(false)}
                  >
                    Messages
                  </MobileNavLink>
                  <MobileNavLink
                    href="/profile"
                    onClick={() => setOpen(false)}
                  >
                    My Profile
                  </MobileNavLink>
                  <MobileNavLink
                    href="/invites"
                    onClick={() => setOpen(false)}
                  >
                    Invite Codes
                  </MobileNavLink>
                  <MobileNavLink
                    href="/wallet"
                    onClick={() => setOpen(false)}
                  >
                    Wallet
                  </MobileNavLink>
                  <MobileNavLink
                    href="/analytics"
                    onClick={() => setOpen(false)}
                  >
                    Analytics
                  </MobileNavLink>
                  <MobileNavLink
                    href="/wishlist"
                    onClick={() => setOpen(false)}
                  >
                    Wishlist
                  </MobileNavLink>

                  {userRole === "admin" && (
                    <MobileNavLink
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="text-amber-400 hover:text-amber-300"
                    >
                      Admin
                    </MobileNavLink>
                  )}
                </>
              )}
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-zinc-800 px-4 py-3">
            {isAuthenticated ? (
              <SignOutButton />
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block text-sm text-zinc-400 transition hover:text-white"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileNavLink({
  href,
  onClick,
  className,
  children,
}: {
  href: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block rounded-lg px-3 py-2.5 text-sm transition hover:bg-zinc-900 ${className ?? "text-zinc-400 hover:text-white"}`}
    >
      {children}
    </Link>
  );
}
