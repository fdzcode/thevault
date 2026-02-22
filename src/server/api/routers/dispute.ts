import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

const disputeReasonEnum = z.enum([
  "item_not_received",
  "item_not_as_described",
  "counterfeit",
  "other",
]);

export const disputeRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        orderId: z.string(),
        reason: disputeReasonEnum,
        description: z.string().min(10).max(5000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const order = await ctx.db.order.findUnique({
        where: { id: input.orderId },
        include: { dispute: true },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      // Only buyer can file a dispute
      if (order.buyerId !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the buyer can file a dispute",
        });
      }

      // Order must be paid or shipped
      if (order.status !== "paid" && order.status !== "shipped") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only file disputes for paid or shipped orders",
        });
      }

      // Check if dispute already exists
      if (order.dispute) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A dispute already exists for this order",
        });
      }

      return ctx.db.dispute.create({
        data: {
          orderId: order.id,
          filerId: userId,
          againstId: order.sellerId,
          reason: input.reason,
          description: input.description,
        },
      });
    }),

  getMyDisputes: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const disputes = await ctx.db.dispute.findMany({
        where: {
          OR: [{ filerId: userId }, { againstId: userId }],
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          order: {
            include: {
              listing: {
                select: { id: true, title: true, images: true, price: true },
              },
            },
          },
          filer: {
            select: {
              id: true,
              name: true,
              profile: { select: { username: true } },
            },
          },
          against: {
            select: {
              id: true,
              name: true,
              profile: { select: { username: true } },
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (disputes.length > input.limit) {
        const next = disputes.pop();
        nextCursor = next?.id;
      }

      return { disputes, nextCursor };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const dispute = await ctx.db.dispute.findUnique({
        where: { id: input.id },
        include: {
          order: {
            include: {
              listing: true,
              buyer: {
                select: {
                  id: true,
                  name: true,
                  profile: { select: { username: true } },
                },
              },
              seller: {
                select: {
                  id: true,
                  name: true,
                  profile: { select: { username: true } },
                },
              },
            },
          },
          filer: {
            select: {
              id: true,
              name: true,
              profile: { select: { username: true } },
            },
          },
          against: {
            select: {
              id: true,
              name: true,
              profile: { select: { username: true } },
            },
          },
        },
      });

      if (!dispute) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Dispute not found" });
      }

      // Only filer, against, or admin can view
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (
        dispute.filerId !== userId &&
        dispute.againstId !== userId &&
        user?.role !== "admin"
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return dispute;
    }),
});
