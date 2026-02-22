import { notFound, redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { MessageThread } from "~/components/message-thread";

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

  // Get conversation info for listing title
  const { conversations } = await api.message.getConversations({});
  const conversation = conversations.find((c) => c.id === id);

  return (
    <main className="mx-auto flex h-[calc(100vh-4rem)] max-w-2xl flex-col px-4 py-4">
      <MessageThread
        conversationId={id}
        initialMessages={data.messages}
        currentUserId={session.user.id}
        listingTitle={conversation?.listing?.title}
      />
    </main>
  );
}
