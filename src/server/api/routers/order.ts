import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { paginateResults } from "~/server/api/paginate";

export const orderRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.id },
        include: {
          listing: true,
          buyer: {
            select: {
              id: true,
              name: true,
              image: true,
              profile: { select: { username: true } },
            },
          },
          seller: {
            select: {
              id: true,
              name: true,
              image: true,
              profile: { select: { username: true } },
            },
          },
          shippingAddress: true,
          review: true,
        },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Only buyer or seller can view
      const userId = ctx.session.user.id;
      if (order.buyerId !== userId && order.sellerId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return order;
    }),

  getMyOrders: protectedProcedure
    .input(
      z.object({
        role: z.enum(["buyer", "seller"]).default("buyer"),
        status: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const where: Record<string, unknown> =
        input.role === "buyer"
          ? { buyerId: userId }
          : { sellerId: userId };

      if (input.status) where.status = input.status;

      const results = await ctx.db.order.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          listing: { select: { id: true, title: true, images: true } },
          buyer: {
            select: { id: true, name: true, profile: { select: { username: true } } },
          },
          seller: {
            select: { id: true, name: true, profile: { select: { username: true } } },
          },
        },
      });

      const { items: orders, nextCursor } = paginateResults(results, input.limit);
      return { orders, nextCursor };
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["shipped", "delivered", "cancelled"]),
        trackingNumber: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.id },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const userId = ctx.session.user.id;
      const isBuyer = order.buyerId === userId;
      const isSeller = order.sellerId === userId;

      if (!isBuyer && !isSeller) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Business rules
      if (input.status === "shipped") {
        if (!isSeller) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the seller can mark as shipped",
          });
        }
        if (order.status !== "paid") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Can only ship paid orders",
          });
        }
      }

      if (input.status === "delivered") {
        if (!isBuyer) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only the buyer can confirm delivery",
          });
        }
        if (order.status !== "shipped") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Can only confirm delivery of shipped orders",
          });
        }
      }

      if (input.status === "cancelled") {
        if (order.status !== "pending") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Can only cancel pending orders",
          });
        }
      }

      return ctx.db.order.update({
        where: { id: input.id },
        data: {
          status: input.status,
          ...(input.trackingNumber
            ? { trackingNumber: input.trackingNumber }
            : {}),
        },
      });
    }),
});
