import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { paginateResults } from "~/server/api/paginate";
import {
  categoryEnum,
  conditionEnum,
  imageUrlSchema,
  listingStatusEnum,
} from "~/lib/validators";

export const listingRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().min(1).max(5000),
        price: z.number().int().min(100), // minimum $1.00
        category: categoryEnum,
        condition: conditionEnum,
        tags: z.string().max(500).default(""),
        images: z.array(imageUrlSchema).max(10).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.price >= 690000 && input.images.length < 3) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Items over $6,900 require at least 3 photos",
        });
      }

      return ctx.db.listing.create({
        data: {
          sellerId: ctx.session.user.id,
          title: input.title,
          description: input.description,
          price: input.price,
          category: input.category,
          condition: input.condition,
          tags: input.tags,
          images: JSON.stringify(input.images),
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().min(1).max(5000).optional(),
        price: z.number().int().min(100).optional(),
        category: categoryEnum.optional(),
        condition: conditionEnum.optional(),
        tags: z.string().max(500).optional(),
        images: z.array(imageUrlSchema).max(10).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const listing = await ctx.db.listing.findUnique({
        where: { id: input.id },
      });
      if (!listing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (listing.sellerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (listing.status !== "active") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only edit active listings",
        });
      }

      const resolvedPrice = input.price ?? listing.price;
      const resolvedImages = input.images ?? JSON.parse(listing.images) as string[];
      if (resolvedPrice >= 690000 && resolvedImages.length < 3) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Items over $6,900 require at least 3 photos",
        });
      }

      const { id, images, ...rest } = input;
      return ctx.db.listing.update({
        where: { id },
        data: {
          ...rest,
          ...(images !== undefined ? { images: JSON.stringify(images) } : {}),
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const listing = await ctx.db.listing.findUnique({
        where: { id: input.id },
      });
      if (!listing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (listing.sellerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.listing.update({
        where: { id: input.id },
        data: { status: "cancelled" },
      });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const listing = await ctx.db.listing.findUnique({
        where: { id: input.id },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              image: true,
              memberNumber: true,
              profile: { select: { username: true, displayName: true } },
            },
          },
        },
      });
      if (!listing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const vouchCount = await ctx.db.legitCheck.count({
        where: { listingId: input.id },
      });

      const userId = ctx.session?.user?.id;
      let userVouched = false;
      if (userId) {
        const existing = await ctx.db.legitCheck.findUnique({
          where: {
            listingId_userId: {
              listingId: input.id,
              userId,
            },
          },
        });
        userVouched = !!existing;
      }

      return { ...listing, vouchCount, userVouched };
    }),

  getMyListings: protectedProcedure
    .input(
      z.object({
        status: listingStatusEnum.optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const results = await ctx.db.listing.findMany({
        where: {
          sellerId: ctx.session.user.id,
          ...(input.status ? { status: input.status } : {}),
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      const { items: listings, nextCursor } = paginateResults(results, input.limit);
      return { listings, nextCursor };
    }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        category: categoryEnum.optional(),
        condition: conditionEnum.optional(),
        minPrice: z.number().int().min(0).optional(),
        maxPrice: z.number().int().optional(),
        sort: z
          .enum(["newest", "oldest", "price_asc", "price_desc"])
          .default("newest"),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = { status: "active" };

      if (input.query) {
        where.OR = [
          { title: { contains: input.query } },
          { description: { contains: input.query } },
          { tags: { contains: input.query } },
        ];
      }
      if (input.category) where.category = input.category;
      if (input.condition) where.condition = input.condition;
      if (input.minPrice !== undefined || input.maxPrice !== undefined) {
        where.price = {
          ...(input.minPrice !== undefined ? { gte: input.minPrice } : {}),
          ...(input.maxPrice !== undefined ? { lte: input.maxPrice } : {}),
        };
      }

      const orderBy =
        input.sort === "price_asc"
          ? { price: "asc" as const }
          : input.sort === "price_desc"
            ? { price: "desc" as const }
            : input.sort === "oldest"
              ? { createdAt: "asc" as const }
              : { createdAt: "desc" as const };

      const results = await ctx.db.listing.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              image: true,
              memberNumber: true,
              profile: { select: { username: true, displayName: true } },
            },
          },
        },
      });

      const { items: listings, nextCursor } = paginateResults(results, input.limit);
      return { listings, nextCursor };
    }),

  vouch: protectedProcedure
    .input(z.object({ listingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const listing = await ctx.db.listing.findUnique({
        where: { id: input.listingId },
      });
      if (!listing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (listing.sellerId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot vouch for your own listing",
        });
      }

      const existing = await ctx.db.legitCheck.findUnique({
        where: {
          listingId_userId: {
            listingId: input.listingId,
            userId: ctx.session.user.id,
          },
        },
      });

      if (existing) {
        await ctx.db.legitCheck.delete({ where: { id: existing.id } });
        return { vouched: false };
      } else {
        await ctx.db.legitCheck.create({
          data: {
            listingId: input.listingId,
            userId: ctx.session.user.id,
          },
        });
        return { vouched: true };
      }
    }),

  recentlySold: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.listing.findMany({
      where: { status: "sold" },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        price: true,
        category: true,
        updatedAt: true,
      },
    });
  }),
});
