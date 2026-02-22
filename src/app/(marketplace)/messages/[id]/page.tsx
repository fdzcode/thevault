import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  let data;
  try {
    data = await api.message.getMessages({ conversationId: id });
  } catch {
    notFound();
  }

  const { conversations } = await api.message.getConversations({});
  const conversation = conversations.find((c) => c.id === id);

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
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pb-12">
        <div className="grid grid-cols-12 gap-0 glass-card rounded-2xl overflow-hidden" style={{ height: "calc(100vh - 14rem)" }}>
          {/* Left panel: conversation list */}
          <div className="col-span-4 border-r border-[var(--divider)] overflow-y-auto hidden md:block">
            <div className="px-4 py-3 border-b border-[var(--divider)]">
              <p className="text-xs font-semibold tracking-widest text-muted uppercase">Conversations</p>
            </div>
            {conversations.map((conv) => {
              const otherUser = conv.participants[0]?.user;
              const lastMessage = conv.messages[0];
              const displayName =
                otherUser?.profile?.displayName ?? otherUser?.name ?? "User";
              const memberNumber = otherUser?.memberNumber;
              const isActive = conv.id === id;
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

          {/* Right panel: messages */}
          <div className="col-span-12 md:col-span-8 flex flex-col overflow-hidden">
            <MessageThread
              conversationId={id}
              initialMessages={data.messages}
              currentUserId={session.user.id}
              listingTitle={conversation?.listing?.title}
            />
          </div>
        </div>
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
