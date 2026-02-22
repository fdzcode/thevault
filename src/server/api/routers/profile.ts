import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const profileRouter = createTRPCRouter({
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.profile.findUnique({
      where: { userId: ctx.session.user.id },
    });
  }),

  getByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const profile = await ctx.db.profile.findUnique({
        where: { username: input.username },
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      });
      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Profile not found" });
      }
      return profile;
    }),

  update: protectedProcedure
    .input(
      z.object({
        username: z
          .string()
          .min(3)
          .max(30)
          .regex(/^[a-zA-Z0-9_-]+$/),
        displayName: z.string().max(50).optional(),
        bio: z.string().max(500).optional(),
        avatarUrl: z.string().url().optional().or(z.literal("")),
        bannerUrl: z.string().url().optional().or(z.literal("")),
        location: z.string().max(100).optional(),
        instagramHandle: z.string().max(50).optional(),
        twitterHandle: z.string().max(50).optional(),
        websiteUrl: z.string().url().optional().or(z.literal("")),
        specialty: z.string().max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check username uniqueness (excluding own profile)
      const existing = await ctx.db.profile.findUnique({
        where: { username: input.username },
      });
      if (existing && existing.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already taken",
        });
      }

      return ctx.db.profile.upsert({
        where: { userId: ctx.session.user.id },
        create: {
          userId: ctx.session.user.id,
          ...input,
        },
        update: input,
      });
    }),

  search: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const profiles = await ctx.db.profile.findMany({
        where: input.query
          ? {
              OR: [
                { username: { contains: input.query } },
                { displayName: { contains: input.query } },
              ],
            }
          : undefined,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      });

      let nextCursor: string | undefined;
      if (profiles.length > input.limit) {
        const next = profiles.pop();
        nextCursor = next?.id;
      }

      return { profiles, nextCursor };
    }),

  checkUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      const existing = await ctx.db.profile.findUnique({
        where: { username: input.username },
      });
      return { available: !existing };
    }),
});
