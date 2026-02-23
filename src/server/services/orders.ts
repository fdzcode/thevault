import { TRPCError } from "@trpc/server";
import type { db as dbClient } from "~/server/db";
import type { ShippingAddress } from "~/lib/validators";
import { calculateFees } from "./fees";
import { createNotification } from "./notifications";
import {
  sendPaymentReceivedEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  type OrderDetails,
} from "~/lib/email";

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

// ─── Order Lifecycle Helpers ──────────────────────────────────────

/**
 * Fetches the order details needed for email/notification context.
 */
async function getOrderContext(db: typeof dbClient, orderId: string) {
  return db.order.findUnique({
    where: { id: orderId },
    include: {
      listing: { select: { title: true } },
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
    },
  });
}

function buildOrderDetails(
  order: NonNullable<Awaited<ReturnType<typeof getOrderContext>>>,
  extra?: { trackingNumber?: string | null; shippingCarrier?: string | null },
): OrderDetails {
  return {
    orderId: order.id,
    listingTitle: order.listing.title,
    totalAmount: order.totalAmount,
    buyerName: order.buyer.name ?? "Buyer",
    sellerName: order.seller.name ?? "Seller",
    trackingNumber: extra?.trackingNumber,
    shippingCarrier: extra?.shippingCarrier,
  };
}

/**
 * Credits the seller's pending balance after a successful payment.
 * Used by both Stripe and NOWPayments webhooks.
 */
export async function creditSellerBalance(
  db: typeof dbClient,
  params: { sellerId: string; payoutAmount: number },
) {
  await db.sellerBalance.upsert({
    where: { userId: params.sellerId },
    create: {
      userId: params.sellerId,
      pendingAmount: params.payoutAmount,
      availableAmount: 0,
      totalEarned: params.payoutAmount,
    },
    update: {
      pendingAmount: { increment: params.payoutAmount },
      totalEarned: { increment: params.payoutAmount },
    },
  });
}

/**
 * Releases funds from pending → available when delivery is confirmed.
 */
export async function releaseSellerFunds(
  db: typeof dbClient,
  params: { sellerId: string; payoutAmount: number },
) {
  await db.sellerBalance.update({
    where: { userId: params.sellerId },
    data: {
      pendingAmount: { decrement: params.payoutAmount },
      availableAmount: { increment: params.payoutAmount },
    },
  });
}

/**
 * Handles post-payment processing: credits seller balance,
 * sends emails, and creates notifications.
 */
export async function handlePaymentConfirmed(
  db: typeof dbClient,
  orderId: string,
) {
  const order = await getOrderContext(db, orderId);
  if (!order) return;

  const payoutAmount = order.sellerPayoutAmount || order.totalAmount;
  await creditSellerBalance(db, { sellerId: order.seller.id, payoutAmount });

  const details = buildOrderDetails(order);

  // Notify seller: payment received
  if (order.seller.email) {
    void sendPaymentReceivedEmail(order.seller.email, details);
  }
  void createNotification(db, {
    userId: order.seller.id,
    type: "payment_received",
    title: "Payment Received",
    body: `Payment confirmed for "${order.listing.title}". Please ship the item.`,
    link: `/orders/${orderId}`,
  });

  // Notify buyer: order confirmed
  void createNotification(db, {
    userId: order.buyer.id,
    type: "order_confirmed",
    title: "Order Confirmed",
    body: `Your order for "${order.listing.title}" has been paid. The seller will ship it soon.`,
    link: `/orders/${orderId}`,
  });
}

/**
 * Handles order shipped: sends email and notification to buyer.
 */
export async function handleOrderShipped(
  db: typeof dbClient,
  orderId: string,
  tracking?: { trackingNumber?: string | null; shippingCarrier?: string | null },
) {
  const order = await getOrderContext(db, orderId);
  if (!order) return;

  const details = buildOrderDetails(order, tracking);

  if (order.buyer.email) {
    void sendOrderShippedEmail(order.buyer.email, details);
  }
  void createNotification(db, {
    userId: order.buyer.id,
    type: "order_shipped",
    title: "Order Shipped",
    body: `Your order for "${order.listing.title}" has been shipped!`,
    link: `/orders/${orderId}`,
  });
}

/**
 * Handles delivery confirmed: releases funds, sends email, notifications.
 */
export async function handleDeliveryConfirmed(
  db: typeof dbClient,
  orderId: string,
) {
  const order = await getOrderContext(db, orderId);
  if (!order) return;

  const payoutAmount = order.sellerPayoutAmount || order.totalAmount;
  await releaseSellerFunds(db, { sellerId: order.seller.id, payoutAmount });

  const details = buildOrderDetails(order);

  // Notify seller: delivery confirmed, funds released
  if (order.seller.email) {
    void sendOrderDeliveredEmail(order.seller.email, details);
  }
  void createNotification(db, {
    userId: order.seller.id,
    type: "delivery_confirmed",
    title: "Delivery Confirmed",
    body: `The buyer confirmed delivery of "${order.listing.title}". Funds are now available for payout.`,
    link: `/orders/${orderId}`,
  });
}
