import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { CreateListingForm } from "~/components/create-listing-form";

export default async function NewListingPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Create Listing</h1>
      <CreateListingForm />
    </main>
  );
}
