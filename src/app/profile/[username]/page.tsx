import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import { ProfileView } from "~/components/profile-view";

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

  let reviewData;
  try {
    reviewData = await api.review.getForSeller({
      sellerId: profile.user.id,
      limit: 10,
    });
  } catch {
    reviewData = null;
  }

  let listings: Array<{
    id: string;
    title: string;
    price: number;
    images: string;
    sellerId: string;
  }> = [];
  try {
    const result = await api.listing.search({ limit: 20 });
    listings = result.listings.filter(
      (l) => l.sellerId === profile.user.id,
    );
  } catch {
    listings = [];
  }

  return (
    <main className="page-bg min-h-screen">
      <ProfileView
        profile={profile}
        listings={listings}
        reviewData={reviewData}
        isOwner={false}
      />
    </main>
  );
}
