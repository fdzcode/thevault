"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";
import { ImageUpload } from "~/components/image-upload";
import {
  HIGH_VALUE_THRESHOLD_CENTS,
  HIGH_VALUE_MIN_PHOTOS,
} from "~/lib/constants";

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
  { value: "new", label: "New", description: "Brand new, never worn or used, with tags" },
  { value: "like_new", label: "Like New", description: "Worn once or twice, no visible flaws" },
  { value: "good", label: "Good", description: "Gently used with minor signs of wear" },
  { value: "fair", label: "Fair", description: "Noticeable wear, still fully functional" },
] as const;

const LISTING_TYPES = [
  { value: "for_sale", label: "For Sale" },
  { value: "trade", label: "Trade" },
  { value: "both", label: "Both" },
] as const;

const STEPS = [
  { label: "Details" },
  { label: "Photos" },
  { label: "Pricing" },
  { label: "Review" },
];

export function CreateListingForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceStr, setPriceStr] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["value"]>("apparel");
  const [condition, setCondition] = useState<(typeof CONDITIONS)[number]["value"]>("new");
  const [listingType, setListingType] = useState<(typeof LISTING_TYPES)[number]["value"]>("for_sale");
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

    if (priceCents >= HIGH_VALUE_THRESHOLD_CENTS && images.length < HIGH_VALUE_MIN_PHOTOS) {
      setError(`Items over $${(HIGH_VALUE_THRESHOLD_CENTS / 100).toLocaleString()} require at least ${HIGH_VALUE_MIN_PHOTOS} photos.`);
      return;
    }

    createListing.mutate({
      title,
      description,
      price: priceCents,
      category,
      condition,
      listingType,
      tags,
      images,
    });
  };

  const canAdvance = () => {
    switch (currentStep) {
      case 0:
        return title.trim().length > 0 && description.trim().length > 0 && category;
      case 1:
        return true; // Photos are optional (unless high-value)
      case 2:
        return priceStr.trim().length > 0 && parseFloat(priceStr) >= 1;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1 && canAdvance()) {
      setCurrentStep(currentStep + 1);
      setError(null);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const progressPercent = ((currentStep + 1) / STEPS.length) * 100;

  const conditionObj = CONDITIONS.find((c) => c.value === condition);
  const categoryObj = CATEGORIES.find((c) => c.value === category);
  const listingTypeObj = LISTING_TYPES.find((t) => t.value === listingType);

  return (
    <form onSubmit={handleSubmit} className="space-y-0">
      {/* Progress bar */}
      <div className="post-progress mb-8 rounded-full overflow-hidden">
        <div
          className="post-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="mb-10 flex items-center justify-between">
        {STEPS.map((step, i) => (
          <div key={i} className="flex items-center">
            <button
              type="button"
              onClick={() => {
                if (i < currentStep) setCurrentStep(i);
              }}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                i < currentStep
                  ? "bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-black cursor-pointer"
                  : i === currentStep
                    ? "border-2 border-[#D4AF37] text-[#D4AF37] gold-pulse"
                    : "border border-[var(--divider)] text-[var(--text-muted)]"
              }`}
            >
              {i < currentStep ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                i + 1
              )}
            </button>
            <span className={`ml-2 hidden text-xs font-medium sm:inline ${
              i <= currentStep ? "text-[#D4AF37]" : "text-[var(--text-muted)]"
            }`}>
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`mx-3 h-px w-8 sm:w-12 transition-all ${
                i < currentStep ? "bg-[#D4AF37]" : "bg-[var(--divider)]"
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Details */}
      {currentStep === 0 && (
        <div className="post-step-in space-y-6">
          <h2 className="font-display text-4xl font-light italic gradient-text">
            Item Details
          </h2>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-[var(--text-body)] mb-1">
              Title *
            </label>
            <input
              id="title"
              required
              minLength={1}
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-bg w-full rounded-xl border border-[var(--input-border)] px-4 py-3 text-[var(--text-heading)] placeholder-[var(--input-placeholder)] transition focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30"
              placeholder="What are you selling?"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-[var(--text-body)] mb-1">
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
              className="input-bg w-full rounded-xl border border-[var(--input-border)] px-4 py-3 text-[var(--text-heading)] placeholder-[var(--input-placeholder)] transition focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30 resize-none"
              placeholder="Describe your item in detail..."
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-[var(--text-body)] mb-1">
              Category *
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
              className="input-bg w-full rounded-xl border border-[var(--input-border)] px-4 py-3 text-[var(--text-heading)] transition focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-body)] mb-2">
              Condition *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {CONDITIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCondition(c.value)}
                  className={`rounded-xl p-4 text-left transition-all ${
                    condition === c.value
                      ? "border-2 border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_0_20px_rgba(212,175,55,0.1)]"
                      : "border border-[var(--divider)] bg-[var(--card-bg)] hover:border-[#D4AF37]/30"
                  }`}
                >
                  <span className={`block text-sm font-semibold ${
                    condition === c.value ? "text-[#D4AF37]" : "text-[var(--text-heading)]"
                  }`}>
                    {c.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
                    {c.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-[var(--text-body)] mb-1">
              Tags (comma-separated)
            </label>
            <input
              id="tags"
              maxLength={500}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input-bg w-full rounded-xl border border-[var(--input-border)] px-4 py-3 text-[var(--text-heading)] placeholder-[var(--input-placeholder)] transition focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30"
              placeholder="streetwear, custom, limited edition"
            />
          </div>
        </div>
      )}

      {/* Step 2: Photos */}
      {currentStep === 1 && (
        <div className="post-step-in space-y-6">
          <h2 className="font-display text-4xl font-light italic gradient-text">
            Photos
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Upload up to 10 photos. The first image will be your cover photo.
          </p>

          <div>
            <ImageUpload
              value={images}
              onChange={setImages}
              maxImages={10}
            />
          </div>

          {parseFloat(priceStr) >= HIGH_VALUE_THRESHOLD_CENTS / 100 && (
            <p className="text-xs text-[#D4AF37]">
              Items over ${(HIGH_VALUE_THRESHOLD_CENTS / 100).toLocaleString()} require at least {HIGH_VALUE_MIN_PHOTOS} photos.
            </p>
          )}
        </div>
      )}

      {/* Step 3: Pricing */}
      {currentStep === 2 && (
        <div className="post-step-in space-y-6">
          <h2 className="font-display text-4xl font-light italic gradient-text">
            Pricing
          </h2>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-[var(--text-body)] mb-1">
              Price (USD) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-semibold">$</span>
              <input
                id="price"
                type="number"
                required
                min="1"
                step="0.01"
                value={priceStr}
                onChange={(e) => setPriceStr(e.target.value)}
                className="input-bg w-full rounded-xl border border-[var(--input-border)] pl-8 pr-4 py-3 text-[var(--text-heading)] placeholder-[var(--input-placeholder)] transition focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30"
                placeholder="0.00"
              />
            </div>
            {parseFloat(priceStr) >= HIGH_VALUE_THRESHOLD_CENTS / 100 && (
              <p className="mt-2 text-xs text-[#D4AF37]">
                Items over ${(HIGH_VALUE_THRESHOLD_CENTS / 100).toLocaleString()} require at least {HIGH_VALUE_MIN_PHOTOS} photos.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-body)] mb-2">
              Listing Type *
            </label>
            <div className="flex gap-3">
              {LISTING_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setListingType(t.value)}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                    listingType === t.value
                      ? "bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-black shadow-lg shadow-[#D4AF37]/20"
                      : "border border-[var(--divider)] text-[var(--text-muted)] hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {currentStep === 3 && (
        <div className="post-step-in space-y-6">
          <h2 className="font-display text-4xl font-light italic gradient-text">
            Review
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Make sure everything looks right before publishing.
          </p>

          {/* Preview trade card */}
          <div className="trade-card overflow-hidden">
            {/* Cover image */}
            {images.length > 0 ? (
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--card-bg)]">
                <img
                  src={images[0]}
                  alt={title}
                  className="h-full w-full object-cover"
                />
                {images.length > 1 && (
                  <span className="absolute bottom-2 right-2 rounded-lg bg-black/70 px-2 py-1 text-xs text-white">
                    +{images.length - 1} more
                  </span>
                )}
              </div>
            ) : (
              <div className="flex aspect-[16/9] w-full items-center justify-center bg-[var(--card-bg)]">
                <svg className="h-12 w-12 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {/* Card body */}
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-xl font-semibold text-[var(--text-heading)] leading-tight">
                  {title || "Untitled"}
                </h3>
                <span className="shrink-0 text-xl font-bold text-[#D4AF37]">
                  ${priceStr || "0.00"}
                </span>
              </div>

              <p className="text-sm text-[var(--text-muted)] line-clamp-2">
                {description || "No description"}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                <span className="badge bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                  {categoryObj?.label ?? category}
                </span>
                <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {conditionObj?.label ?? condition}
                </span>
                <span className="badge bg-zinc-500/10 text-[var(--text-muted)] border border-zinc-500/20">
                  {listingTypeObj?.label ?? listingType}
                </span>
              </div>

              {tags.trim() && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tags.split(",").map((tag, i) => tag.trim() && (
                    <span key={i} className="rounded-lg bg-[var(--glass-effect-bg)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center justify-between gap-4">
        {currentStep > 0 ? (
          <button
            type="button"
            onClick={prevStep}
            className="rounded-xl border border-[var(--divider)] bg-[var(--glass-card-bg)] px-6 py-3 font-medium text-[var(--text-body)] transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        {currentStep < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={nextStep}
            disabled={!canAdvance()}
            className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8960C] px-8 py-3 font-semibold text-black transition hover:shadow-lg hover:shadow-[#D4AF37]/20 disabled:opacity-50"
          >
            Continue
          </button>
        ) : (
          <button
            type="submit"
            disabled={createListing.isPending}
            className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B8960C] px-8 py-3 font-semibold text-black transition hover:shadow-lg hover:shadow-[#D4AF37]/20 disabled:opacity-50"
          >
            {createListing.isPending ? "Publishing..." : "PUBLISH TO THE VAULT"}
          </button>
        )}
      </div>
    </form>
  );
}
