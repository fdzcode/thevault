"use client";

import Link from "next/link";
import { useState } from "react";
import { useTheme } from "./theme-provider";
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
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-muted)] transition hover:bg-[var(--glass-card-bg)] hover:text-[var(--text-heading)]"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? (
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        )}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-out Menu */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-72 transform border-l border-[var(--divider)] bg-[var(--page-bg)] transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Menu Header */}
          <div className="flex items-center justify-between border-b border-[var(--divider)] px-4 py-3">
            <span className="font-display text-lg font-bold tracking-widest text-[#D4AF37]">
              THE VAULT
            </span>
            <button
              onClick={() => setOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[var(--text-muted)] transition hover:bg-[var(--glass-card-bg)] hover:text-[var(--text-heading)]"
              aria-label="Close menu"
            >
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info */}
          {isAuthenticated && userName && (
            <div className="border-b border-[var(--divider)] px-4 py-3">
              <p className="text-sm font-medium text-[var(--text-heading)]">
                {userName}
                {memberNumber && (
                  <span className="ml-1 text-xs text-[#D4AF37]">
                    #{memberNumber}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Links */}
          <nav className="flex-1 overflow-y-auto px-2 py-3">
            <div className="space-y-1">
              {/* Primary Navigation */}
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Navigate
              </p>
              <MobileNavLink href="/listings" onClick={() => setOpen(false)}>
                Market
              </MobileNavLink>

              {isAuthenticated && (
                <>
                  <MobileNavLink href="/listings/new" onClick={() => setOpen(false)} gold>
                    + List a Piece
                  </MobileNavLink>
                  <MobileNavLink href="/messages" onClick={() => setOpen(false)}>
                    Messages
                  </MobileNavLink>
                  <MobileNavLink href="/profile" onClick={() => setOpen(false)}>
                    Profile
                  </MobileNavLink>
                  <MobileNavLink href="/orders" onClick={() => setOpen(false)}>
                    Trades
                  </MobileNavLink>
                  <MobileNavLink href="/invites" onClick={() => setOpen(false)}>
                    Invites
                  </MobileNavLink>

                  {/* Secondary Navigation */}
                  <div className="my-2 border-t border-[var(--divider)]" />
                  <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                    More
                  </p>
                  <MobileNavLink href="/orders/sales" onClick={() => setOpen(false)}>
                    Sales
                  </MobileNavLink>
                  <MobileNavLink href="/wallet" onClick={() => setOpen(false)}>
                    Wallet
                  </MobileNavLink>
                  <MobileNavLink href="/analytics" onClick={() => setOpen(false)}>
                    Analytics
                  </MobileNavLink>
                  <MobileNavLink href="/wishlist" onClick={() => setOpen(false)}>
                    Wishlist
                  </MobileNavLink>
                  <MobileNavLink href="/disputes" onClick={() => setOpen(false)}>
                    Disputes
                  </MobileNavLink>

                  {userRole === "admin" && (
                    <>
                      <div className="my-2 border-t border-[var(--divider)]" />
                      <MobileNavLink href="/admin" onClick={() => setOpen(false)} gold>
                        Admin
                      </MobileNavLink>
                    </>
                  )}
                </>
              )}
            </div>
          </nav>

          {/* Footer */}
          <div className="space-y-3 border-t border-[var(--divider)] px-4 py-3">
            <button
              onClick={toggleTheme}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--text-muted)] transition hover:bg-[var(--glass-card-bg)] hover:text-[var(--text-heading)]"
            >
              {theme === "dark" ? (
                <>
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                  Light Mode
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                  Dark Mode
                </>
              )}
            </button>
            {isAuthenticated ? (
              <SignOutButton />
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="block rounded-xl bg-gradient-to-r from-amber-700 to-amber-600 px-4 py-2 text-center text-sm font-semibold text-black transition hover:shadow-lg hover:shadow-amber-600/30"
              >
                Enter The Vault
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
  gold,
  children,
}: {
  href: string;
  onClick: () => void;
  gold?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block rounded-xl px-3 py-2.5 text-sm transition hover:bg-[var(--glass-card-bg)] ${
        gold
          ? "font-medium text-[#D4AF37] hover:text-[#D4AF37]"
          : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
      }`}
    >
      {children}
    </Link>
  );
}
