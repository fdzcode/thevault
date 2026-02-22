import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export default async function OrdersPage() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin");
  }

  const { orders } = await api.order.getMyOrders({ role: "buyer" });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">My Orders</h1>
      {orders.length === 0 ? (
        <p className="text-zinc-500">No orders yet.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <a
                href={`/orders/${order.id}`}
                className="block rounded border border-zinc-800 p-4 hover:border-zinc-600"
              >
                <h2 className="font-semibold">{order.listing.title}</h2>
                <p className="text-sm text-zinc-400">
                  ${(order.totalAmount / 100).toFixed(2)} &middot;{" "}
                  {order.status}
                </p>
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
