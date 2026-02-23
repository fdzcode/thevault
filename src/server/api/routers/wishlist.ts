import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { paginateResults } from "~/server/api/paginate";

export const wishlistRouter = createTRPCRouter({
  toggle: protectedProcedure
    .input(z.object({ listingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existing = await ctx.db.wishlist.findUnique({
        where: {
          userId_listingId: {
            userId,
            listingId: input.listingId,
          },
        },
      });

      if (existing) {
        await ctx.db.wishlist.delete({ where: { id: existing.id } });
        return { wishlisted: false };
      } else {
        await ctx.db.wishlist.create({
          data: {
            userId,
            listingId: input.listingId,
          },
        });
        return { wishlisted: true };
      }
    }),

  getMyWishlist: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const items = await ctx.db.wishlist.findMany({
        where: { userId },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          listing: {
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
          },
        },
      });

      const { items: wishlistItems, nextCursor } = paginateResults(items, input.limit);
      return { items: wishlistItems, nextCursor };
    }),

  isWishlisted: protectedProcedure
    .input(z.object({ listingId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const existing = await ctx.db.wishlist.findUnique({
        where: {
          userId_listingId: {
            userId,
            listingId: input.listingId,
          },
        },
      });

      return { wishlisted: !!existing };
    }),
});
