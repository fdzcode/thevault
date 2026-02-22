import { z } from "zod";

export const categoryEnum = z.enum([
  "apparel",
  "accessories",
  "art",
  "collectibles",
  "footwear",
  "jewelry",
  "prints",
  "other",
]);
export type Category = z.infer<typeof categoryEnum>;

export const conditionEnum = z.enum(["new", "like_new", "good", "fair"]);
export type Condition = z.infer<typeof conditionEnum>;

export const listingStatusEnum = z.enum(["active", "sold", "cancelled"]);
export type ListingStatus = z.infer<typeof listingStatusEnum>;

export const orderStatusEnum = z.enum([
  "pending",
  "paid",
  "shipped",
  "delivered",
  "disputed",
  "refunded",
  "cancelled",
]);
export type OrderStatus = z.infer<typeof orderStatusEnum>;

export const imageUrlSchema = z.string().url().refine((url) => {
  try {
    const parsed = new URL(url);
    // Allow relative URLs (uploaded files)
    if (url.startsWith('/uploads/')) return true;
    // Must be https in production
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    // Block obvious non-image paths
    const ext = parsed.pathname.split('.').pop()?.toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'];
    // Allow URLs without extensions (CDN URLs)
    if (ext && ext.length <= 5 && !allowedExts.includes(ext)) return false;
    return true;
  } catch {
    return url.startsWith('/uploads/');
  }
}, "Invalid image URL");

export const userRoleEnum = z.enum(["admin", "moderator", "member"]);
export type UserRole = z.infer<typeof userRoleEnum>;

export const disputeStatusEnum = z.enum([
  "open",
  "under_review",
  "resolved_buyer",
  "resolved_seller",
  "closed",
]);
export type DisputeStatus = z.infer<typeof disputeStatusEnum>;

export const notificationTypeEnum = z.enum([
  "order_paid",
  "order_shipped",
  "order_delivered",
  "dispute_opened",
  "dispute_resolved",
  "payout_sent",
  "connect_onboarding",
]);
export type NotificationType = z.infer<typeof notificationTypeEnum>;

export const stripeConnectStatusEnum = z.enum([
  "onboarding",
  "pending_verification",
  "active",
  "restricted",
  "disabled",
]);
export type StripeConnectStatus = z.infer<typeof stripeConnectStatusEnum>;

export const shippingAddressSchema = z.object({
  fullName: z.string().min(1).max(200),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  country: z.string().max(2).default("US"),
});
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;
