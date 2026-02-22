import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const reviewRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.orderId },
        include: { review: true },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }
      if (order.buyerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the buyer can leave a review",
        });
      }
      if (order.status !== "delivered") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only review delivered orders",
        });
      }
      if (order.review) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Review already exists for this order",
        });
      }

      return ctx.db.review.create({
        data: {
          orderId: order.id,
          authorId: ctx.session.user.id,
          sellerId: order.sellerId,
          rating: input.rating,
          comment: input.comment,
        },
      });
    }),

  getForSeller: publicProcedure
    .input(
      z.object({
        sellerId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const reviews = await ctx.db.review.findMany({
        where: { sellerId: input.sellerId },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              profile: { select: { username: true } },
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (reviews.length > input.limit) {
        const next = reviews.pop();
        nextCursor = next?.id;
      }

      // Calculate average rating
      const aggregate = await ctx.db.review.aggregate({
        where: { sellerId: input.sellerId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      return {
        reviews,
        nextCursor,
        averageRating: aggregate._avg.rating,
        totalReviews: aggregate._count.rating,
      };
    }),

  getForOrder: publicProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.review.findUnique({
        where: { orderId: input.orderId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              profile: { select: { username: true } },
            },
          },
        },
      });
    }),
});
