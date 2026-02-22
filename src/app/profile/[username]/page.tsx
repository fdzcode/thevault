import { notFound } from "next/navigation";
import { api } from "~/trpc/server";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  let profile;
  try {
    profile = await api.profile.getByUsername({ username });
  } catch {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">
        {profile.displayName ?? profile.username}
      </h1>
      <p className="mb-4 text-sm text-zinc-400">@{profile.username}</p>
      {profile.bio && (
        <p className="mb-4 text-zinc-300">{profile.bio}</p>
      )}
      {profile.location && (
        <p className="text-sm text-zinc-500">{profile.location}</p>
      )}
      {profile.specialty && (
        <p className="mt-1 text-sm text-zinc-500">
          Specialty: {profile.specialty}
        </p>
      )}
    </main>
  );
}
