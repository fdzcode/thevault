import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-bg min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/5 h-1 w-1 rounded-full bg-[#D4AF37]/30 animate-gold-pulse" />
        <div className="absolute top-1/3 right-1/3 h-1.5 w-1.5 rounded-full bg-[#D4AF37]/20 animate-gold-pulse" style={{ animationDelay: "1.5s" }} />
        <div className="absolute bottom-1/4 left-1/3 h-1 w-1 rounded-full bg-[#D4AF37]/25 animate-gold-pulse" style={{ animationDelay: "3s" }} />
        <div className="absolute top-1/2 right-1/5 h-0.5 w-0.5 rounded-full bg-[#D4AF37]/30 animate-gold-pulse" style={{ animationDelay: "0.8s" }} />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/* THE VAULT branding */}
        <p className="font-display text-sm tracking-[0.3em] text-[var(--text-muted)] uppercase mb-8">
          THE VAULT
        </p>

        {/* Large 404 */}
        <h1 className="font-display text-[10rem] sm:text-[14rem] font-bold leading-none gradient-text">
          404
        </h1>

        {/* Divider */}
        <div className="mx-auto mt-2 mb-6 h-px w-32 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

        <p className="text-lg text-[var(--text-muted)] font-display italic">
          This page does not exist
        </p>

        <Link
          href="/"
          className="mt-10 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B8960C] px-8 py-3 font-semibold text-black transition hover:shadow-lg hover:shadow-[#D4AF37]/25 hover:brightness-110"
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}
