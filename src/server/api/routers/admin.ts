import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { paginateResults } from "~/server/api/paginate";

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const user = await ctx.db.user.findUnique({
    where: { id: ctx.session.user.id },
    select: { role: true },
  });
  if (user?.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next();
});

export const adminRouter = createTRPCRouter({
  /** Platform-wide statistics */
  stats: adminProcedure.query(async ({ ctx }) => {
    const [totalUsers, totalListings, totalOrders, revenueResult, activeDisputes] =
      await Promise.all([
        ctx.db.user.count(),
        ctx.db.listing.count(),
        ctx.db.order.count(),
        ctx.db.order.aggregate({
          _sum: { totalAmount: true },
          where: { status: { in: ["paid", "shipped", "delivered"] } },
        }),
        ctx.db.dispute.count({ where: { status: { in: ["open", "under_review"] } } }),
      ]);

    return {
      totalUsers,
      totalListings,
      totalOrders,
      totalRevenue: revenueResult._sum.totalAmount ?? 0,
      activeDisputes,
    };
  }),

  /** List all users with pagination and search */
  getUsers: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(25),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};

      if (input.search) {
        where.OR = [
          { name: { contains: input.search } },
          { email: { contains: input.search } },
        ];
      }

      const users = await ctx.db.user.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          memberNumber: true,
          role: true,
          createdAt: true,
          profile: {
            select: {
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      const { items, nextCursor } = paginateResults(users, input.limit);
      return { users: items, nextCursor };
    }),

  /** Update a user's role */
  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["user", "admin"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Prevent admin from removing their own admin role
      if (input.userId === ctx.session.user.id && input.role !== "admin") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot remove your own admin role",
        });
      }

      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: { id: true, name: true, email: true, role: true },
      });
    }),

  /** List all listings with pagination and filters */
  getListings: adminProcedure
    .input(
      z.object({
        status: z.string().optional(),
        search: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(25),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};

      if (input.status) {
        where.status = input.status;
      }

      if (input.search) {
        where.title = { contains: input.search };
      }

      const listings = await ctx.db.listing.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: { select: { username: true } },
            },
          },
        },
      });

      const { items, nextCursor } = paginateResults(listings, input.limit);
      return { listings: items, nextCursor };
    }),

  /** Force-remove a listing (set status to cancelled) */
  removeListing: adminProcedure
    .input(z.object({ listingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const listing = await ctx.db.listing.findUnique({
        where: { id: input.listingId },
      });

      if (!listing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      }

      return ctx.db.listing.update({
        where: { id: input.listingId },
        data: { status: "cancelled" },
      });
    }),

  /** List all orders with pagination and status filter */
  getOrders: adminProcedure
    .input(
      z.object({
        status: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(25),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};

      if (input.status) {
        where.status = input.status;
      }

      const orders = await ctx.db.order.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          listing: { select: { id: true, title: true } },
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: { select: { username: true } },
            },
          },
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: { select: { username: true } },
            },
          },
        },
      });

      const { items, nextCursor } = paginateResults(orders, input.limit);
      return { orders: items, nextCursor };
    }),

  /** List all disputes with pagination and status filter */
  getDisputes: adminProcedure
    .input(
      z.object({
        status: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(25),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};

      if (input.status) {
        where.status = input.status;
      }

      const disputes = await ctx.db.dispute.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          order: {
            select: {
              id: true,
              totalAmount: true,
              listing: { select: { id: true, title: true } },
            },
          },
          filer: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: { select: { username: true } },
            },
          },
          against: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: { select: { username: true } },
            },
          },
        },
      });

      const { items, nextCursor } = paginateResults(disputes, input.limit);
      return { disputes: items, nextCursor };
    }),

  /** Resolve a dispute */
  resolveDispute: adminProcedure
    .input(
      z.object({
        disputeId: z.string(),
        status: z.enum(["under_review", "resolved_buyer", "resolved_seller", "closed"]),
        adminNotes: z.string().optional(),
        resolution: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const dispute = await ctx.db.dispute.findUnique({
        where: { id: input.disputeId },
      });

      if (!dispute) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Dispute not found" });
      }

      return ctx.db.dispute.update({
        where: { id: input.disputeId },
        data: {
          status: input.status,
          adminNotes: input.adminNotes ?? dispute.adminNotes,
          resolution: input.resolution ?? dispute.resolution,
        },
      });
    }),

  /** List payout requests with status filter */
  getPayoutRequests: adminProcedure
    .input(
      z.object({
        status: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(25),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};

      if (input.status) {
        where.status = input.status;
      }

      const payoutRequests = await ctx.db.payoutRequest.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profile: { select: { username: true } },
            },
          },
        },
      });

      const { items, nextCursor } = paginateResults(payoutRequests, input.limit);
      return { payoutRequests: items, nextCursor };
    }),

  /** Process (update) a payout request */
  processPayoutRequest: adminProcedure
    .input(
      z.object({
        payoutRequestId: z.string(),
        status: z.enum(["processing", "completed", "rejected"]),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const payoutRequest = await ctx.db.payoutRequest.findUnique({
        where: { id: input.payoutRequestId },
      });

      if (!payoutRequest) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Payout request not found" });
      }

      const data: Record<string, unknown> = {
        status: input.status,
      };

      if (input.notes !== undefined) {
        data.notes = input.notes;
      }

      if (input.status === "completed" || input.status === "rejected") {
        data.processedAt = new Date();
      }

      return ctx.db.payoutRequest.update({
        where: { id: input.payoutRequestId },
        data,
      });
    }),
});
