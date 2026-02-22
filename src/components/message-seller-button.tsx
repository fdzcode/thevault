"use client";

import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export function MessageSellerButton({
  sellerId,
  listingId,
}: {
  sellerId: string;
  listingId: string;
}) {
  const router = useRouter();

  const startConversation = api.message.startConversation.useMutation({
    onSuccess: (result) => {
      router.push(`/messages/${result.conversationId}`);
    },
  });

  return (
    <button
      type="button"
      onClick={() =>
        startConversation.mutate({
          recipientId: sellerId,
          listingId,
        })
      }
      disabled={startConversation.isPending}
      className="text-sm text-zinc-400 transition hover:text-zinc-200 disabled:opacity-50"
    >
      {startConversation.isPending ? "Opening..." : "Message Seller"}
    </button>
  );
}
