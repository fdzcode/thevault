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
    "mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none";
  const labelClass = "block text-sm font-medium text-zinc-300";

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
        <p className="mt-1 text-xs text-zinc-500">
          {description.length}/5000 characters
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={createDispute.isPending || !orderId}
          className="rounded bg-white px-6 py-2 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
        >
          {createDispute.isPending ? "Submitting..." : "Submit Dispute"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function NewDisputePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">File a Dispute</h1>
      <Suspense
        fallback={
          <div className="animate-pulse space-y-4">
            <div className="h-10 rounded bg-zinc-800" />
            <div className="h-10 rounded bg-zinc-800" />
            <div className="h-32 rounded bg-zinc-800" />
          </div>
        }
      >
        <NewDisputeForm />
      </Suspense>
    </main>
  );
}
