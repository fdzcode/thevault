import { notFound, redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { OrderActions } from "~/components/order-actions";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  let order;
  try {
    order = await api.order.getById({ id });
  } catch {
    notFound();
  }

  const role = session.user.id === order.buyerId ? "buyer" : "seller";

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">Order {order.id}</h1>
      <p className="mb-4 text-sm text-zinc-400">Status: {order.status}</p>
      <div className="rounded border border-zinc-800 p-4">
        <h2 className="font-semibold">{order.listing.title}</h2>
        <p className="text-sm text-zinc-400">
          ${(order.totalAmount / 100).toFixed(2)}
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Buyer: {order.buyer.profile?.username ?? order.buyer.name}
        </p>
        <p className="text-sm text-zinc-500">
          Seller: {order.seller.profile?.username ?? order.seller.name}
        </p>
        {order.trackingNumber && (
          <p className="mt-2 text-sm text-zinc-500">
            Tracking: {order.trackingNumber}
          </p>
        )}
      </div>
      <OrderActions
        orderId={order.id}
        role={role}
        status={order.status}
        hasReview={!!order.review}
      />
    </main>
  );
}
