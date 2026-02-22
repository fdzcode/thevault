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
    <main className="page-bg min-h-screen">
      {/* Banner */}
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-[#D4AF37]/30 via-[#B8960C]/15 to-[#D4AF37]/5">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--page-bg)] via-transparent to-transparent" />
      </div>

      <div className="mx-auto max-w-2xl px-6 -mt-16 relative z-10">
        <h1 className="font-display text-3xl font-light text-[#D4AF37] mb-8">
          {profile ? "Edit Profile" : "Set Up Profile"}
        </h1>
        <div className="glass-card rounded-2xl p-6 mb-8">
          <ProfileForm initialData={profile} />
        </div>
      </div>
    </main>
  );
}
