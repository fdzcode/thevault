"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";
import { ImageUpload } from "~/components/image-upload";

const CATEGORIES = [
  { value: "apparel", label: "Apparel" },
  { value: "accessories", label: "Accessories" },
  { value: "art", label: "Art" },
  { value: "collectibles", label: "Collectibles" },
  { value: "footwear", label: "Footwear" },
  { value: "jewelry", label: "Jewelry" },
  { value: "prints", label: "Prints" },
  { value: "other", label: "Other" },
] as const;

const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
] as const;

export function CreateListingForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceStr, setPriceStr] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["value"]>("apparel");
  const [condition, setCondition] = useState<(typeof CONDITIONS)[number]["value"]>("new");
  const [tags, setTags] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const createListing = api.listing.create.useMutation({
    onSuccess: (result) => {
      router.push(`/listings/${result.id}`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const priceDollars = parseFloat(priceStr);
    if (isNaN(priceDollars) || priceDollars < 1) {
      setError("Price must be at least $1.00");
      return;
    }
    const priceCents = Math.round(priceDollars * 100);

    if (priceCents >= 690000 && images.length < 3) {
      setError("Items over $6,900 require at least 3 photos.");
      return;
    }

    createListing.mutate({
      title,
      description,
      price: priceCents,
      category,
      condition,
      tags,
      images,
    });
  };

  const inputClass =
    "mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none";
  const labelClass = "block text-sm font-medium text-zinc-300";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className={labelClass}>
          Title *
        </label>
        <input
          id="title"
          required
          minLength={1}
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          placeholder="What are you selling?"
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description *
        </label>
        <textarea
          id="description"
          required
          minLength={1}
          maxLength={5000}
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
          placeholder="Describe your item in detail..."
        />
      </div>

      <div>
        <label htmlFor="price" className={labelClass}>
          Price (USD) *
        </label>
        <input
          id="price"
          type="number"
          required
          min="1"
          step="0.01"
          value={priceStr}
          onChange={(e) => setPriceStr(e.target.value)}
          className={inputClass}
          placeholder="0.00"
        />
        {parseFloat(priceStr) >= 6900 && (
          <p className="mt-1 text-xs text-zinc-400">
            Items over $6,900 require at least 3 photos.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className={labelClass}>
            Category *
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
            className={inputClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="condition" className={labelClass}>
            Condition *
          </label>
          <select
            id="condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value as typeof condition)}
            className={inputClass}
          >
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="tags" className={labelClass}>
          Tags (comma-separated)
        </label>
        <input
          id="tags"
          maxLength={500}
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className={inputClass}
          placeholder="streetwear, custom, limited edition"
        />
      </div>

      <div>
        <label className={labelClass}>Images (up to 10)</label>
        <div className="mt-1">
          <ImageUpload
            value={images}
            onChange={setImages}
            maxImages={10}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={createListing.isPending}
        className="w-full rounded bg-white px-4 py-2 font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
      >
        {createListing.isPending ? "Creating..." : "Create Listing"}
      </button>
    </form>
  );
}
