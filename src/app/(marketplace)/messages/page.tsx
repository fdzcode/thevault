import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

export default async function MessagesPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { conversations } = await api.message.getConversations({});

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Messages</h1>
      {conversations.length === 0 ? (
        <p className="text-zinc-500">No conversations yet.</p>
      ) : (
        <ul className="space-y-2">
          {conversations.map((conv) => {
            const otherUser = conv.participants[0]?.user;
            const lastMessage = conv.messages[0];
            return (
              <li key={conv.id}>
                <Link
                  href={`/messages/${conv.id}`}
                  className="block rounded border border-zinc-800 p-4 transition hover:border-zinc-600"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-zinc-200">
                        {otherUser?.profile?.displayName ?? otherUser?.name ?? "User"}
                      </span>
                      {otherUser?.memberNumber && (
                        <span className="ml-1 text-xs text-zinc-500">
                          #{otherUser.memberNumber}
                        </span>
                      )}
                    </div>
                    {lastMessage && (
                      <span className="text-xs text-zinc-600">
                        {new Date(lastMessage.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {conv.listing && (
                    <p className="mt-1 text-xs text-zinc-500">
                      Re: {conv.listing.title}
                    </p>
                  )}
                  {lastMessage && (
                    <p className="mt-1 truncate text-sm text-zinc-400">
                      {lastMessage.content}
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
