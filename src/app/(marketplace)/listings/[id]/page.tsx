import { notFound } from "next/navigation";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { BuyButton } from "~/components/buy-button";
import { VouchButton } from "~/components/vouch-button";
import { WishlistButton } from "~/components/wishlist-button";
import { MessageSellerButton } from "~/components/message-seller-button";

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

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">{listing.title}</h1>
      <p className="mb-1 text-lg text-zinc-300">
        ${(listing.price / 100).toFixed(2)}
      </p>
      <p className="mb-4 text-xs text-zinc-500">8% platform fee on purchase</p>
      <div className="mb-4 flex gap-2 text-sm text-zinc-400">
        <span>{listing.category}</span>
        <span>&middot;</span>
        <span>{listing.condition}</span>
        <span>&middot;</span>
        <span>{listing.status}</span>
      </div>
      <p className="mb-6 whitespace-pre-wrap text-zinc-300">
        {listing.description}
      </p>
      <p className="mb-6 text-sm text-zinc-500">
        Sold by {listing.seller.profile?.displayName ?? listing.seller.name}
        {listing.seller.memberNumber && (
          <span className="ml-1 text-xs text-zinc-600">#{listing.seller.memberNumber}</span>
        )}
      </p>
      <div className="mb-4 flex items-center gap-4">
        <VouchButton
          listingId={listing.id}
          initialCount={listing.vouchCount}
          initialVouched={listing.userVouched}
          isOwnListing={!!session && session.user.id === listing.sellerId}
          isLoggedIn={!!session}
        />
        <WishlistButton listingId={listing.id} isLoggedIn={!!session} />
      </div>
      {canBuy && (
        <div className="flex items-center gap-4">
          <BuyButton listingId={listing.id} />
          <MessageSellerButton
            sellerId={listing.sellerId}
            listingId={listing.id}
          />
        </div>
      )}
    </main>
  );
}
