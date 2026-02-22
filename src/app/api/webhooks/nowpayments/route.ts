import { type NextRequest, NextResponse } from "next/server";
import { verifyIpnSignature } from "~/lib/nowpayments";
import { db } from "~/server/db";

interface IpnPayload {
  payment_id: number;
  payment_status: string;
  order_id: string;
  pay_address: string;
  actually_paid: number;
  [key: string]: unknown;
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-nowpayments-sig");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let body: IpnPayload;
  try {
    body = (await req.json()) as IpnPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Verify HMAC-SHA512 signature
  if (!verifyIpnSignature(body as unknown as Record<string, unknown>, signature)) {
    console.error("NOWPayments webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { payment_status, order_id, payment_id } = body;

  if (!order_id) {
    return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
  }

  switch (payment_status) {
    case "finished":
    case "confirmed": {
      // Payment successful — mark order as paid and listing as sold
      const order = await db.order.findUnique({
        where: { id: order_id },
      });

      if (order && order.status === "pending") {
        await db.$transaction([
          db.order.update({
            where: { id: order_id },
            data: {
              status: "paid",
              cryptoPaymentId: String(payment_id),
              cryptoTransactionHash:
                (body as Record<string, unknown>).payin_hash as string | undefined ??
                null,
            },
          }),
          db.listing.update({
            where: { id: order.listingId },
            data: { status: "sold" },
          }),
        ]);
      }
      break;
    }

    case "expired":
    case "failed": {
      const order = await db.order.findUnique({
        where: { id: order_id },
      });

      if (order && order.status === "pending") {
        await db.order.update({
          where: { id: order_id },
          data: { status: "cancelled" },
        });
      }
      break;
    }

    default:
      // Statuses like "waiting", "confirming", "sending" — no action needed
      console.log(
        `NOWPayments webhook: order=${order_id} status=${payment_status} (no action)`,
      );
      break;
  }

  return NextResponse.json({ received: true });
}
