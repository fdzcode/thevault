import { TRPCError } from "@trpc/server";
import type { db as dbClient } from "~/server/db";
import type { ShippingAddress } from "~/lib/validators";
import { calculateFees } from "./fees";

/**
 * Validates that a listing can be purchased by the given buyer.
 * Shared between checkout (payment) and offer acceptance (messaging) flows.
 */
export async function validateListingForPurchase(
  db: typeof dbClient,
  listingId: string,
  buyerId: string,
) {
  const listing = await db.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
  }
  if (listing.status !== "active") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Listing is no longer available",
    });
  }
  if (listing.sellerId === buyerId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Cannot purchase your own listing",
    });
  }

  return listing;
}

/**
 * Creates a pending order with a shipping address.
 * Used by checkout flows (Stripe and crypto).
 */
export async function createOrderWithShipping(
  db: typeof dbClient,
  params: {
    listingId: string;
    buyerId: string;
    sellerId: string;
    totalAmount: number;
    shippingAddress: ShippingAddress;
    paymentMethod: "stripe" | "crypto";
  },
) {
  const shippingAddr = await db.shippingAddress.create({
    data: params.shippingAddress,
  });

  const fees = calculateFees(params.totalAmount);

  return db.order.create({
    data: {
      listingId: params.listingId,
      buyerId: params.buyerId,
      sellerId: params.sellerId,
      totalAmount: params.totalAmount,
      platformFeeBps: fees.platformFeeBps,
      platformFeeAmount: fees.platformFeeAmount,
      sellerPayoutAmount: fees.sellerPayoutAmount,
      shippingAddressId: shippingAddr.id,
      status: "pending",
      paymentMethod: params.paymentMethod,
    },
  });
}
