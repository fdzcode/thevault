// Shared form styling classes — V7 luxury theme
export const inputClass =
  "mt-1 w-full rounded-xl border border-[var(--divider)] bg-[var(--input-bg)] px-3 py-2 text-[var(--text-heading)] placeholder-[var(--text-muted)] focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/30 transition";

export const labelClass = "block text-sm font-medium text-[var(--text-body)]";

// Gold CTA button — v7
export const goldButtonClass =
  "rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F4E5C3] px-6 py-2.5 font-semibold text-black tracking-widest transition hover:shadow-lg hover:shadow-[#D4AF37]/20 disabled:opacity-50";

// Secondary / outline button — v7
export const secondaryButtonClass =
  "glass-card border rounded-xl px-6 py-2.5 font-medium text-muted hover:text-white tracking-wider transition disabled:opacity-50";

// Order status badge colors
export const ORDER_STATUS_STYLES: Record<string, string> = {
  pending: "badge bg-amber-500/10 text-amber-400 border border-amber-500/20",
  paid: "badge bg-blue-500/10 text-blue-400 border border-blue-500/20",
  shipped: "badge bg-purple-500/10 text-purple-400 border border-purple-500/20",
  delivered: "badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  disputed: "badge bg-orange-500/10 text-orange-400 border border-orange-500/20",
  refunded: "badge bg-violet-500/10 text-violet-400 border border-violet-500/20",
  cancelled: "badge bg-red-500/10 text-red-400 border border-red-500/20",
};

// Platform fee & payout settings
export const PLATFORM_FEE_BPS = 500; // 5%
export const DISPUTE_WINDOW_DAYS = 14;
export const PAYOUT_DELAY_DAYS = 3;

// Payment method badge colors
export const PAYMENT_METHOD_STYLES: Record<string, string> = {
  crypto: "badge bg-purple-500/10 text-purple-400 border border-purple-500/20",
  stripe: "badge bg-blue-500/10 text-blue-400 border border-blue-500/20",
};

// Payment method display labels
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  crypto: "Crypto",
  stripe: "Stripe",
};

// Business rule: high-value listing photo requirement
export const HIGH_VALUE_THRESHOLD_CENTS = 690000;
export const HIGH_VALUE_MIN_PHOTOS = 3;

// Condition badge classes
export const CONDITION_BADGE_STYLES: Record<string, string> = {
  new: "badge-deadstock",
  like_new: "badge-excellent",
  good: "badge-good",
  fair: "badge-fair",
};

// Condition display labels
export const CONDITION_LABELS: Record<string, string> = {
  new: "Deadstock / New",
  like_new: "Like New",
  good: "Good",
  fair: "Fair",
};

// Listing type badge classes
export const LISTING_TYPE_BADGE_STYLES: Record<string, string> = {
  for_sale: "badge-for-sale",
  trade: "badge-trade",
  both: "badge-excellent",
};

// ─── Dropdown / Filter Options ──────────────────────────────────────

export const CATEGORIES = [
  { value: "apparel", label: "Apparel" },
  { value: "accessories", label: "Accessories" },
  { value: "art", label: "Art" },
  { value: "collectibles", label: "Collectibles" },
  { value: "footwear", label: "Footwear" },
  { value: "jewelry", label: "Jewelry" },
  { value: "prints", label: "Prints" },
  { value: "other", label: "Other" },
] as const;

export const CONDITIONS = [
  { value: "new", label: "New", description: "Brand new, never worn or used, with tags" },
  { value: "like_new", label: "Like New", description: "Worn once or twice, no visible flaws" },
  { value: "good", label: "Good", description: "Gently used with minor signs of wear" },
  { value: "fair", label: "Fair", description: "Noticeable wear, still fully functional" },
] as const;

export const LISTING_TYPES = [
  { value: "for_sale", label: "For Sale" },
  { value: "trade", label: "Trade" },
  { value: "both", label: "Both" },
] as const;

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
] as const;

// ─── Utilities ──────────────────────────────────────────────────────

/**
 * Safely parse a JSON-encoded images string into an array of URLs.
 * Returns an empty array if parsing fails or the data is malformed.
 */
export function safeParseImages(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

/** Look up a label from a value in an options array. */
export function labelFor(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string,
): string {
  return options.find((o) => o.value === value)?.label ?? value;
}
