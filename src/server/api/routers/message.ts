import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { paginateResults } from "~/server/api/paginate";
import { validateListingForPurchase } from "~/server/services/orders";

export const messageRouter = createTRPCRouter({
  startConversation: protectedProcedure
    .input(
      z.object({
        recipientId: z.string(),
        listingId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.recipientId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot message yourself",
        });
      }

      // Check if conversation already exists between these two users (for same listing if provided)
      const existingParticipations =
        await ctx.db.conversationParticipant.findMany({
          where: { userId: ctx.session.user.id },
          select: { conversationId: true },
        });

      const conversationIds = existingParticipations.map(
        (p) => p.conversationId,
      );

      if (conversationIds.length > 0) {
        const existing = await ctx.db.conversation.findFirst({
          where: {
            id: { in: conversationIds },
            listingId: input.listingId ?? null,
            participants: {
              some: { userId: input.recipientId },
            },
          },
        });

        if (existing) {
          return { conversationId: existing.id };
        }
      }

      // Create new conversation
      const conversation = await ctx.db.conversation.create({
        data: {
          listingId: input.listingId,
          participants: {
            create: [
              { userId: ctx.session.user.id },
              { userId: input.recipientId },
            ],
          },
        },
      });

      return { conversationId: conversation.id };
    }),

  getConversations: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const participations =
        await ctx.db.conversationParticipant.findMany({
          where: { userId: ctx.session.user.id },
          select: { conversationId: true },
        });

      const conversationIds = participations.map((p) => p.conversationId);

      const results = await ctx.db.conversation.findMany({
        where: { id: { in: conversationIds } },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { updatedAt: "desc" },
        include: {
          listing: { select: { id: true, title: true } },
          participants: {
            where: { userId: { not: ctx.session.user.id } },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  memberNumber: true,
                  profile: { select: { username: true, displayName: true } },
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { content: true, createdAt: true, senderId: true },
          },
        },
      });

      const { items: conversations, nextCursor } = paginateResults(results, input.limit);
      return { conversations, nextCursor };
    }),

  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(50),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Verify user is a participant
      const participant =
        await ctx.db.conversationParticipant.findUnique({
          where: {
            conversationId_userId: {
              conversationId: input.conversationId,
              userId: ctx.session.user.id,
            },
          },
        });

      if (!participant) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const results = await ctx.db.message.findMany({
        where: { conversationId: input.conversationId },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              memberNumber: true,
            },
          },
        },
      });

      const { items: messages, nextCursor } = paginateResults(results, input.limit);
      return { messages, nextCursor };
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        content: z.string().min(1).max(5000),
        offerAmount: z.number().int().min(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify user is a participant
      const participant =
        await ctx.db.conversationParticipant.findUnique({
          where: {
            conversationId_userId: {
              conversationId: input.conversationId,
              userId: ctx.session.user.id,
            },
          },
        });

      if (!participant) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const message = await ctx.db.message.create({
        data: {
          conversationId: input.conversationId,
          senderId: ctx.session.user.id,
          content: input.content,
          offerAmount: input.offerAmount,
          offerStatus: input.offerAmount ? "pending" : undefined,
        },
      });

      // Touch conversation updatedAt
      await ctx.db.conversation.update({
        where: { id: input.conversationId },
        data: { updatedAt: new Date() },
      });

      return message;
    }),

  respondToOffer: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        action: z.enum(["accepted", "declined"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const message = await ctx.db.message.findUnique({
        where: { id: input.messageId },
        include: {
          conversation: {
            include: {
              participants: true,
              listing: true,
            },
          },
        },
      });

      if (!message) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (!message.offerAmount || message.offerStatus !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This message has no pending offer",
        });
      }

      if (message.senderId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot respond to your own offer",
        });
      }

      // Verify current user is a participant
      const isParticipant = message.conversation.participants.some(
        (p) => p.userId === ctx.session.user.id,
      );
      if (!isParticipant) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.message.update({
        where: { id: input.messageId },
        data: { offerStatus: input.action },
      });

      // If accepted and conversation has a listing, create a pending order
      if (
        input.action === "accepted" &&
        message.conversation.listingId
      ) {
        const listing = await validateListingForPurchase(
          ctx.db,
          message.conversation.listingId,
          message.senderId,
        );

        const order = await ctx.db.order.create({
          data: {
            listingId: listing.id,
            buyerId: message.senderId,
            sellerId: listing.sellerId,
            totalAmount: message.offerAmount,
            status: "pending",
          },
        });

        return { orderId: order.id };
      }

      return { orderId: null };
    }),
});
