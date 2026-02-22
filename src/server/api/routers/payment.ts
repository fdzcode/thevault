import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { getStripe } from "~/lib/stripe";
import { createInvoice } from "~/lib/nowpayments";
import { shippingAddressSchema } from "~/lib/validators";
import { TRPCError } from "@trpc/server";
import { checkRateLimit } from "~/lib/rate-limit";
import {
  validateListingForPurchase,
  createOrderWithShipping,
} from "~/server/services/orders";

const checkoutInput = z.object({
  listingId: z.string(),
  shippingAddress: shippingAddressSchema,
});

export const paymentRouter = createTRPCRouter({
  createCheckoutSession: protectedProcedure
    .input(checkoutInput)
    .mutation(async ({ ctx, input }) => {
      const { allowed } = checkRateLimit(`payment:${ctx.session.user.id}`, 10, 60000);
      if (!allowed) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many attempts. Please try again later." });
      }

      const listing = await validateListingForPurchase(
        ctx.db,
        input.listingId,
        ctx.session.user.id,
      );

      const order = await createOrderWithShipping(ctx.db, {
        listingId: listing.id,
        buyerId: ctx.session.user.id,
        sellerId: listing.sellerId,
        totalAmount: listing.price,
        shippingAddress: input.shippingAddress,
        paymentMethod: "stripe",
      });


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

      await ctx.db.order.update({
        where: { id: order.id },
        data: { checkoutSessionId: session.id },
      });

      return { url: session.url, orderId: order.id };
    }),

  createCryptoCheckoutSession: protectedProcedure
    .input(checkoutInput)
    .mutation(async ({ ctx, input }) => {
      const { allowed } = checkRateLimit(`payment:${ctx.session.user.id}`, 10, 60000);
      if (!allowed) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many attempts. Please try again later." });
      }

      const listing = await validateListingForPurchase(
        ctx.db,
        input.listingId,
        ctx.session.user.id,
      );

      const order = await createOrderWithShipping(ctx.db, {
        listingId: listing.id,
        buyerId: ctx.session.user.id,
        sellerId: listing.sellerId,
        totalAmount: listing.price,
        shippingAddress: input.shippingAddress,
        paymentMethod: "crypto",
      });


      const baseUrl =
        process.env.NEXTAUTH_URL ?? "http://localhost:3000";

      const invoice = await createInvoice({
        priceAmount: listing.price / 100,
        orderId: order.id,
        orderDescription: listing.title,
        ipnCallbackUrl: `${baseUrl}/api/webhooks/nowpayments`,
        successUrl: `${baseUrl}/orders/${order.id}?success=true`,
        cancelUrl: `${baseUrl}/listings/${listing.id}?cancelled=true`,
      });

      await ctx.db.order.update({
        where: { id: order.id },
        data: { cryptoPaymentId: invoice.id },
      });

      return { url: invoice.invoice_url, orderId: order.id };
    }),
});
