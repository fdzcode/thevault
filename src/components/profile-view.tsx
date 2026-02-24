"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { TrustLevel } from "~/components/trust-level";
import {
  safeParseImages,
  inputClass,
  goldButtonClass,
  secondaryButtonClass,
  ORDER_STATUS_STYLES,
} from "~/lib/constants";

// ─── Types ──────────────────────────────────────────────────────────

interface ProfileUser {
  id: string;
  name: string | null;
  memberNumber: string | number | null;
  createdAt?: Date | string;
}

interface ProfileData {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  location: string | null;
  specialty: string | null;
  instagramHandle: string | null;
  twitterHandle: string | null;
  websiteUrl: string | null;
  verified: boolean;
  createdAt: Date | string;
  user: ProfileUser;
}

interface ListingData {
  id: string;
  title: string;
  price: number;
  images: string;
  status?: string;
}

interface ReviewAuthor {
  id: string;
  name: string | null;
  image: string | null;
  profile: { username: string } | null;
}

interface ReviewData {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date | string;
  author: ReviewAuthor;
}

interface ReviewInfo {
  reviews: ReviewData[];
  averageRating: number | null;
  totalReviews: number;
}

interface ProfileViewProps {
  profile: ProfileData;
  listings: ListingData[];
  reviewData: ReviewInfo | null;
  isOwner: boolean;
}

// ─── Sub-components ─────────────────────────────────────────────────

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

