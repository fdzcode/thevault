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
  "cancelled",
]);
export type OrderStatus = z.infer<typeof orderStatusEnum>;

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
