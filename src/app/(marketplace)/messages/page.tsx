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

  const unreadCount = conversations.filter((c) => {
    const last = c.messages[0];
    return last && last.senderId !== session.user.id;
  }).length;

  return (
    <div className="page-bg min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 pt-12 pb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center animate-float">
            <svg className="h-8 w-8 text-[#D4AF37]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
          </div>
          <p className="text-muted text-xs tracking-widest uppercase mb-4">MEMBER MESSAGES</p>
          <h1 className="font-display text-4xl font-light text-[var(--text-heading)]">
            The <span className="gradient-text italic">Exchange</span>
          </h1>

          {/* Unread count badge */}
          {unreadCount > 0 && (
            <div className="mx-auto mt-6 inline-flex items-center gap-2 glass-card rounded-xl px-5 py-2">
              <span className="msg-unread-dot" />
              <span className="text-sm font-medium text-amber-400">
                {unreadCount} unread {unreadCount === 1 ? "message" : "messages"}
              </span>
            </div>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-4 pb-12">
        {conversations.length === 0 ? (
          <div className="glass-card rounded-2xl p-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D4AF37]/10">
              <svg
                className="h-8 w-8 text-[#D4AF37]"
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
            <p className="font-display text-xl font-light text-[var(--text-heading)]">
              No conversations yet
            </p>
            <p className="mt-2 text-sm text-muted">
              Start a conversation by messaging a seller on their listing.
            </p>
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            {conversations.map((conv, idx) => {
              const otherUser = conv.participants[0]?.user;
              const lastMessage = conv.messages[0];
              const displayName =
                otherUser?.profile?.displayName ?? otherUser?.name ?? "User";
              const memberNumber = otherUser?.memberNumber;
              const isUnread = lastMessage && lastMessage.senderId !== session.user.id;

              return (
                <Link
                  key={conv.id}
                  href={`/messages/${conv.id}`}
                  className={`thread-row flex items-center gap-3 px-5 py-4 transition ${
                    idx > 0 ? "border-t border-[var(--divider)]" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 border border-amber-600/20 font-display text-amber-500 text-sm">
                    {displayName.charAt(0).toUpperCase()}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-[var(--text-heading)] truncate">
                        {displayName}
                      </span>
                      {memberNumber && (
                        <span className="text-xs text-[#D4AF37]">
                          #{memberNumber}
                        </span>
                      )}
                      {conv.listing && (
                        <span className="hidden sm:inline text-xs text-muted ml-1 truncate">
                          &middot; {conv.listing.title}
                        </span>
                      )}
                    </div>
                    {lastMessage && (
                      <p className="mt-0.5 truncate text-sm text-muted">
                        {lastMessage.content}
                      </p>
                    )}
                  </div>

                  {/* Right side: time + unread */}
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {lastMessage && (
                      <span className="text-xs text-muted">
                        {formatRelativeTime(new Date(lastMessage.createdAt))}
                      </span>
                    )}
                    {isUnread && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-black">
                        1
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: 'var(--divider)' }}>
        <div className="mx-auto max-w-7xl px-4 py-8 text-center">
          <p className="gradient-text font-display text-sm font-semibold tracking-widest">THE VAULT</p>
        </div>
      </footer>
    </div>
  );
}
