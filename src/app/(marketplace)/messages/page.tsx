import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { MessageThread } from "~/components/message-thread";

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

  // Load first conversation's messages for desktop split view
  const firstConv = conversations[0];
  let firstConvMessages: Array<{
    id: string;
    content: string;
    offerAmount: number | null;
    offerStatus: string | null;
    createdAt: Date;
    sender: { id: string; name: string | null; memberNumber: string | null };
  }> | null = null;
  if (firstConv) {
    try {
      const data = await api.message.getMessages({ conversationId: firstConv.id });
      firstConvMessages = data.messages;
    } catch {
      firstConvMessages = null;
    }
  }

  return (
    <div className="page-bg min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#D4AF37]/5 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 pt-8 pb-6 text-center">
          <p className="text-muted text-xs tracking-widest uppercase mb-3">MEMBER MESSAGES</p>
          <h1 className="font-display text-3xl font-light text-[var(--text-heading)]">
            The <span className="gradient-text italic">Exchange</span>
          </h1>

          {/* Unread count badge */}
          {unreadCount > 0 && (
            <div className="mx-auto mt-4 inline-flex items-center gap-2 glass-card rounded-xl px-5 py-2">
              <span className="msg-unread-dot" />
              <span className="text-sm font-medium text-amber-400">
                {unreadCount} unread {unreadCount === 1 ? "message" : "messages"}
              </span>
            </div>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pb-12">
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
          <div className="grid grid-cols-12 gap-0 glass-card rounded-2xl overflow-hidden" style={{ height: "calc(100vh - 14rem)" }}>
            {/* Left panel: conversation list */}
            <div className="col-span-12 md:col-span-4 border-r border-[var(--divider)] overflow-y-auto">
              <div className="px-4 py-3 border-b border-[var(--divider)]">
                <p className="text-xs font-semibold tracking-widest text-muted uppercase">Conversations</p>
              </div>
              {conversations.map((conv) => {
                const otherUser = conv.participants[0]?.user;
                const lastMessage = conv.messages[0];
                const displayName =
                  otherUser?.profile?.displayName ?? otherUser?.name ?? "User";
                const memberNumber = otherUser?.memberNumber;
                const isActive = firstConv && conv.id === firstConv.id;
                const isUnread = lastMessage && lastMessage.senderId !== session.user.id;

                return (
                  <Link
                    key={conv.id}
                    href={`/messages/${conv.id}`}
                    className={`thread-row flex items-center gap-3 px-4 py-3 border-b border-[var(--divider)] ${
                      isActive ? "active" : ""
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 border border-amber-600/20 font-display text-amber-500 text-sm">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-[var(--text-heading)] truncate">
                          {displayName}
                        </span>
                        {memberNumber && (
                          <span className="text-xs text-[#D4AF37]">#{memberNumber}</span>
                        )}
                      </div>
                      {lastMessage && (
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {lastMessage.content}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {lastMessage && (
                        <span className="text-[10px] text-muted">
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

            {/* Right panel: chat area (desktop only) */}
            <div className="hidden md:flex md:col-span-8 flex-col overflow-hidden">
              {firstConv && firstConvMessages ? (
                <MessageThread
                  conversationId={firstConv.id}
                  initialMessages={firstConvMessages}
                  currentUserId={session.user.id}
                  listingTitle={firstConv.listing?.title}
                />
              ) : (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-sm text-muted">Select a conversation</p>
                </div>
              )}
            </div>
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
