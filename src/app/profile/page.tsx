import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { ProfileForm } from "~/components/profile-form";

export default async function MyProfilePage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const profile = await api.profile.getMyProfile();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">
        {profile ? "Edit Profile" : "Set Up Profile"}
      </h1>
      <ProfileForm initialData={profile} />
    </main>
  );
}
