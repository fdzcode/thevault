import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export default async function SalesPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const { orders } = await api.order.getMyOrders({ role: "seller" });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Sales</h1>
        <Link
          href="/orders"
          className="text-sm text-zinc-400 transition hover:text-white"
        >
          View Purchases
        </Link>
      </div>
      {orders.length === 0 ? (
        <p className="text-zinc-500">No sales yet.</p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/orders/${order.id}`}
                className="block rounded border border-zinc-800 p-4 hover:border-zinc-600"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{order.listing.title}</h2>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      order.status === "paid"
                        ? "bg-yellow-400/10 text-yellow-400"
                        : order.status === "shipped"
                          ? "bg-blue-400/10 text-blue-400"
                          : order.status === "delivered"
                            ? "bg-green-400/10 text-green-400"
                            : order.status === "cancelled"
                              ? "bg-red-400/10 text-red-400"
                              : "bg-zinc-400/10 text-zinc-400"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-400">
                  ${(order.totalAmount / 100).toFixed(2)} &middot; Buyer:{" "}
                  {order.buyer.profile?.username ?? order.buyer.name}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
