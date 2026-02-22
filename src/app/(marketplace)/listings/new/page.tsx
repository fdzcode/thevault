import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { CreateListingForm } from "~/components/create-listing-form";

export default async function NewListingPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <CreateListingForm />
    </main>
  );
}
