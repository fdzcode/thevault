import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { authRouter } from "~/server/api/routers/auth";
import { profileRouter } from "~/server/api/routers/profile";
import { listingRouter } from "~/server/api/routers/listing";
import { orderRouter } from "~/server/api/routers/order";
import { paymentRouter } from "~/server/api/routers/payment";
import { reviewRouter } from "~/server/api/routers/review";
import { messageRouter } from "~/server/api/routers/message";
import { adminRouter } from "~/server/api/routers/admin";
import { wishlistRouter } from "~/server/api/routers/wishlist";
import { disputeRouter } from "~/server/api/routers/dispute";
import { payoutRouter } from "~/server/api/routers/payout";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  profile: profileRouter,
  listing: listingRouter,
  order: orderRouter,
  payment: paymentRouter,
  review: reviewRouter,
  message: messageRouter,
  admin: adminRouter,
  wishlist: wishlistRouter,
  dispute: disputeRouter,
  payout: payoutRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
