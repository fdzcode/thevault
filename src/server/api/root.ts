import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { authRouter } from "~/server/api/routers/auth";
import { profileRouter } from "~/server/api/routers/profile";
import { listingRouter } from "~/server/api/routers/listing";
import { orderRouter } from "~/server/api/routers/order";
import { paymentRouter } from "~/server/api/routers/payment";
import { reviewRouter } from "~/server/api/routers/review";
import { messageRouter } from "~/server/api/routers/message";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  profile: profileRouter,
  listing: listingRouter,
  order: orderRouter,
  payment: paymentRouter,
  review: reviewRouter,
  message: messageRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
