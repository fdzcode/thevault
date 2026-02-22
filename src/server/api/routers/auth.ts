import { z } from "zod";
import bcrypt from "bcryptjs";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import {
  generateInviteCode,
  deriveMemberNumber,
  DEFAULT_INVITE_LIMIT,
} from "~/server/auth/invite-utils";

export const authRouter = createTRPCRouter({
  /** Check whether an invite code is valid (exists and unused). */
  validateInviteCode: publicProcedure
    .input(z.object({ code: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const invite = await ctx.db.inviteCode.findUnique({
        where: { code: input.code.toUpperCase() },
      });
      return { valid: !!invite && !invite.used };
    }),

  /** Register a new user with an invite code + email + password. */
  register: publicProcedure
    .input(
      z.object({
        inviteCode: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const code = input.inviteCode.toUpperCase();

      // Validate invite code
      const invite = await ctx.db.inviteCode.findUnique({
        where: { code },
      });

      if (!invite || invite.used) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or already-used invite code",
        });
      }

      // Check email uniqueness
      const existing = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 12);
      const memberNumber = deriveMemberNumber(code);

      // Check for member number collision and regenerate if needed
      let finalMemberNumber = memberNumber;
      const collision = await ctx.db.user.findUnique({
        where: { memberNumber },
      });
      if (collision) {
        // Append random digit to resolve collision
        const suffix = Math.floor(Math.random() * 10).toString();
        finalMemberNumber = (memberNumber + suffix).slice(-4);
      }

      // Create user + mark invite as used in a transaction
      const user = await ctx.db.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: input.email,
            name: input.name ?? input.email.split("@")[0],
            password: hashedPassword,
            memberNumber: finalMemberNumber,
            invitedById: invite.createdById,
          },
        });

        await tx.inviteCode.update({
          where: { id: invite.id },
          data: {
            used: true,
            usedById: newUser.id,
            usedAt: new Date(),
          },
        });

        return newUser;
      });

      return {
        userId: user.id,
        memberNumber: user.memberNumber,
        email: user.email,
      };
    }),

  /** Generate a new invite code for the current user (max 5). */
  generateInvite: protectedProcedure.mutation(async ({ ctx }) => {
    const count = await ctx.db.inviteCode.count({
      where: { createdById: ctx.session.user.id },
    });

    if (count >= DEFAULT_INVITE_LIMIT) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `You have reached the invite limit of ${DEFAULT_INVITE_LIMIT}`,
      });
    }

    // Generate a unique code (retry on the rare collision)
    let code: string;
    let attempts = 0;
    do {
      code = generateInviteCode();
      const exists = await ctx.db.inviteCode.findUnique({ where: { code } });
      if (!exists) break;
      attempts++;
    } while (attempts < 10);

    const invite = await ctx.db.inviteCode.create({
      data: {
        code,
        createdById: ctx.session.user.id,
      },
    });

    return { code: invite.code };
  }),

  /** List all invite codes created by the current user. */
  myInviteCodes: protectedProcedure.query(async ({ ctx }) => {
    const codes = await ctx.db.inviteCode.findMany({
      where: { createdById: ctx.session.user.id },
      include: {
        usedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return codes.map((c) => ({
      code: c.code,
      used: c.used,
      usedAt: c.usedAt,
      usedBy: c.usedBy
        ? { id: c.usedBy.id, name: c.usedBy.name }
        : null,
    }));
  }),

  /** Get a 2-level deep referral tree for the current user. */
  referralTree: protectedProcedure.query(async ({ ctx }) => {
    const invitees = await ctx.db.user.findMany({
      where: { invitedById: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        memberNumber: true,
        createdAt: true,
        invitees: {
          select: {
            id: true,
            name: true,
            memberNumber: true,
            createdAt: true,
          },
        },
      },
    });

    return invitees;
  }),

  /** Get member info for the current user. */
  myMemberInfo: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUniqueOrThrow({
      where: { id: ctx.session.user.id },
      select: {
        memberNumber: true,
        invitedBy: { select: { id: true, name: true, memberNumber: true } },
        _count: { select: { invitees: true, inviteCodesCreated: true } },
      },
    });

    return {
      memberNumber: user.memberNumber,
      invitedBy: user.invitedBy,
      inviteCount: user._count.inviteCodesCreated,
      referralCount: user._count.invitees,
    };
  }),
});
