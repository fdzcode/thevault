"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

type MessageData = {
  id: string;
  content: string;
  offerAmount: number | null;
  offerStatus: string | null;
  createdAt: Date;
  sender: {
    id: string;
    name: string | null;
    memberNumber: string | null;
  };
};

export function MessageThread({
  conversationId,
  initialMessages,
  currentUserId,
  listingTitle,
}: {
  conversationId: string;
  initialMessages: MessageData[];
  currentUserId: string;
  listingTitle?: string | null;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageData[]>(initialMessages);
  const [content, setContent] = useState("");
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [offerStr, setOfferStr] = useState("");

  const sendMessage = api.message.sendMessage.useMutation({
    onSuccess: (msg) => {
      setMessages((prev) => [
        {
          id: msg.id,
          content: msg.content,
          offerAmount: msg.offerAmount,
          offerStatus: msg.offerStatus,
          createdAt: msg.createdAt,
          sender: { id: currentUserId, name: "You", memberNumber: null },
        },
        ...prev,
      ]);
      setContent("");
      setOfferStr("");
      setShowOfferInput(false);
    },
  });

  const respondToOffer = api.message.respondToOffer.useMutation({
    onSuccess: (result, variables) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === variables.messageId
            ? { ...m, offerStatus: variables.action }
            : m,
        ),
      );
      if (result.orderId) {
        router.push(`/orders/${result.orderId}`);
      }
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const offerAmount = showOfferInput
      ? Math.round(parseFloat(offerStr) * 100)
      : undefined;

    if (showOfferInput && (!offerAmount || isNaN(offerAmount) || offerAmount < 100)) {
      return;
    }

    sendMessage.mutate({
      conversationId,
      content: content.trim(),
      offerAmount: offerAmount && !isNaN(offerAmount) ? offerAmount : undefined,
    });
  };

  return (
    <div className="flex h-full flex-col">
      {listingTitle && (
        <div className="border-b border-zinc-800 px-4 py-2">
          <p className="text-xs text-zinc-500">Re: {listingTitle}</p>
        </div>
      )}

      <div className="flex flex-1 flex-col-reverse gap-3 overflow-y-auto p-4">
        {messages.map((msg) => {
          const isMine = msg.sender.id === currentUserId;
          return (
            <div
              key={msg.id}
              className={`max-w-[80%] ${isMine ? "ml-auto" : "mr-auto"}`}
            >
              <div
                className={`rounded-lg px-3 py-2 ${
                  isMine
                    ? "bg-zinc-700 text-zinc-100"
                    : "bg-zinc-800 text-zinc-200"
                }`}
              >
                {!isMine && (
                  <p className="mb-1 text-xs text-zinc-400">
                    {msg.sender.name}
                    {msg.sender.memberNumber && (
                      <span className="ml-1 text-zinc-500">
                        #{msg.sender.memberNumber}
                      </span>
                    )}
                  </p>
                )}
                <p className="text-sm">{msg.content}</p>
                {msg.offerAmount && (
                  <div className="mt-2 rounded border border-zinc-600 px-2 py-1">
                    <p className="text-sm font-medium">
                      Offer: ${(msg.offerAmount / 100).toFixed(2)}
                    </p>
                    <span
                      className={`text-xs ${
                        msg.offerStatus === "accepted"
                          ? "text-green-400"
                          : msg.offerStatus === "declined"
                            ? "text-red-400"
                            : "text-yellow-400"
                      }`}
                    >
                      {msg.offerStatus}
                    </span>
                    {msg.offerStatus === "pending" && !isMine && (
                      <div className="mt-1 flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            respondToOffer.mutate({
                              messageId: msg.id,
                              action: "accepted",
                            })
                          }
                          disabled={respondToOffer.isPending}
                          className="text-xs text-green-400 hover:text-green-300 disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            respondToOffer.mutate({
                              messageId: msg.id,
                              action: "declined",
                            })
                          }
                          disabled={respondToOffer.isPending}
                          className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-zinc-600">
                {new Date(msg.createdAt).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={handleSend}
        className="border-t border-zinc-800 p-4"
      >
        {showOfferInput && (
          <div className="mb-2">
            <input
              type="number"
              min="1"
              step="0.01"
              value={offerStr}
              onChange={(e) => setOfferStr(e.target.value)}
              placeholder="Offer amount (USD)"
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
            />
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowOfferInput(!showOfferInput)}
            className={`shrink-0 rounded border px-3 py-2 text-xs transition ${
              showOfferInput
                ? "border-zinc-500 text-white"
                : "border-zinc-700 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Offer
          </button>
          <button
            type="submit"
            disabled={sendMessage.isPending || !content.trim()}
            className="shrink-0 rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
