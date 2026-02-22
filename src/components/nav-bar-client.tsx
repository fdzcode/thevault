"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "./theme-provider";
import { MobileNav } from "./mobile-nav";

interface NavBarClientProps {
  isAuthenticated: boolean;
  userRole: string | null;
  userName: string | null;
  memberNumber: string | null;
}

function NavLink({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-4 py-2 text-sm tracking-wide transition-all ${
        active
          ? "border border-amber-600/30 bg-amber-600/20 text-amber-500"
          : "text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-white/5"
      }`}
    >
      {children}
    </Link>
  );
}

export function NavBarClient({
  isAuthenticated,
  userRole,
  userName,
  memberNumber,
}: NavBarClientProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    if (moreOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [moreOpen]);

  // Close dropdown on navigation
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const moreLinks = [
    { href: "/orders/sales", label: "Sales" },
    { href: "/wallet", label: "Wallet" },
    { href: "/analytics", label: "Analytics" },
    { href: "/wishlist", label: "Wishlist" },
    { href: "/disputes", label: "Disputes" },
    ...(userRole === "admin" ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  const isMoreActive = moreLinks.some((l) => pathname === l.href || pathname.startsWith(l.href + "/"));

  return (
    <nav className="header-bg sticky top-0 z-50 border-b border-[var(--header-border)] bg-[var(--header-bg)] backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-600 to-amber-800">
            <svg
              className="h-6 w-6 text-black"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </div>
          <span
            className="font-display text-xl font-light text-amber-600"
            style={{ letterSpacing: "0.2em" }}
          >
            THE VAULT
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden items-center gap-1 lg:flex">
          <NavLink href="/listings" active={pathname === "/listings"}>
            Market
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink
                href="/listings/new"
                active={pathname === "/listings/new"}
              >
                List a Piece
              </NavLink>
              <NavLink
                href="/messages"
                active={pathname.startsWith("/messages")}
              >
                Messages
              </NavLink>
              <NavLink
                href="/profile"
                active={
                  pathname === "/profile" ||
                  pathname.startsWith("/profile/")
                }
              >
                Profile
              </NavLink>
              <NavLink
                href="/orders"
                active={pathname.startsWith("/orders")}
              >
                Trades
              </NavLink>
              <NavLink href="/invites" active={pathname === "/invites"}>
                Invites
              </NavLink>

              {/* More Dropdown */}
              <div ref={moreRef} className="relative">
                <button
                  onClick={() => setMoreOpen((v) => !v)}
                  className={`flex items-center gap-1 rounded-lg px-4 py-2 text-sm tracking-wide transition-all ${
                    moreOpen || isMoreActive
                      ? "border border-amber-600/30 bg-amber-600/20 text-amber-500"
                      : "text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-white/5"
                  }`}
                >
                  More
                  <svg
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                </button>

                {/* Dropdown Panel */}
                <div
                  className={`absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-[var(--header-border)] shadow-xl shadow-black/20 backdrop-blur-xl transition-all duration-200 ${
                    moreOpen
                      ? "pointer-events-auto translate-y-0 opacity-100"
                      : "pointer-events-none -translate-y-2 opacity-0"
                  }`}
                  style={{
                    background:
                      theme === "dark"
                        ? "rgba(20, 20, 20, 0.85)"
                        : "rgba(255, 252, 240, 0.9)",
                  }}
                >
                  <div className="p-1.5">
                    {moreLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center rounded-lg px-3 py-2.5 text-sm transition-all ${
                          pathname.startsWith(link.href)
                            ? "bg-amber-600/15 text-amber-500"
                            : "text-[var(--text-body)] hover:text-[var(--text-heading)] hover:bg-white/5"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Desktop Right Side */}
        <div className="hidden items-center gap-3 lg:flex">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[var(--text-muted)] transition-all hover:bg-white/5 hover:text-amber-500"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          {isAuthenticated ? (
            <>
              {/* The Exchange CTA */}
              <Link
                href="/listings"
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-700 to-amber-600 px-5 py-2 text-sm font-semibold text-black transition-all hover:from-amber-600 hover:to-amber-500 hover:shadow-lg hover:shadow-amber-600/30"
              >
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
                  />
                </svg>
                The Exchange
              </Link>

              {/* Member Number */}
              <Link
                href="/profile"
                className="cursor-pointer text-right"
              >
                <p className="text-xs text-[var(--text-muted)]">Member</p>
                <p className="text-sm text-amber-500">
                  #{memberNumber ?? "----"}
                </p>
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-gradient-to-r from-amber-700 to-amber-600 px-5 py-2 text-sm font-semibold text-black transition-all hover:from-amber-600 hover:to-amber-500 hover:shadow-lg hover:shadow-amber-600/30"
            >
              Enter
            </Link>
          )}
        </div>

        {/* Mobile Nav */}
        <MobileNav
          isAuthenticated={isAuthenticated}
          userRole={userRole}
          userName={userName}
          memberNumber={memberNumber}
        />
      </div>
    </nav>
  );
}
