import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

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
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
            <svg
              className="h-8 w-8 text-zinc-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-zinc-300">
            No conversations yet
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Start a conversation by messaging a seller on their listing.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {conversations.map((conv) => {
            const otherUser = conv.participants[0]?.user;
            const lastMessage = conv.messages[0];
            const displayName =
              otherUser?.profile?.displayName ?? otherUser?.name ?? "User";
            const memberNumber = otherUser?.memberNumber;

            return (
              <li key={conv.id}>
                <Link
                  href={`/messages/${conv.id}`}
                  className="block rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition hover:border-zinc-600 hover:bg-zinc-900/80"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: Avatar placeholder + Name */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-400">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-zinc-200">
                            {displayName}
                          </span>
                          {memberNumber && (
                            <span className="text-xs text-zinc-600">
                              #{memberNumber}
                            </span>
                          )}
                        </div>
                        {conv.listing && (
                          <p className="text-xs text-zinc-500">
                            Re: {conv.listing.title}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Time */}
                    {lastMessage && (
                      <span className="shrink-0 text-xs text-zinc-600">
                        {formatRelativeTime(new Date(lastMessage.createdAt))}
                      </span>
                    )}
                  </div>

                  {/* Last Message Preview */}
                  {lastMessage && (
                    <p className="mt-2 truncate pl-13 text-sm text-zinc-400">
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
