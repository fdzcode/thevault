import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { BuyButton } from "~/components/buy-button";
import { VouchButton } from "~/components/vouch-button";
import { WishlistButton } from "~/components/wishlist-button";
import { MessageSellerButton } from "~/components/message-seller-button";
import {
  CONDITION_BADGE_STYLES,
  CONDITION_LABELS,
  safeParseImages,
} from "~/lib/constants";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();

  let listing;
  try {
    listing = await api.listing.getById({ id });
  } catch {
    notFound();
  }

  const canBuy =
    !!session &&
    session.user.id !== listing.sellerId &&
    listing.status === "active";

  const images = safeParseImages(listing.images);

  const sellerName =
    listing.seller.profile?.displayName ?? listing.seller.name ?? "Member";

  return (
    <main className="page-bg min-h-screen">
      <div className="mx-auto max-w-7xl px-8 py-10">
        {/* Back button */}
        <Link
          href="/listings"
          className="flex items-center gap-2 text-muted hover:text-amber-500 text-sm tracking-wide transition-colors mb-10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Listings
        </Link>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Image area */}
          <div className="space-y-4">
            {/* Main image */}
            <div className="relative aspect-square bg-gradient-to-br from-zinc-900 to-black rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center">
              {images.length > 0 ? (
                <img
                  src={images[0]}
                  alt={listing.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-muted text-sm tracking-wider uppercase">
                  No Image
                </div>
              )}
              {/* Condition badge overlay */}
              <div className="absolute top-4 left-4">
                <span
                  className={`badge ${CONDITION_BADGE_STYLES[listing.condition] ?? ""}`}
                >
                  {CONDITION_LABELS[listing.condition] ?? listing.condition.replace("_", " ")}
                </span>
              </div>
              {/* Status badge overlay */}
              {listing.status !== "active" && (
                <div className="absolute top-4 right-4">
                  <span className="badge bg-[var(--glass-card-bg)] text-[var(--text-muted)] border border-[var(--divider)]">
                    {listing.status}
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail slots */}
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-square glass-card rounded-xl overflow-hidden flex items-center justify-center"
                >
                  {images[i] ? (
                    <img
                      src={images[i]}
                      alt={`${listing.title} ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-muted text-[10px] tracking-wider uppercase">
                      —
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Vouch & Wishlist row */}
            <div className="flex items-center gap-4 pt-2">
              <VouchButton
                listingId={listing.id}
                initialCount={listing.vouchCount}
                initialVouched={listing.userVouched}
                isOwnListing={!!session && session.user.id === listing.sellerId}
                isLoggedIn={!!session}
              />
              <WishlistButton listingId={listing.id} isLoggedIn={!!session} />
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Brand / Category */}
            <div>
              <p className="text-[#D4AF37] text-xs tracking-widest mb-3 uppercase">
                {listing.category}
              </p>
              <h1 className="font-display text-4xl font-semibold text-[var(--text-heading)] mb-2">
                {listing.title}
              </h1>
              <p className="text-muted italic font-display text-xl mb-8">
                {CONDITION_LABELS[listing.condition] ?? listing.condition.replace("_", " ")}
                {listing.listingType !== "for_sale" && (
                  <span className="not-italic">
                    {" "}
                    &middot;{" "}
                    {listing.listingType === "trade"
                      ? "Open to Trade"
                      : "Sale or Trade"}
                  </span>
                )}
              </p>
            </div>

            {/* Price card */}
            <div className="glass-card rounded-xl p-6 mb-6">
              <p className="font-display text-4xl font-light text-[var(--text-heading)]">
                ${(listing.price / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[#D4AF37] text-sm mt-1">
                ~{(listing.price / 100 * 0.000024).toFixed(6)} BTC
              </p>
              <p className="text-muted text-xs mt-2">
                5% platform fee on purchase
              </p>
            </div>

            {/* Detail rows */}
            <div className="space-y-0">
              {[
                { label: "Category", value: listing.category },
                { label: "Condition", value: CONDITION_LABELS[listing.condition] ?? listing.condition.replace("_", " ") },
                { label: "Type", value: listing.listingType === "for_sale" ? "For Sale" : listing.listingType === "trade" ? "Trade" : "Sale or Trade" },
                { label: "Status", value: listing.status.charAt(0).toUpperCase() + listing.status.slice(1) },
                ...(listing.tags ? [{ label: "Tags", value: listing.tags }] : []),
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? "border-b divider-line" : ""}`}
                >
                  <span className="text-muted text-xs tracking-wider uppercase">
                    {row.label}
                  </span>
                  <span className="text-sm text-[var(--text-heading)]">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-muted text-xs tracking-wider uppercase mb-3">
                Description
              </h2>
              <p className="whitespace-pre-wrap text-[var(--text-body)] text-sm leading-relaxed">
                {listing.description}
              </p>
            </div>

            {/* Action buttons */}
            {canBuy && (
              <div className="space-y-3">
                <BuyButton listingId={listing.id} />
                <MessageSellerButton
                  sellerId={listing.sellerId}
                  listingId={listing.id}
                />
              </div>
            )}

            {/* Seller card */}
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-4">
                {/* Avatar circle */}
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {listing.seller.image ? (
                    <img
                      src={listing.seller.image}
                      alt={sellerName}
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-[#D4AF37] font-display text-lg font-semibold">
                      {sellerName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[var(--text-heading)] font-medium truncate">
                    {sellerName}
                  </p>
                  {listing.seller.memberNumber && (
                    <p className="text-[#D4AF37] text-xs tracking-wide">
                      Member #{listing.seller.memberNumber}
                    </p>
                  )}
                  {listing.seller.profile?.username && (
                    <Link
                      href={`/profile/${listing.seller.profile.username}`}
                      className="text-muted text-xs hover:text-[#D4AF37] transition-colors"
                    >
                      View Profile
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t divider-line mt-20 py-10 text-center">
        <p className="gradient-text font-display text-sm tracking-widest uppercase">
          The Vault
        </p>
      </footer>
    </main>
  );
}
