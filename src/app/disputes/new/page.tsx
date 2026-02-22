"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import { toast } from "sonner";

const reasons = [
  { value: "item_not_received", label: "Item Not Received" },
  { value: "item_not_as_described", label: "Item Not As Described" },
  { value: "counterfeit", label: "Counterfeit" },
  { value: "other", label: "Other" },
] as const;

type DisputeReason = (typeof reasons)[number]["value"];

function NewDisputeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";

  const [reason, setReason] = useState<DisputeReason>("item_not_received");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createDispute = api.dispute.create.useMutation({
    onSuccess: () => {
      toast.success("Dispute filed successfully");
      router.push("/disputes");
    },
    onError: (err) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!orderId) {
      setError("Order ID is required");
      return;
    }

    if (description.length < 10) {
      setError("Description must be at least 10 characters");
      return;
    }

    createDispute.mutate({
      orderId,
      reason,
      description,
    });
  };

  const inputClass =
    "mt-1 w-full input-bg rounded-xl px-4 py-3 text-sm border border-[var(--input-border)] focus:outline-none focus:border-[#D4AF37] transition";
  const labelClass = "block text-sm font-medium text-[var(--text-body)]";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="orderId" className={labelClass}>
          Order ID
        </label>
        <input
          id="orderId"
          type="text"
          value={orderId}
          readOnly
          className={`${inputClass} cursor-not-allowed opacity-60`}
        />
      </div>

      <div>
        <label htmlFor="reason" className={labelClass}>
          Reason
        </label>
        <select
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value as DisputeReason)}
          className={inputClass}
        >
          {reasons.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue in detail (minimum 10 characters)..."
          rows={5}
          maxLength={5000}
          required
          className={inputClass}
        />
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          {description.length}/5000 characters
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={createDispute.isPending || !orderId}
          className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8960C] px-6 py-2.5 font-semibold text-black transition hover:shadow-lg hover:shadow-[#D4AF37]/20 disabled:opacity-50"
        >
          {createDispute.isPending ? "Submitting..." : "Submit Dispute"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="glass-card rounded-xl px-6 py-2.5 font-medium text-[var(--text-body)] transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function NewDisputePage() {
  return (
    <main className="page-bg min-h-screen">
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-800 to-transparent px-4 pb-16 pt-20 text-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/5 h-1 w-1 rounded-full bg-[#D4AF37]/30 animate-gold-pulse" />
        </div>
        <div className="relative z-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/10 animate-float">
            <svg className="h-8 w-8 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <p className="text-muted text-xs tracking-widest uppercase mb-3">Resolution Center</p>
          <h1 className="font-display text-5xl font-light">
            File a <span className="gradient-text">Dispute</span>
          </h1>
          <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 pb-16">
        <div className="glass-card rounded-2xl p-6">
          <Suspense
            fallback={
              <div className="space-y-4">
                <div className="h-12 animate-shimmer rounded-xl bg-[var(--divider)]" />
                <div className="h-12 animate-shimmer rounded-xl bg-[var(--divider)]" />
                <div className="h-32 animate-shimmer rounded-xl bg-[var(--divider)]" />
              </div>
            }
          >
            <NewDisputeForm />
          </Suspense>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t divider-line py-8 text-center">
        <p className="font-display text-sm tracking-widest gradient-text">THE VAULT</p>
      </footer>
    </main>
  );
}
