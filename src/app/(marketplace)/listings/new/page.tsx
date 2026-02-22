import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

export default async function NewListingPage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">Create Listing</h1>
      <p className="text-zinc-400">
        Listing creation form coming soon. Use the tRPC API directly for now.
      </p>
    </main>
  );
}
