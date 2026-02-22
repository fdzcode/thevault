// Platform takes 8% commission on all sales
export const PLATFORM_FEE_PERCENT = 8;

export function calculateFees(totalAmount: number): {
  platformFee: number;
  sellerPayout: number;
} {
  const platformFee = Math.round(totalAmount * (PLATFORM_FEE_PERCENT / 100));
  const sellerPayout = totalAmount - platformFee;
  return { platformFee, sellerPayout };
}