function BannerParticles() {
  // 15 animated dots scattered across the banner
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: `${5 + ((i * 17 + 7) % 90)}%`,
    top: `${10 + ((i * 23 + 11) % 75)}%`,
    delay: `${(i * 0.4) % 3}s`,
    size: 2 + (i % 3),
  }));

  return (
    <>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-[#D4AF37] animate-pulse"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: "2.5s",
            opacity: 0.3,
          }}
        />
      ))}
    </>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export function ProfileView({
  profile,
  listings,
  reviewData,
  isOwner,
}: ProfileViewProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [specialty, setSpecialty] = useState(profile.specialty ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [instagramHandle, setInstagramHandle] = useState(profile.instagramHandle ?? "");
  const [twitterHandle, setTwitterHandle] = useState(profile.twitterHandle ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(profile.websiteUrl ?? "");
  const [error, setError] = useState<string | null>(null);

  const updateProfile = api.profile.update.useMutation({
    onSuccess: () => {
      setEditing(false);
      router.refresh();
    },
    onError: (err) => setError(err.message),
  });

  const handleSave = () => {
    setError(null);
    updateProfile.mutate({
      username: profile.username,
      displayName: displayName || undefined,
      bio: bio || undefined,
      location: location || undefined,
      specialty: specialty || undefined,
      avatarUrl: avatarUrl || undefined,
      instagramHandle: instagramHandle || undefined,
      twitterHandle: twitterHandle || undefined,
      websiteUrl: websiteUrl || undefined,
    });
  };

  const handleCancel = () => {
    setDisplayName(profile.displayName ?? "");
    setBio(profile.bio ?? "");
    setLocation(profile.location ?? "");
    setSpecialty(profile.specialty ?? "");
    setAvatarUrl(profile.avatarUrl ?? "");
    setInstagramHandle(profile.instagramHandle ?? "");
    setTwitterHandle(profile.twitterHandle ?? "");
    setWebsiteUrl(profile.websiteUrl ?? "");
    setError(null);
    setEditing(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = (await res.json()) as { urls: string[] };
      if (data.urls[0]) {
        setAvatarUrl(data.urls[0]);
      }
    } catch {
      // upload failed silently
    }
  };

  const tradeCount = reviewData?.totalReviews ?? 0;
  const styleTags = specialty ? specialty.split(",").map((s) => s.trim()).filter(Boolean) : [];

  const ownerTabs = ["My Listings", "Trade History", "Saved"];
  const publicTabs = ["Listings", "Reviews", "Details"];
  const tabs = isOwner ? ownerTabs : publicTabs;

  return (
    <div>
      {/* ── Banner ── */}
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-[#D4AF37]/30 via-[#B8960C]/15 to-[#D4AF37]/5">
        {profile.bannerUrl && (
          <Image
            src={profile.bannerUrl}
            alt="Profile banner"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1200px"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--page-bg)] via-transparent to-transparent" />
        <BannerParticles />

        {/* Edit / Save+Cancel buttons */}
        {isOwner && (
          <div className="absolute right-4 top-4 z-20 flex gap-2">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={updateProfile.isPending}
                  className={goldButtonClass + " text-sm"}
                >
                  {updateProfile.isPending ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleCancel}
                  className={secondaryButtonClass + " text-sm"}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className={secondaryButtonClass + " text-sm"}
              >
                Edit Profile
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Profile Header: Avatar + Identity + Stats ── */}
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6 -mt-16 relative z-10">
          {/* Avatar */}
          <div className="relative shrink-0">
            {avatarUrl ? (
              <div className="relative h-32 w-32 overflow-hidden rounded-2xl border-4 border-black">
                <Image
                  src={avatarUrl}
                  alt={displayName || profile.username}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>
            ) : (
              <div
                className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border-4 border-black text-3xl font-bold text-[#D4AF37]"
                style={{
                  background: "radial-gradient(circle, #D4AF37 0%, #B8960C 60%, #8B7500 100%)",
                }}
              >
                {(displayName || profile.username).charAt(0).toUpperCase()}
              </div>
            )}
            {editing && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 text-xs font-medium text-white opacity-0 transition hover:opacity-100"
                >
                  Change
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </>
            )}
          </div>

          {/* Name / Handle / Member info */}
          <div className="flex-1 pb-1">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl font-light text-[#D4AF37]">
                {editing ? displayName || profile.username : profile.displayName ?? profile.username}
              </h1>
              {profile.verified && (
                <span className="badge badge-deadstock">Verified</span>
              )}
            </div>
            <p className="text-sm text-muted">@{profile.username}</p>
            <p className="mt-1 text-xs text-muted">
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

          {/* Stats cards */}
          <div className="flex gap-3 pb-1">
            <div className="glass-card stat-card rounded-xl px-5 py-3 text-center">
              <div className="font-display text-2xl font-bold text-[#D4AF37]">
                {tradeCount}
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted">Trades</div>
            </div>
            <div className="glass-card stat-card rounded-xl px-5 py-3 text-center">
              <div className="font-display text-2xl font-bold text-emerald-400">
                {listings.filter((l) => l.status !== "cancelled" && l.status !== "sold").length}
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted">Active</div>
            </div>
            <div className="glass-card stat-card rounded-xl px-5 py-3 text-center">
              <div className="font-display text-2xl font-bold text-purple-400">
                {reviewData?.averageRating != null
                  ? reviewData.averageRating.toFixed(1)
                  : "N/A"}
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted">Rep</div>
            </div>
          </div>
        </div>

        {/* ── Bio + Style Card ── */}
        <div className="glass-card mt-6 rounded-2xl p-6">
          {editing ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-body)]">Display Name</label>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={`${inputClass} input-bg`}
                    maxLength={50}
                    placeholder="Your Display Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-body)]">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className={`${inputClass} input-bg`}
                    rows={4}
                    maxLength={500}
                    placeholder="Tell others about yourself..."
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-body)]">Location</label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={`${inputClass} input-bg`}
                    maxLength={100}
                    placeholder="City, State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-body)]">Style Tags</label>
                  <input
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className={`${inputClass} input-bg`}
                    maxLength={100}
                    placeholder="Streetwear, Sneakers, Vintage"
                  />
                  <p className="mt-1 text-xs text-muted">Comma-separated tags</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-body)]">Instagram</label>
                  <input
                    value={instagramHandle}
                    onChange={(e) => setInstagramHandle(e.target.value)}
                    className={`${inputClass} input-bg`}
                    maxLength={50}
                    placeholder="@handle"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-body)]">Twitter / X</label>
                  <input
                    value={twitterHandle}
                    onChange={(e) => setTwitterHandle(e.target.value)}
                    className={`${inputClass} input-bg`}
                    maxLength={50}
                    placeholder="@handle"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-body)]">Website</label>
                  <input
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className={`${inputClass} input-bg`}
                    placeholder="https://yoursite.com"
                  />
                </div>
              </div>
              {error && (
                <p className="col-span-full text-sm text-red-400">{error}</p>
              )}
            </div>
          ) : (
            <>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">
                About
              </h2>
              <p className="whitespace-pre-wrap text-[var(--text-body)]">
                {profile.bio ?? "This member hasn't added a bio yet."}
              </p>
              {(profile.location != null || styleTags.length > 0) && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {profile.location && (
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {profile.location}
                    </span>
                  )}
                  {styleTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2.5 py-0.5 text-xs font-medium text-[#D4AF37]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Trust Level ── */}
        <div className="mt-6">
          <TrustLevel tradeCount={tradeCount} />
        </div>

        {/* ── Tabs ── */}
        <div className="mt-8 flex gap-0 border-b tab-border">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-6 py-3 text-sm font-medium transition ${
                activeTab === i
                  ? "border-b-2 border-[#D4AF37] text-[#D4AF37]"
                  : "text-muted hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div className="mb-8 mt-6">
          {isOwner ? (
            <>
              {activeTab === 0 && <OwnerListingsTab listings={listings} />}
              {activeTab === 1 && <TradeHistoryTab />}
              {activeTab === 2 && <SavedTab />}
            </>
          ) : (
            <>
              {activeTab === 0 && <PublicListingsTab listings={listings} />}
              {activeTab === 1 && <ReviewsTab reviewData={reviewData} />}
              {activeTab === 2 && <DetailsTab profile={profile} />}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-[var(--divider)] py-8 text-center">
          <p className="font-display text-sm uppercase tracking-[0.3em] text-muted">
            The Vault
          </p>
          {profile.user.memberNumber && (
            <p className="mt-1 text-xs text-[#D4AF37]">
              Member #{profile.user.memberNumber}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab Panels ─────────────────────────────────────────────────────

function OwnerListingsTab({ listings }: { listings: ListingData[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {listings.map((listing) => {
        const images = safeParseImages(listing.images);
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
              <p className="mt-1 text-xs text-[#D4AF37]">
                ${(listing.price / 100).toFixed(2)}
              </p>
            </div>
          </Link>
        );
      })}

      {/* Add Listing placeholder */}
      <Link
        href="/sell"
        className="trade-card group flex flex-col items-center justify-center gap-2 border border-dashed border-[var(--divider)] p-6"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D4AF37]/10">
          <svg
            className="h-6 w-6 text-[#D4AF37]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span className="text-xs font-medium text-muted group-hover:text-[#D4AF37] transition">
          Add Listing
        </span>
      </Link>
    </div>
  );
}

function PublicListingsTab({ listings }: { listings: ListingData[] }) {
  if (listings.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="text-sm text-muted">No active listings</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {listings.map((listing) => {
        const images = safeParseImages(listing.images);
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
              <p className="mt-1 text-xs text-[#D4AF37]">
                ${(listing.price / 100).toFixed(2)}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function TradeHistoryTab() {
  const { data, isLoading } = api.order.getMyOrders.useQuery({
    role: "seller",
    limit: 20,
  });

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        <p className="mt-2 text-sm text-muted">Loading trade history...</p>
      </div>
    );
  }

  const orders = data?.orders ?? [];

  if (orders.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="text-sm text-muted">No trade history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const images = safeParseImages(order.listing.images);
        const firstImage = images[0];
        const statusStyle = ORDER_STATUS_STYLES[order.status] ?? "badge";
        return (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="glass-card flex items-center gap-4 rounded-xl p-4 transition hover:border-[#D4AF37]/30"
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--section-bg)]">
              {firstImage ? (
                <Image
                  src={firstImage}
                  alt={order.listing.title}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-muted">
                  N/A
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-[var(--text-heading)]">
                {order.listing.title}
              </p>
              <p className="text-xs text-muted">
                {order.buyer?.profile?.username
                  ? `@${order.buyer.profile.username}`
                  : order.buyer?.name ?? "Buyer"}
              </p>
            </div>
            <span className={statusStyle}>{order.status}</span>
          </Link>
        );
      })}
    </div>
  );
}

function SavedTab() {
  const { data, isLoading } = api.wishlist.getMyWishlist.useQuery({ limit: 20 });

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent" />
        <p className="mt-2 text-sm text-muted">Loading saved items...</p>
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="text-sm text-muted">No saved items yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {items.map((item) => {
        const images = safeParseImages(item.listing.images);
        const firstImage = images[0];
        return (
          <Link
            key={item.id}
            href={`/listings/${item.listing.id}`}
            className="trade-card group"
          >
            <div className="relative aspect-square bg-[var(--section-bg)]">
              {firstImage ? (
                <Image
                  src={firstImage}
                  alt={item.listing.title}
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
                {item.listing.title}
              </p>
              <p className="mt-1 text-xs text-[#D4AF37]">
                ${(item.listing.price / 100).toFixed(2)}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function ReviewsTab({ reviewData }: { reviewData: ReviewInfo | null }) {
  if (!reviewData || reviewData.totalReviews === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="text-sm text-muted">No reviews yet</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6">
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
          <div key={review.id} className="border-t border-[var(--divider)] pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--text-heading)]">
                  {review.author.profile?.username ?? review.author.name ?? "User"}
                </span>
                <StarRating rating={review.rating} />
              </div>
              <span className="text-xs text-muted">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
            {review.comment && (
              <p className="mt-1 text-sm text-muted">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailsTab({ profile }: { profile: ProfileData }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="glass-card rounded-2xl p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
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

      {(profile.instagramHandle ?? profile.twitterHandle ?? profile.websiteUrl) && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            Links
          </h2>
          <div className="space-y-2 text-sm">
            {profile.instagramHandle && (
              <a
                href={`https://instagram.com/${profile.instagramHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted transition hover:text-[#D4AF37]"
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
                className="flex items-center gap-2 text-muted transition hover:text-[#D4AF37]"
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
                className="flex items-center gap-2 text-muted transition hover:text-[#D4AF37]"
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
  );
}
