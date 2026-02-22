import { PLATFORM_FEE_BPS } from "~/lib/constants";

export function calculateFees(
  totalAmountCents: number,
  feeBps: number = PLATFORM_FEE_BPS,
) {
  const platformFeeAmount = Math.round((totalAmountCents * feeBps) / 10_000);
  const sellerPayoutAmount = totalAmountCents - platformFeeAmount;

  return {
    platformFeeBps: feeBps,
    platformFeeAmount,
    sellerPayoutAmount,
  };
}
