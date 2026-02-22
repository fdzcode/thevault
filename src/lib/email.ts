import { Resend } from "resend";
import {
  emailWrapper,
  emailButton,
  emailDivider,
  emailDetailsTable,
} from "./email-templates";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = "The Vault <noreply@thevault.app>";
const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

// Helper that silently fails if no API key configured
async function sendEmail(opts: { to: string; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email] Skipping (no API key): ${opts.subject} -> ${opts.to}`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM_EMAIL, ...opts });
  } catch (error) {
    console.error("[Email] Failed to send:", error);
  }
}

// ─── Helper to format cents as dollars ──────────────────────────────

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ─── Types ──────────────────────────────────────────────────────────

export interface OrderDetails {
  orderId: string;
  listingTitle: string;
  totalAmount: number; // cents
  buyerName: string;
  sellerName: string;
  trackingNumber?: string | null;
  shippingCarrier?: string | null;
}

export interface DisputeDetails {
  disputeId: string;
  orderId: string;
  listingTitle: string;
  reason: string;
  description: string;
  filerName: string;
  resolution?: string | null;
  status?: string;
}

// ─── Email Functions ────────────────────────────────────────────────

/**
 * Sent to buyer when order is created.
 */
export async function sendOrderConfirmationEmail(
  to: string,
  orderDetails: OrderDetails,
) {
  const { orderId, listingTitle, totalAmount, sellerName } = orderDetails;

  const html = emailWrapper(`
    <h2 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 8px;">Order Confirmed</h2>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 16px;">
      Your order has been placed successfully. The seller has been notified and will ship your item soon.
    </p>
    ${emailDivider()}
    ${emailDetailsTable([
      { label: "Item", value: listingTitle },
      { label: "Total", value: formatCurrency(totalAmount) },
      { label: "Seller", value: sellerName },
      { label: "Order ID", value: orderId },
    ])}
    ${emailDivider()}
    <p style="color:#a1a1aa;font-size:13px;margin:0;">
      You can track your order status at any time from your orders page.
    </p>
    <div style="text-align:center;">
      ${emailButton("View Order", `${BASE_URL}/orders/${orderId}`)}
    </div>
  `);

  await sendEmail({
    to,
    subject: `Order Confirmed - ${listingTitle}`,
    html,
  });
}

/**
 * Sent to seller when payment is confirmed.
 */
export async function sendPaymentReceivedEmail(
  to: string,
  orderDetails: OrderDetails,
) {
  const { orderId, listingTitle, totalAmount, buyerName } = orderDetails;

  const html = emailWrapper(`
    <h2 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 8px;">Payment Received</h2>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 16px;">
      Great news! Payment has been confirmed for your listing. Please ship the item as soon as possible.
    </p>
    ${emailDivider()}
    ${emailDetailsTable([
      { label: "Item", value: listingTitle },
      { label: "Amount", value: formatCurrency(totalAmount) },
      { label: "Buyer", value: buyerName },
      { label: "Order ID", value: orderId },
    ])}
    ${emailDivider()}
    <p style="color:#a1a1aa;font-size:13px;margin:0;">
      Head to your sales page to mark this order as shipped and add tracking information.
    </p>
    <div style="text-align:center;">
      ${emailButton("View Sale", `${BASE_URL}/orders/${orderId}`)}
    </div>
  `);

  await sendEmail({
    to,
    subject: `Payment Received - ${listingTitle}`,
    html,
  });
}

/**
 * Sent to buyer when order is shipped with tracking info.
 */
export async function sendOrderShippedEmail(
  to: string,
  orderDetails: OrderDetails,
) {
  const { orderId, listingTitle, sellerName, trackingNumber, shippingCarrier } =
    orderDetails;

  const trackingRows = [
    { label: "Item", value: listingTitle },
    { label: "Seller", value: sellerName },
    { label: "Order ID", value: orderId },
  ];

  if (trackingNumber) {
    trackingRows.push({ label: "Tracking #", value: trackingNumber });
  }
  if (shippingCarrier) {
    trackingRows.push({
      label: "Carrier",
      value: shippingCarrier.toUpperCase(),
    });
  }

  const html = emailWrapper(`
    <h2 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 8px;">Your Order Has Shipped!</h2>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 16px;">
      The seller has shipped your item. ${trackingNumber ? "You can track your package using the details below." : "Check your order page for updates."}
    </p>
    ${emailDivider()}
    ${emailDetailsTable(trackingRows)}
    ${emailDivider()}
    <p style="color:#a1a1aa;font-size:13px;margin:0;">
      Once you receive the item, please confirm delivery on your orders page to complete the transaction.
    </p>
    <div style="text-align:center;">
      ${emailButton("Track Order", `${BASE_URL}/orders/${orderId}`)}
    </div>
  `);

  await sendEmail({
    to,
    subject: `Order Shipped - ${listingTitle}`,
    html,
  });
}

/**
 * Sent to seller when buyer confirms delivery.
 */
export async function sendOrderDeliveredEmail(
  to: string,
  orderDetails: OrderDetails,
) {
  const { orderId, listingTitle, totalAmount, buyerName } = orderDetails;

  const html = emailWrapper(`
    <h2 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 8px;">Delivery Confirmed</h2>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 16px;">
      The buyer has confirmed delivery of your item. The transaction is now complete and your earnings will be available for payout.
    </p>
    ${emailDivider()}
    ${emailDetailsTable([
      { label: "Item", value: listingTitle },
      { label: "Sale Amount", value: formatCurrency(totalAmount) },
      { label: "Buyer", value: buyerName },
      { label: "Order ID", value: orderId },
    ])}
    ${emailDivider()}
    <p style="color:#a1a1aa;font-size:13px;margin:0;">
      You can view your earnings and request a payout from your seller dashboard.
    </p>
    <div style="text-align:center;">
      ${emailButton("View Sales", `${BASE_URL}/my-sales`)}
    </div>
  `);

  await sendEmail({
    to,
    subject: `Delivery Confirmed - ${listingTitle}`,
    html,
  });
}

/**
 * Sent when a new message is received.
 */
export async function sendNewMessageEmail(
  to: string,
  senderName: string,
  listingTitle: string,
) {
  const html = emailWrapper(`
    <h2 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 8px;">New Message</h2>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 16px;">
      You have a new message from <strong style="color:#ffffff;">${senderName}</strong>${listingTitle ? ` about <strong style="color:#ffffff;">${listingTitle}</strong>` : ""}.
    </p>
    ${emailDivider()}
    <p style="color:#a1a1aa;font-size:13px;margin:0;">
      Log in to The Vault to read and reply to this message.
    </p>
    <div style="text-align:center;">
      ${emailButton("View Messages", `${BASE_URL}/messages`)}
    </div>
  `);

  await sendEmail({
    to,
    subject: `New message from ${senderName}${listingTitle ? ` - ${listingTitle}` : ""}`,
    html,
  });
}

/**
 * Sent when a dispute is filed.
 */
export async function sendDisputeOpenedEmail(
  to: string,
  disputeDetails: DisputeDetails,
) {
  const { disputeId, orderId, listingTitle, reason, description, filerName } =
    disputeDetails;

  const reasonLabels: Record<string, string> = {
    item_not_received: "Item Not Received",
    item_not_as_described: "Item Not As Described",
    counterfeit: "Counterfeit Item",
    other: "Other",
  };

  const html = emailWrapper(`
    <h2 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 8px;">Dispute Opened</h2>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 16px;">
      A dispute has been filed regarding an order. Our team will review the details and work to resolve this as quickly as possible.
    </p>
    ${emailDivider()}
    ${emailDetailsTable([
      { label: "Item", value: listingTitle },
      { label: "Filed By", value: filerName },
      { label: "Reason", value: reasonLabels[reason] ?? reason },
      { label: "Order ID", value: orderId },
      { label: "Dispute ID", value: disputeId },
    ])}
    ${emailDivider()}
    <div style="background-color:#27272a;border-radius:6px;padding:12px;margin:12px 0;">
      <p style="color:#a1a1aa;font-size:12px;margin:0 0 4px;font-weight:600;">Description:</p>
      <p style="color:#d4d4d8;font-size:13px;margin:0;">${description}</p>
    </div>
    <p style="color:#a1a1aa;font-size:13px;margin:0;">
      You can view the dispute details and respond from the order page.
    </p>
    <div style="text-align:center;">
      ${emailButton("View Order", `${BASE_URL}/orders/${orderId}`)}
    </div>
  `);

  await sendEmail({
    to,
    subject: `Dispute Opened - ${listingTitle}`,
    html,
  });
}

/**
 * Sent when a dispute is resolved.
 */
export async function sendDisputeResolvedEmail(
  to: string,
  disputeDetails: DisputeDetails,
) {
  const { orderId, listingTitle, resolution, status } = disputeDetails;

  const statusLabels: Record<string, string> = {
    resolved_buyer: "Resolved in Favor of Buyer",
    resolved_seller: "Resolved in Favor of Seller",
    closed: "Closed",
  };

  const html = emailWrapper(`
    <h2 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 8px;">Dispute Resolved</h2>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 16px;">
      The dispute for your order has been resolved. Please review the outcome below.
    </p>
    ${emailDivider()}
    ${emailDetailsTable([
      { label: "Item", value: listingTitle },
      { label: "Outcome", value: statusLabels[status ?? ""] ?? (status ?? "Resolved") },
      { label: "Order ID", value: orderId },
    ])}
    ${resolution ? `
    ${emailDivider()}
    <div style="background-color:#27272a;border-radius:6px;padding:12px;margin:12px 0;">
      <p style="color:#a1a1aa;font-size:12px;margin:0 0 4px;font-weight:600;">Resolution Details:</p>
      <p style="color:#d4d4d8;font-size:13px;margin:0;">${resolution}</p>
    </div>` : ""}
    <p style="color:#a1a1aa;font-size:13px;margin:0;">
      If you have further questions, please contact our support team.
    </p>
    <div style="text-align:center;">
      ${emailButton("View Order", `${BASE_URL}/orders/${orderId}`)}
    </div>
  `);

  await sendEmail({
    to,
    subject: `Dispute Resolved - ${listingTitle}`,
    html,
  });
}

/**
 * Sent on registration.
 */
export async function sendWelcomeEmail(to: string, memberNumber: string) {
  const html = emailWrapper(`
    <h2 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 8px;">Welcome to The Vault</h2>
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 16px;">
      You are now part of an exclusive community of custom designer traders. Your membership has been activated.
    </p>
    ${emailDivider()}
    <div style="text-align:center;padding:16px 0;">
      <p style="color:#71717a;font-size:12px;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px;">Your Member Number</p>
      <p style="color:#ffffff;font-size:32px;font-weight:800;margin:0;letter-spacing:2px;">#${memberNumber}</p>
    </div>
    ${emailDivider()}
    <p style="color:#a1a1aa;font-size:14px;margin:0 0 8px;">Here is what you can do on The Vault:</p>
    <ul style="color:#d4d4d8;font-size:14px;margin:8px 0 16px;padding-left:20px;">
      <li style="margin-bottom:6px;">Browse and purchase custom designer pieces</li>
      <li style="margin-bottom:6px;">List your own items for sale</li>
      <li style="margin-bottom:6px;">Message other members directly</li>
      <li style="margin-bottom:6px;">Vouch for authentic items with legit checks</li>
      <li style="margin-bottom:6px;">Invite friends with your personal invite codes</li>
    </ul>
    <p style="color:#a1a1aa;font-size:13px;margin:0;">
      Set up your profile to get started and make your first trade.
    </p>
    <div style="text-align:center;">
      ${emailButton("Set Up Profile", `${BASE_URL}/settings/profile`)}
    </div>
  `);

  await sendEmail({
    to,
    subject: `Welcome to The Vault - Member #${memberNumber}`,
    html,
  });
}
