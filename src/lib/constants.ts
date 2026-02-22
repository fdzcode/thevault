// Shared form styling classes
export const inputClass =
  "mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none";

export const labelClass = "block text-sm font-medium text-zinc-300";

// Order status badge colors
export const ORDER_STATUS_STYLES: Record<string, string> = {
  pending: "bg-zinc-400/10 text-zinc-400",
  paid: "bg-yellow-400/10 text-yellow-400",
  shipped: "bg-blue-400/10 text-blue-400",
  delivered: "bg-green-400/10 text-green-400",
  disputed: "bg-orange-400/10 text-orange-400",
  refunded: "bg-purple-400/10 text-purple-400",
  cancelled: "bg-red-400/10 text-red-400",
};

// Platform fee & payout settings
export const PLATFORM_FEE_BPS = 500; // 5%
export const DISPUTE_WINDOW_DAYS = 14;
export const PAYOUT_DELAY_DAYS = 3;

// Payment method badge colors
export const PAYMENT_METHOD_STYLES: Record<string, string> = {
  crypto: "bg-purple-900/50 text-purple-300",
  stripe: "bg-blue-900/50 text-blue-300",
};

// Payment method display labels
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  crypto: "Crypto",
  stripe: "Stripe",
};

// Business rule: high-value listing photo requirement
export const HIGH_VALUE_THRESHOLD_CENTS = 690000;
export const HIGH_VALUE_MIN_PHOTOS = 3;
