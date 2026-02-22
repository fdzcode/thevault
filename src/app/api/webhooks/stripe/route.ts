import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "~/lib/stripe";
import { db } from "~/server/db";
import { handlePaymentConfirmed } from "~/server/services/orders";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
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
        // Use updateMany with a status precondition so duplicate webhook
        // deliveries (documented by Stripe) are no-ops instead of
        // double-crediting the seller's balance.
        const [updated] = await db.$transaction([
          db.order.updateMany({
            where: { id: orderId, status: "pending" },
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

        if (updated.count > 0) {
          await handlePaymentConfirmed(db, orderId);
        }
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        await db.order.updateMany({
          where: { id: orderId, status: "pending" },
          data: { status: "cancelled" },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
