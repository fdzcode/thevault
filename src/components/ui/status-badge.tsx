import {
  ORDER_STATUS_STYLES,
  PAYMENT_METHOD_STYLES,
  PAYMENT_METHOD_LABELS,
} from "~/lib/constants";

export function OrderStatusBadge({ status }: { status: string }) {
  const style = ORDER_STATUS_STYLES[status] ?? ORDER_STATUS_STYLES.pending;
  return <span className={style}>{status}</span>;
}

export function PaymentMethodBadge({ method }: { method: string }) {
  const style =
    PAYMENT_METHOD_STYLES[method] ?? PAYMENT_METHOD_STYLES.stripe;
  const label = PAYMENT_METHOD_LABELS[method] ?? method;
  return <span className={style}>{label}</span>;
}
