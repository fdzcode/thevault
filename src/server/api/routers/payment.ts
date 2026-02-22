import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { getStripe } from "~/lib/stripe";
import { shippingAddressSchema } from "~/lib/validators";

export const paymentRouter = createTRPCRouter({
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        listingId: z.string(),
        shippingAddress: shippingAddressSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const listing = await ctx.db.listing.findUnique({
        where: { id: input.listingId },
        include: { seller: true },
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
      if (listing.sellerId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot purchase your own listing",
        });
      }

      // Create shipping address
      const shippingAddr = await ctx.db.shippingAddress.create({
        data: input.shippingAddress,
      });

      // Create pending order
      const order = await ctx.db.order.create({
        data: {
          listingId: listing.id,
          buyerId: ctx.session.user.id,
          sellerId: listing.sellerId,
          totalAmount: listing.price,
          shippingAddressId: shippingAddr.id,
          status: "pending",
        },
      });

      // Create Stripe Checkout Session
      const session = await getStripe().checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: listing.title,
                description: listing.description.slice(0, 500),
              },
              unit_amount: listing.price,
            },
            quantity: 1,
          },
        ],
        metadata: {
          orderId: order.id,
          listingId: listing.id,
        },
        success_url: `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "" : "http://localhost:3000"}/orders/${order.id}?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "" : "http://localhost:3000"}/listings/${listing.id}?cancelled=true`,
      });

      // Store checkout session ID on order
      await ctx.db.order.update({
        where: { id: order.id },
        data: { checkoutSessionId: session.id },
      });

      return { url: session.url, orderId: order.id };
    }),
});
