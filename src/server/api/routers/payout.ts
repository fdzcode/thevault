import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { paginateResults } from "~/server/api/paginate";

export const payoutRouter = createTRPCRouter({
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    let balance = await ctx.db.sellerBalance.findUnique({
      where: { userId },
    });

    balance ??= await ctx.db.sellerBalance.create({
      data: { userId },
    });

    return balance;
  }),

  requestPayout: protectedProcedure
    .input(
      z.object({
        amount: z.number().int().min(100), // minimum $1.00
        method: z.enum(["stripe", "crypto"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const balance = await ctx.db.sellerBalance.findUnique({
        where: { userId },
      });

      if (!balance) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Seller balance not found",
        });
      }

      if (input.amount > balance.availableAmount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient available balance",
        });
      }

      // Deduct from available and create payout request in a transaction
      const [, payoutRequest] = await ctx.db.$transaction([
        ctx.db.sellerBalance.update({
          where: { userId },
          data: {
            availableAmount: { decrement: input.amount },
          },
        }),
        ctx.db.payoutRequest.create({
          data: {
            userId,
            amount: input.amount,
            method: input.method,
          },
        }),
      ]);

      return payoutRequest;
    }),

  getMyPayoutRequests: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const requests = await ctx.db.payoutRequest.findMany({
        where: { userId },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      const { items, nextCursor } = paginateResults(requests, input.limit);
      return { requests: items, nextCursor };
    }),
});
