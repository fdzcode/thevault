"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "~/trpc/react";
import { ImageUpload } from "~/components/image-upload";
import {
  HIGH_VALUE_THRESHOLD_CENTS,
  HIGH_VALUE_MIN_PHOTOS,
  CATEGORIES,
  CONDITIONS,
  LISTING_TYPES,
} from "~/lib/constants";

const STEPS = [
  { label: "Photos" },
  { label: "Type" },
  { label: "Details" },
  { label: "Provenance" },
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
  const [provenanceType, setProvenanceType] = useState<"receipt" | "proof_of_purchase" | "none">("none");
  const [authentication, setAuthentication] = useState<string[]>([]);

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

    // Append provenance info to tags if set
    const provenanceTags: string[] = [];
    if (provenanceType !== "none") provenanceTags.push(`provenance:${provenanceType}`);
    authentication.forEach((a) => provenanceTags.push(`auth:${a}`));
    const allTags = [tags, ...provenanceTags].filter(Boolean).join(",");

    createListing.mutate({
      title,
      description,
      price: priceCents,
      category,
      condition,
      listingType,
      tags: allTags,
      images,
    });
  };

  const canAdvance = () => {
    switch (currentStep) {
      case 0: // Photos
        return true; // Photos are optional (unless high-value)
      case 1: // Type
        return !!listingType;
      case 2: // Details
        return title.trim().length > 0 && description.trim().length > 0 && category;
      case 3: // Provenance
        return true; // Provenance is optional
      case 4: // Pricing
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

      {/* Step 1: Photos */}
      {currentStep === 0 && (
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

      {/* Step 2: Type */}
      {currentStep === 1 && (
        <div className="post-step-in space-y-6">
          <h2 className="font-display text-4xl font-light italic gradient-text">
            Listing Type
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            How would you like to list this item?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {LISTING_TYPES.map((t) => {
              const icons: Record<string, React.ReactNode> = {
                for_sale: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                ),
                trade: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                  </svg>
                ),
                both: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                ),
              };
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setListingType(t.value)}
                  className={`flex flex-col items-center gap-3 rounded-2xl p-6 text-center transition-all ${
                    listingType === t.value
                      ? "border-2 border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_0_30px_rgba(212,175,55,0.15)]"
                      : "border border-[var(--divider)] bg-[var(--card-bg)] hover:border-[#D4AF37]/30"
                  }`}
                >
                  <div className={listingType === t.value ? "text-[#D4AF37]" : "text-[var(--text-muted)]"}>
                    {icons[t.value]}
                  </div>
                  <span className={`text-sm font-semibold ${
                    listingType === t.value ? "text-[#D4AF37]" : "text-[var(--text-heading)]"
                  }`}>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Details */}
      {currentStep === 2 && (
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

      {/* Step 4: Provenance */}
      {currentStep === 3 && (
        <div className="post-step-in space-y-6">
          <h2 className="font-display text-4xl font-light italic gradient-text">
            Provenance
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Help buyers trust this item by providing proof of origin. This is optional but increases trust.
          </p>

          <div>
            <label className="block text-sm font-medium text-[var(--text-body)] mb-3">
              Proof of Purchase
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {([
                { value: "receipt" as const, label: "Receipt", desc: "Original purchase receipt", icon: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" },
                { value: "proof_of_purchase" as const, label: "Proof of Purchase", desc: "Invoice or order confirmation", icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" },
                { value: "none" as const, label: "None", desc: "No proof available", icon: "M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setProvenanceType(opt.value)}
                  className={`flex flex-col items-center gap-2 rounded-xl p-5 text-center transition-all ${
                    provenanceType === opt.value
                      ? "border-2 border-[#D4AF37] bg-[#D4AF37]/10 shadow-[0_0_20px_rgba(212,175,55,0.1)]"
                      : "border border-[var(--divider)] bg-[var(--card-bg)] hover:border-[#D4AF37]/30"
                  }`}
                >
                  <svg
                    className={`h-6 w-6 ${provenanceType === opt.value ? "text-[#D4AF37]" : "text-[var(--text-muted)]"}`}
                    fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={opt.icon} />
                  </svg>
                  <span className={`text-sm font-semibold ${
                    provenanceType === opt.value ? "text-[#D4AF37]" : "text-[var(--text-heading)]"
                  }`}>
                    {opt.label}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-body)] mb-3">
              Authentication
            </label>
            <p className="text-xs text-[var(--text-muted)] mb-3">Select all that apply</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "brand_authenticated", label: "Brand Authenticated" },
                { value: "third_party_verified", label: "Third-Party Verified" },
                { value: "certificate_included", label: "Certificate Included" },
                { value: "serial_number", label: "Serial Number" },
              ].map((opt) => {
                const selected = authentication.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setAuthentication((prev) =>
                        selected
                          ? prev.filter((v) => v !== opt.value)
                          : [...prev, opt.value],
                      )
                    }
                    className={`flex items-center gap-2 rounded-xl px-4 py-3 text-left text-sm transition-all ${
                      selected
                        ? "border-2 border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] font-semibold"
                        : "border border-[var(--divider)] bg-[var(--card-bg)] text-[var(--text-body)] hover:border-[#D4AF37]/30"
                    }`}
                  >
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      selected ? "border-[#D4AF37] bg-[#D4AF37]" : "border-[var(--divider)]"
                    }`}>
                      {selected && (
                        <svg className="h-3 w-3 text-black" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Pricing */}
      {currentStep === 4 && (
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
        </div>
      )}

      {/* Step 6: Review */}
      {currentStep === 5 && (
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

              {/* Provenance summary */}
              {(provenanceType !== "none" || authentication.length > 0) && (
                <div className="border-t border-[var(--divider)] pt-3 mt-2">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">Provenance</p>
                  <div className="flex flex-wrap gap-2">
                    {provenanceType !== "none" && (
                      <span className="badge bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {provenanceType === "receipt" ? "Receipt" : "Proof of Purchase"}
                      </span>
                    )}
                    {authentication.map((a) => (
                      <span key={a} className="badge bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                        {a.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    ))}
                  </div>
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
