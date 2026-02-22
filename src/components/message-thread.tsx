"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
      toast.success(msg.offerAmount ? "Offer sent" : "Message sent");
    },
    onError: (err) => {
      toast.error(err.message);
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
      toast.success(variables.action === "accepted" ? "Offer accepted" : "Offer declined");
      if (result.orderId) {
        router.push(`/orders/${result.orderId}`);
      }
    },
    onError: (err) => {
      toast.error(err.message);
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
      {/* Listing context header */}
      {listingTitle && (
        <div className="border-b border-[var(--divider)] px-5 py-3 flex items-center gap-2">
          <svg className="h-4 w-4 text-[#D4AF37]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-2.061a4.5 4.5 0 0 0-1.242-7.244l4.5-4.5a4.5 4.5 0 0 1 6.364 6.364l-1.757 1.757" />
          </svg>
          <p className="text-xs text-muted">Re: <span className="text-[var(--text-heading)]">{listingTitle}</span></p>
        </div>
      )}

      {/* Messages area */}
      <div className="msg-scroll flex flex-1 flex-col-reverse gap-4 overflow-y-auto px-5 py-4">
        {messages.map((msg) => {
          const isMine = msg.sender.id === currentUserId;
          return (
            <div
              key={msg.id}
              className={`msg-in flex gap-3 ${isMine ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar for other party */}
              {!isMine && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 border border-amber-600/20 font-display text-amber-500 text-xs mt-1">
                  {msg.sender.name?.charAt(0).toUpperCase() ?? "?"}
                </div>
              )}

              <div className={`max-w-[75%]`}>
                <div
                  className={`px-4 py-2.5 ${
                    isMine ? "msg-bubble-mine" : "msg-bubble-theirs"
                  }`}
                >
                  {!isMine && (
                    <p className="mb-1 text-xs text-muted">
                      {msg.sender.name}
                      {msg.sender.memberNumber && (
                        <span className="ml-1 text-[#D4AF37]">
                          #{msg.sender.memberNumber}
                        </span>
                      )}
                    </p>
                  )}
                  <p className="text-sm text-[var(--text-heading)] leading-relaxed">{msg.content}</p>
                  {msg.offerAmount && (
                    <div className="mt-2 rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-3 py-2">
                      <p className="text-sm font-medium text-[#D4AF37]">
                        Offer: ${(msg.offerAmount / 100).toFixed(2)}
                      </p>
                      <span
                        className={`text-xs font-medium ${
                          msg.offerStatus === "accepted"
                            ? "text-emerald-400"
                            : msg.offerStatus === "declined"
                              ? "text-red-400"
                              : "text-amber-400"
                        }`}
                      >
                        {msg.offerStatus}
                      </span>
                      {msg.offerStatus === "pending" && !isMine && (
                        <div className="mt-2 flex gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              respondToOffer.mutate({
                                messageId: msg.id,
                                action: "accepted",
                              })
                            }
                            disabled={respondToOffer.isPending}
                            className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-50"
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
                            className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className={`mt-1 text-[10px] text-muted ${isMine ? "text-right" : "text-left"}`}>
                  {new Date(msg.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input area */}
      <div className="border-t border-[var(--divider)] px-5 py-4">
        <form onSubmit={handleSend}>
          {showOfferInput && (
            <div className="mb-3">
              <input
                type="number"
                min="1"
                step="0.01"
                value={offerStr}
                onChange={(e) => setOfferStr(e.target.value)}
                placeholder="Offer amount (USD)"
                className="input-bg w-full rounded-xl border px-4 py-2 text-sm focus:border-[#D4AF37] focus:outline-none transition"
              />
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type a message..."
              className="input-bg flex-1 rounded-xl border px-4 py-2.5 text-sm focus:border-[#D4AF37] focus:outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowOfferInput(!showOfferInput)}
              className={`shrink-0 rounded-xl border px-3 py-2.5 text-xs font-medium transition ${
                showOfferInput
                  ? "border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5"
                  : "border-[var(--divider)] text-muted hover:text-[#D4AF37] hover:border-[#D4AF37]/30"
              }`}
            >
              Offer
            </button>
            <button
              type="submit"
              disabled={sendMessage.isPending || !content.trim()}
              className="shrink-0 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8960C] px-5 py-2.5 text-sm font-semibold text-black hover:shadow-lg hover:shadow-[#D4AF37]/20 transition disabled:opacity-50"
            >
              {sendMessage.isPending ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
              ) : (
                "Send"
              )}
            </button>
          </div>
        </form>
        <p className="mt-3 text-center text-[10px] text-muted tracking-wider">
          Private. Only visible to both parties.
        </p>
      </div>
    </div>
  );
}
