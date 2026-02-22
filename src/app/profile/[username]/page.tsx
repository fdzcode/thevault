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
          className={`h-4 w-4 ${star <= Math.round(rating) ? "text-yellow-400" : "text-zinc-700"}`}
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

  // Fetch reviews for this seller
  let reviewData;
  try {
    reviewData = await api.review.getForSeller({
      sellerId: profile.user.id,
      limit: 5,
    });
  } catch {
    reviewData = null;
  }

  // Fetch active listings by this seller
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
    // Filter to only this seller's listings
    listings = result.listings.filter(
      (l) => l.sellerId === profile.user.id,
    );
  } catch {
    listings = [];
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* Banner */}
      {profile.bannerUrl ? (
        <div className="relative mb-6 h-48 w-full overflow-hidden rounded-xl">
          <Image
            src={profile.bannerUrl}
            alt="Profile banner"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      ) : (
        <div className="mb-6 h-32 w-full rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-800" />
      )}

      {/* Profile Header */}
      <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:gap-6">
        {/* Avatar */}
        <div className="-mt-16 relative z-10 sm:-mt-20">
          {profile.avatarUrl ? (
            <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-zinc-950 sm:h-28 sm:w-28">
              <Image
                src={profile.avatarUrl}
                alt={profile.displayName ?? profile.username}
                fill
                className="object-cover"
                sizes="112px"
              />
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-zinc-950 bg-zinc-800 text-2xl font-bold text-zinc-400 sm:h-28 sm:w-28">
              {(profile.displayName ?? profile.username).charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Name + Meta */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {profile.displayName ?? profile.username}
            </h1>
            {profile.verified && (
              <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                Verified
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-zinc-400">
            @{profile.username}
            {profile.user.memberNumber && (
              <span className="ml-2 text-xs text-zinc-600">
                #{profile.user.memberNumber}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column: Bio + Info */}
        <div className="space-y-4 md:col-span-2">
          {/* Bio */}
          {profile.bio && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <h2 className="mb-2 text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                About
              </h2>
              <p className="text-zinc-300 whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}

          {/* Reviews Summary */}
          {reviewData && reviewData.totalReviews > 0 && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <h2 className="mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                Seller Reviews
              </h2>
              <div className="mb-4 flex items-center gap-3">
                {reviewData.averageRating !== null && (
                  <>
                    <span className="text-3xl font-bold">
                      {reviewData.averageRating.toFixed(1)}
                    </span>
                    <div>
                      <StarRating rating={reviewData.averageRating} />
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {reviewData.totalReviews}{" "}
                        {reviewData.totalReviews === 1 ? "review" : "reviews"}
                      </p>
                    </div>
                  </>
                )}
              </div>
              {/* Recent Reviews */}
              <div className="space-y-3">
                {reviewData.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-t border-zinc-800 pt-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-300">
                          {review.author.profile?.username ??
                            review.author.name ??
                            "User"}
                        </span>
                        <StarRating rating={review.rating} />
                      </div>
                      <span className="text-xs text-zinc-600">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="mt-1 text-sm text-zinc-400">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Listings */}
          {listings.length > 0 && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <h2 className="mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                Active Listings
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {listings.map((listing) => {
                  const images = JSON.parse(
                    listing.images,
                  ) as string[];
                  const firstImage = images[0];
                  return (
                    <Link
                      key={listing.id}
                      href={`/listings/${listing.id}`}
                      className="group overflow-hidden rounded-lg border border-zinc-800 transition hover:border-zinc-600"
                    >
                      <div className="relative aspect-square bg-zinc-800">
                        {firstImage ? (
                          <Image
                            src={firstImage}
                            alt={listing.title}
                            fill
                            className="object-cover transition group-hover:scale-105"
                            sizes="(max-width: 640px) 50vw, 200px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-zinc-600">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="truncate text-sm font-medium text-zinc-200">
                          {listing.title}
                        </p>
                        <p className="text-xs text-zinc-400">
                          ${(listing.price / 100).toFixed(2)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Details */}
        <div className="space-y-4">
          {/* Info Card */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <h2 className="mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wide">
              Details
            </h2>
            <dl className="space-y-2 text-sm">
              {profile.location && (
                <div>
                  <dt className="text-zinc-500">Location</dt>
                  <dd className="text-zinc-300">{profile.location}</dd>
                </div>
              )}
              {profile.specialty && (
                <div>
                  <dt className="text-zinc-500">Specialty</dt>
                  <dd className="text-zinc-300">{profile.specialty}</dd>
                </div>
              )}
              <div>
                <dt className="text-zinc-500">Member Since</dt>
                <dd className="text-zinc-300">
                  {new Date(profile.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </dd>
              </div>
            </dl>
          </div>

          {/* Social Links Card */}
          {(profile.instagramHandle ??
            profile.twitterHandle ??
            profile.websiteUrl) && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <h2 className="mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wide">
                Links
              </h2>
              <div className="space-y-2 text-sm">
                {profile.instagramHandle && (
                  <a
                    href={`https://instagram.com/${profile.instagramHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-zinc-400 hover:text-white"
                  >
                    <span>Instagram</span>
                    <span className="text-zinc-300">
                      @{profile.instagramHandle}
                    </span>
                  </a>
                )}
                {profile.twitterHandle && (
                  <a
                    href={`https://x.com/${profile.twitterHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-zinc-400 hover:text-white"
                  >
                    <span>Twitter/X</span>
                    <span className="text-zinc-300">
                      @{profile.twitterHandle}
                    </span>
                  </a>
                )}
                {profile.websiteUrl && (
                  <a
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-zinc-400 hover:text-white"
                  >
                    <span>Website</span>
                    <span className="truncate text-zinc-300">
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
