import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export default async function MyProfilePage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin");
  }

  const profile = await api.profile.getMyProfile();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">My Profile</h1>
      {profile ? (
        <div className="rounded border border-zinc-800 p-4">
          <p className="font-semibold">@{profile.username}</p>
          {profile.displayName && (
            <p className="text-zinc-300">{profile.displayName}</p>
          )}
          {profile.bio && (
            <p className="mt-2 text-sm text-zinc-400">{profile.bio}</p>
          )}
          {profile.location && (
            <p className="mt-1 text-sm text-zinc-500">{profile.location}</p>
          )}
        </div>
      ) : (
        <p className="text-zinc-400">
          No profile yet. Set up your profile using the tRPC API.
        </p>
      )}
    </main>
  );
}
