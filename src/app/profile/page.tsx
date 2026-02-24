import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { ProfileForm } from "~/components/profile-form";
import { ProfileView } from "~/components/profile-view";

export default async function MyProfilePage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const profile = await api.profile.getMyProfile();

  // No profile yet — show setup form
  if (!profile) {
    return (
      <main className="page-bg min-h-screen">
        <div className="relative h-52 overflow-hidden bg-gradient-to-br from-[#D4AF37]/30 via-[#B8960C]/15 to-[#D4AF37]/5">
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--page-bg)] via-transparent to-transparent" />
        </div>
        <div className="mx-auto max-w-2xl px-6 -mt-16 relative z-10">
          <h1 className="font-display text-3xl font-light text-[#D4AF37] mb-8">
            Set Up Profile
          </h1>
          <div className="glass-card rounded-2xl p-6 mb-8">
            <ProfileForm initialData={null} />
          </div>
        </div>
      </main>
    );
  }

  // Fetch listings and review data in parallel
  let listings: Array<{
    id: string;
    title: string;
    price: number;
    images: string;
    status: string;
  }> = [];
  let reviewData: {
    reviews: Array<{
      id: string;
      rating: number;
      comment: string | null;
      createdAt: Date;
      author: {
        id: string;
        name: string | null;
        image: string | null;
        profile: { username: string } | null;
      };
    }>;
    averageRating: number | null;
    totalReviews: number;
  } | null = null;

  try {
    const result = await api.listing.getMyListings({ limit: 50 });
    listings = result.listings;
  } catch {
    listings = [];
  }

  try {
    reviewData = await api.review.getForSeller({
      sellerId: profile.user.id,
      limit: 10,
    });
  } catch {
    reviewData = null;
  }

  return (
    <main className="page-bg min-h-screen">
      <ProfileView
        profile={profile}
        listings={listings}
        reviewData={reviewData}
        isOwner={true}
      />
    </main>
  );
}
