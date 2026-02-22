import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white">
      <h1 className="text-6xl font-extrabold">404</h1>
      <p className="mt-4 text-lg text-zinc-400">Page not found</p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-white/10 px-8 py-3 font-semibold transition hover:bg-white/20"
      >
        Go Home
      </Link>
    </main>
  );
}
