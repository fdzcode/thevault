import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { api } from "~/trpc/server";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${star <= Math.round(rating) ? "text-[#D4AF37]" : "text-[var(--divider)]"}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z"
            clipRule="evenodd"
          />
        </svg>
      ))}
    </div>
  );
}

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
      limit: 5,
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
    const result = await api.listing.search({
      limit: 6,
    });
    listings = result.listings.filter(
      (l) => l.sellerId === profile.user.id,
    );
  } catch {
    listings = [];
  }

  return (
    <main className="page-bg min-h-screen">
      {/* Banner */}
      {profile.bannerUrl ? (
        <div className="relative h-52 overflow-hidden">
          <Image
            src={profile.bannerUrl}
            alt="Profile banner"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1200px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--page-bg)] via-transparent to-transparent" />
        </div>
      ) : (
        <div className="relative h-52 overflow-hidden bg-gradient-to-br from-[#D4AF37]/30 via-[#B8960C]/15 to-[#D4AF37]/5">
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--page-bg)] via-transparent to-transparent" />
        </div>
      )}

      {/* Profile Header */}
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div className="-mt-16 relative z-10">
            {profile.avatarUrl ? (
              <div className="relative w-32 h-32 rounded-2xl border-4 border-black overflow-hidden">
                <Image
                  src={profile.avatarUrl}
                  alt={profile.displayName ?? profile.username}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>
            ) : (
              <div className="flex w-32 h-32 items-center justify-center rounded-2xl border-4 border-black overflow-hidden text-3xl font-bold text-[#D4AF37]" style={{ background: "radial-gradient(circle, #D4AF37 0%, #B8960C 60%, #8B7500 100%)" }}>
                {(profile.displayName ?? profile.username).charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 pb-1">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-light text-[#D4AF37]">
                {profile.displayName ?? profile.username}
              </h1>
              {profile.verified && (
                <span className="badge badge-deadstock">
                  Verified
                </span>
              )}
            </div>
            <p className="text-muted text-sm">
              @{profile.username}
            </p>
            <p className="text-muted text-xs mt-1">
              {profile.user.memberNumber && (
                <span className="text-[#D4AF37]">Member #{profile.user.memberNumber}</span>
              )}
              {profile.user.memberNumber && " · "}
              Joined{" "}
              {new Date(profile.createdAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

      {/* Stats Row */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 text-center stat-card">
          <div className="font-display text-2xl font-bold text-[#D4AF37]">
            {reviewData?.totalReviews ?? 0}
          </div>
          <div className="text-muted text-xs mt-1 uppercase tracking-wide">Trades</div>
        </div>
        <div className="glass-card rounded-xl p-4 text-center stat-card">
          <div className="font-display text-2xl font-bold text-emerald-400">
            {listings.length}
          </div>
          <div className="text-muted text-xs mt-1 uppercase tracking-wide">Active</div>
        </div>
        <div className="glass-card rounded-xl p-4 text-center stat-card">
          <div className="font-display text-2xl font-bold text-purple-400">
            {reviewData?.averageRating !== null && reviewData?.averageRating !== undefined
              ? reviewData.averageRating.toFixed(1)
              : "N/A"}
          </div>
          <div className="text-muted text-xs mt-1 uppercase tracking-wide">Rep</div>
        </div>
      </div>

      {/* Bio Card */}
      <div className="glass-card rounded-2xl p-6 mb-6 mt-6">
        <h2 className="mb-2 text-sm font-semibold text-muted uppercase tracking-wide">
          About
        </h2>
        <p className="text-[var(--text-body)] whitespace-pre-wrap">
          {profile.bio ?? "This member hasn't added a bio yet."}
        </p>
      </div>

      {/* Tab System */}
      <div className="flex gap-0 border-b tab-border mb-8">
        <button className="px-6 py-3 text-sm font-medium text-[#D4AF37] border-b-2 border-[#D4AF37] transition">
          Listings
        </button>
        <button className="px-6 py-3 text-sm font-medium text-muted hover:text-white transition">
          Reviews
        </button>
        <button className="px-6 py-3 text-sm font-medium text-muted hover:text-white transition">
          Details
        </button>
      </div>

      {/* Listings Grid */}
      {listings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
          {listings.map((listing) => {
            const images = JSON.parse(listing.images) as string[];
            const firstImage = images[0];
            return (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="trade-card group"
              >
                <div className="relative aspect-square bg-[var(--section-bg)]">
                  {firstImage ? (
                    <Image
                      src={firstImage}
                      alt={listing.title}
                      fill
                      className="object-cover transition group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, 200px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted">
                      No Image
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium text-[var(--text-heading)]">
                    {listing.title}
                  </p>
                  <p className="text-xs text-[#D4AF37] mt-1">
                    ${(listing.price / 100).toFixed(2)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {listings.length === 0 && (
        <div className="glass-card rounded-2xl p-8 mb-8 text-center">
          <p className="text-muted text-sm">No active listings</p>
        </div>
      )}

      {/* Reviews Section */}
      {reviewData && reviewData.totalReviews > 0 && (
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h2 className="mb-3 text-sm font-semibold text-muted uppercase tracking-wide">
            Seller Reviews
          </h2>
          <div className="mb-4 flex items-center gap-3">
            {reviewData.averageRating !== null && (
              <>
                <span className="font-display text-3xl font-bold text-[var(--text-heading)]">
                  {reviewData.averageRating.toFixed(1)}
                </span>
                <div>
                  <StarRating rating={reviewData.averageRating} />
                  <p className="mt-0.5 text-xs text-muted">
                    {reviewData.totalReviews}{" "}
                    {reviewData.totalReviews === 1 ? "review" : "reviews"}
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="space-y-3">
            {reviewData.reviews.map((review) => (
              <div
                key={review.id}
                className="border-t border-[var(--divider)] pt-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--text-heading)]">
                      {review.author.profile?.username ??
                        review.author.name ??
                        "User"}
                    </span>
                    <StarRating rating={review.rating} />
                  </div>
                  <span className="text-xs text-muted">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {review.comment && (
                  <p className="mt-1 text-sm text-muted">
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details & Links */}
      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="glass-card rounded-2xl p-6">
          <h2 className="mb-3 text-sm font-semibold text-muted uppercase tracking-wide">
            Details
          </h2>
          <dl className="space-y-2 text-sm">
            {profile.location && (
              <div>
                <dt className="text-muted">Location</dt>
                <dd className="text-[var(--text-body)]">{profile.location}</dd>
              </div>
            )}
            {profile.specialty && (
              <div>
                <dt className="text-muted">Specialty</dt>
                <dd className="text-[var(--text-body)]">{profile.specialty}</dd>
              </div>
            )}
            <div>
              <dt className="text-muted">Member Since</dt>
              <dd className="text-[var(--text-body)]">
                {new Date(profile.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </dd>
            </div>
          </dl>
        </div>

        {(profile.instagramHandle ??
          profile.twitterHandle ??
          profile.websiteUrl) && (
          <div className="glass-card rounded-2xl p-6">
            <h2 className="mb-3 text-sm font-semibold text-muted uppercase tracking-wide">
              Links
            </h2>
            <div className="space-y-2 text-sm">
              {profile.instagramHandle && (
                <a
                  href={`https://instagram.com/${profile.instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted hover:text-[#D4AF37] transition"
                >
                  <span>Instagram</span>
                  <span className="text-[var(--text-body)]">
                    @{profile.instagramHandle}
                  </span>
                </a>
              )}
              {profile.twitterHandle && (
                <a
                  href={`https://x.com/${profile.twitterHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted hover:text-[#D4AF37] transition"
                >
                  <span>Twitter/X</span>
                  <span className="text-[var(--text-body)]">
                    @{profile.twitterHandle}
                  </span>
                </a>
              )}
              {profile.websiteUrl && (
                <a
                  href={profile.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-muted hover:text-[#D4AF37] transition"
                >
                  <span>Website</span>
                  <span className="truncate text-[var(--text-body)]">
                    {profile.websiteUrl.replace(/^https?:\/\//, "")}
                  </span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
      </div>
    </main>
  );
}
