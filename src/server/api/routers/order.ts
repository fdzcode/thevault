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
          dispute: true,
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

  sellerAnalytics: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Total sales stats
    const totalOrders = await ctx.db.order.count({
      where: { sellerId: userId, status: { not: "cancelled" } },
    });

    const completedOrders = await ctx.db.order.count({
      where: { sellerId: userId, status: "delivered" },
    });

    const revenue = await ctx.db.order.aggregate({
      where: { sellerId: userId, status: { in: ["paid", "shipped", "delivered"] } },
      _sum: { totalAmount: true },
    });

    // Active listings count
    const activeListings = await ctx.db.listing.count({
      where: { sellerId: userId, status: "active" },
    });

    // Average rating
    const reviews = await ctx.db.review.aggregate({
      where: { sellerId: userId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    // Recent orders (last 10)
    const recentOrders = await ctx.db.order.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        listing: { select: { title: true, images: true } },
        buyer: { select: { name: true } },
      },
    });

    // Monthly revenue (last 6 months) - get all orders and group in JS since SQLite
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyOrders = await ctx.db.order.findMany({
      where: {
        sellerId: userId,
        status: { in: ["paid", "shipped", "delivered"] },
        createdAt: { gte: sixMonthsAgo },
      },
      select: { totalAmount: true, createdAt: true },
    });

    // Group by month
    const monthlyRevenue = new Map<string, number>();
    for (const order of monthlyOrders) {
      const key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, "0")}`;
      monthlyRevenue.set(key, (monthlyRevenue.get(key) ?? 0) + order.totalAmount);
    }

    // Top selling categories
    const categoryOrders = await ctx.db.order.findMany({
      where: { sellerId: userId, status: { in: ["paid", "shipped", "delivered"] } },
      include: { listing: { select: { category: true } } },
    });

    const categoryCounts = new Map<string, number>();
    for (const order of categoryOrders) {
      const cat = order.listing.category;
      categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + 1);
    }

    return {
      totalOrders,
      completedOrders,
      totalRevenue: revenue._sum.totalAmount ?? 0,
      activeListings,
      averageRating: reviews._avg.rating,
      totalReviews: reviews._count.rating,
      recentOrders,
      monthlyRevenue: Object.fromEntries(monthlyRevenue),
      topCategories: Object.fromEntries(
        [...categoryCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
      ),
    };
  }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["shipped", "delivered", "cancelled"]),
        trackingNumber: z.string().optional(),
        shippingCarrier: z.string().optional(),
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

      const updatedOrder = await ctx.db.order.update({
        where: { id: input.id },
        data: {
          status: input.status,
          ...(input.trackingNumber
            ? { trackingNumber: input.trackingNumber }
            : {}),
          ...(input.shippingCarrier
            ? { shippingCarrier: input.shippingCarrier }
            : {}),
        },
      });

      // When delivered, move funds from pending to available
      if (input.status === "delivered") {
        const payoutAmount = order.sellerPayoutAmount || order.totalAmount;
        await ctx.db.sellerBalance.update({
          where: { userId: order.sellerId },
          data: {
            pendingAmount: { decrement: payoutAmount },
            availableAmount: { increment: payoutAmount },
          },
        });
      }

      return updatedOrder;
    }),
});
