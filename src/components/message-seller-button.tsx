"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
      toast.success("Opening conversation...");
      router.push(`/messages/${result.conversationId}`);
    },
    onError: (err) => {
      toast.error(err.message);
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
      className="glass-card border text-muted hover:text-white tracking-wider rounded-xl px-6 py-2.5 font-medium transition disabled:opacity-50 flex items-center gap-2"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
      {startConversation.isPending ? "Opening..." : "Message Seller"}
    </button>
  );
}
