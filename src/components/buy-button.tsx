"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export function BuyButton({ listingId }: { listingId: string }) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("US");

  const createCheckout = api.payment.createCheckoutSession.useMutation({
    onSuccess: (result) => {
      if (result.url) {
        window.location.href = result.url;
      }
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createCheckout.mutate({
      listingId,
      shippingAddress: {
        fullName,
        line1,
        line2: line2 || undefined,
        city,
        state,
        postalCode,
        country,
      },
    });
  };

  const inputClass =
    "mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none";
  const labelClass = "block text-sm font-medium text-zinc-300";

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="rounded bg-white px-6 py-2 font-semibold text-black transition hover:bg-zinc-200"
      >
        Buy Now
      </button>
    );
  }

  return (
    <div className="mt-4 rounded border border-zinc-800 p-4">
      <h3 className="mb-4 text-lg font-semibold">Shipping Address</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="fullName" className={labelClass}>
            Full Name *
          </label>
          <input
            id="fullName"
            required
            maxLength={200}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="line1" className={labelClass}>
            Address Line 1 *
          </label>
          <input
            id="line1"
            required
            maxLength={200}
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="line2" className={labelClass}>
            Address Line 2
          </label>
          <input
            id="line2"
            maxLength={200}
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="city" className={labelClass}>
              City *
            </label>
            <input
              id="city"
              required
              maxLength={100}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="state" className={labelClass}>
              State *
            </label>
            <input
              id="state"
              required
              maxLength={100}
              value={state}
              onChange={(e) => setState(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="postalCode" className={labelClass}>
              Postal Code *
            </label>
            <input
              id="postalCode"
              required
              maxLength={20}
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="country" className={labelClass}>
              Country *
            </label>
            <input
              id="country"
              required
              maxLength={2}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={createCheckout.isPending}
            className="rounded bg-white px-6 py-2 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {createCheckout.isPending ? "Processing..." : "Proceed to Checkout"}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="rounded border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
