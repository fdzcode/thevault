import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "~/lib/stripe";
import { db } from "~/server/db";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      const listingId = session.metadata?.listingId;

      if (orderId && listingId) {
        await db.$transaction([
          db.order.update({
            where: { id: orderId },
            data: {
              status: "paid",
              paymentIntentId:
                typeof session.payment_intent === "string"
                  ? session.payment_intent
                  : session.payment_intent?.id,
            },
          }),
          db.listing.update({
            where: { id: listingId },
            data: { status: "sold" },
          }),
        ]);
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        await db.order.update({
          where: { id: orderId },
          data: { status: "cancelled" },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
