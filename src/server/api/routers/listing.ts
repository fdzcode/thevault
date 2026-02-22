import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import {
  categoryEnum,
  conditionEnum,
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
        images: z.array(z.string().url()).max(10).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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
        images: z.array(z.string().url()).max(10).optional(),
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
              profile: { select: { username: true, displayName: true } },
            },
          },
        },
      });
      if (!listing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return listing;
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
      const listings = await ctx.db.listing.findMany({
        where: {
          sellerId: ctx.session.user.id,
          ...(input.status ? { status: input.status } : {}),
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (listings.length > input.limit) {
        const next = listings.pop();
        nextCursor = next?.id;
      }

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

      const listings = await ctx.db.listing.findMany({
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
              profile: { select: { username: true, displayName: true } },
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (listings.length > input.limit) {
        const next = listings.pop();
        nextCursor = next?.id;
      }

      return { listings, nextCursor };
    }),
});
