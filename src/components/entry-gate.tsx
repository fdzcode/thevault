"use client";

import { useState, useEffect } from "react";

type GatePhase = "locked" | "unlocking" | "open";

export function EntryGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<GatePhase>("locked");

  useEffect(() => {
    // Start unlock sequence after brief delay
    const t1 = setTimeout(() => setPhase("unlocking"), 600);
    const t2 = setTimeout(() => setPhase("open"), 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-black via-zinc-950 to-black">
      {/* 30 floating gold particles with pulse animations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-amber-600/40"
            style={{
              left: `${Math.round(3 + ((i * 31 + 7) % 94))}%`,
              top: `${Math.round(5 + ((i * 37 + 13) % 90))}%`,
              animation: `pulse 3s ease-in-out ${(i * 0.2) % 3}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Vault door animation — key + concentric circles + text */}
      <div
        className="absolute flex flex-col items-center justify-center transition-all duration-700"
        style={{
          opacity: phase === "open" ? 0 : 1,
          transform:
            phase === "open"
              ? "scale(0.95) translateY(-30px)"
              : phase === "unlocking"
                ? "scale(1.05)"
                : "scale(1)",
          pointerEvents: phase === "open" ? "none" : "auto",
        }}
      >
        {/* Concentric circles + key icon */}
        <div className="relative flex items-center justify-center">
          {/* Outer circle */}
          <div className="absolute h-64 w-64 rounded-full border-2 border-amber-600/20" />
          {/* Middle circle */}
          <div className="absolute h-48 w-48 rounded-full border border-amber-600/10" />
          {/* Inner circle */}
          <div className="absolute h-36 w-36 rounded-full border border-amber-600/10" />

          {/* Large key icon with glow */}
          <div
            className={`relative flex h-32 w-32 items-center justify-center transition-all duration-700 ${
              phase !== "locked"
                ? "drop-shadow-[0_0_40px_rgba(217,119,6,0.5)]"
                : ""
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              className={`h-32 w-32 transition-all duration-700 ${
                phase === "locked"
                  ? "text-amber-600/60 key-float"
                  : "text-amber-600"
              }`}
              style={{
                transform:
                  phase === "unlocking"
                    ? "rotate(90deg)"
                    : "rotate(0deg)",
                filter:
                  phase !== "locked"
                    ? "drop-shadow(0 0 30px rgba(217,119,6,0.6))"
                    : "none",
              }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
              />
            </svg>

            {/* Gold ring animation on unlock */}
            {phase !== "locked" && (
              <div className="absolute inset-0 rounded-full border-2 border-amber-600/50 animate-gold-pulse" />
            )}
          </div>
        </div>

        {/* THE VAULT text */}
        <h1
          className={`mt-12 font-display text-7xl font-extralight tracking-[0.5em] transition-all duration-500 ${
            phase === "locked"
              ? "text-amber-600/60"
              : "text-amber-600"
          }`}
        >
          THE VAULT
        </h1>

        {/* Gold divider line */}
        <div className="mt-6 h-px w-64 bg-gradient-to-r from-transparent via-amber-600 to-transparent" />

        {/* YOU'VE BEEN SUMMONED text */}
        <p
          className={`mt-6 text-sm font-light tracking-[0.3em] uppercase transition-all duration-500 ${
            phase === "locked"
              ? "text-zinc-600"
              : "text-amber-600/80"
          }`}
        >
          {phase === "locked" ? "YOU'VE BEEN SUMMONED" : "WELCOME"}
        </p>
      </div>

      {/* Form content slides up when vault opens */}
      <div
        className="relative z-10 w-full max-w-md px-4 transition-all duration-700"
        style={{
          opacity: phase === "open" ? 1 : 0,
          transform:
            phase === "open" ? "translateY(0)" : "translateY(30px)",
          pointerEvents: phase === "open" ? "auto" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
