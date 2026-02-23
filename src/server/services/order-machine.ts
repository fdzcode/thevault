import { TRPCError } from "@trpc/server";

/**
 * Order State Machine
 *
 * Centralizes all valid order status transitions, who can perform them,
 * and what preconditions must hold. Every place in the codebase that
 * changes an order status should go through this module.
 *
 * Status lifecycle:
 *
 *   pending ──→ paid ──→ shipped ──→ delivered
 *      │          │         │
 *      ↓          ↓         ↓
 *   cancelled   disputed  disputed
 *                  │         │
 *                  ↓         ↓
 *               refunded / delivered (admin resolution)
 */

export type OrderStatus =
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "disputed"
  | "refunded"
  | "cancelled";

export type TransitionRole = "buyer" | "seller" | "system" | "admin";

interface TransitionRule {
  to: OrderStatus;
  allowedBy: TransitionRole[];
}

/**
 * Map of current status → allowed transitions.
 * Each entry lists the target status and which roles may trigger it.
 */
const TRANSITIONS: Record<OrderStatus, TransitionRule[]> = {
  pending: [
    { to: "paid", allowedBy: ["system"] },
    { to: "cancelled", allowedBy: ["buyer", "seller", "system"] },
  ],
  paid: [
    { to: "shipped", allowedBy: ["seller"] },
    { to: "disputed", allowedBy: ["buyer"] },
    { to: "cancelled", allowedBy: ["admin"] },
  ],
  shipped: [
    { to: "delivered", allowedBy: ["buyer"] },
    { to: "disputed", allowedBy: ["buyer"] },
  ],
  delivered: [],
  disputed: [
    { to: "refunded", allowedBy: ["admin"] },
    { to: "delivered", allowedBy: ["admin"] },
  ],
  refunded: [],
  cancelled: [],
};

/**
 * Returns whether a transition from `from` to `to` is valid for the
 * given role, without throwing.
 */
export function canTransition(
  from: OrderStatus,
  to: OrderStatus,
  role: TransitionRole,
): boolean {
  const rules = TRANSITIONS[from];
  return rules.some((r) => r.to === to && r.allowedBy.includes(role));
}

/**
 * Asserts that a transition is valid, throwing a descriptive TRPCError
 * if not. Call this before performing any order status update.
 */
export function assertTransition(
  from: OrderStatus,
  to: OrderStatus,
  role: TransitionRole,
): void {
  const rules = TRANSITIONS[from];
  const targetRule = rules.find((r) => r.to === to);

  if (!targetRule) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Cannot transition order from "${from}" to "${to}"`,
    });
  }

  if (!targetRule.allowedBy.includes(role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Role "${role}" cannot transition order from "${from}" to "${to}"`,
    });
  }
}

/**
 * Returns all statuses reachable from the given status,
 * optionally filtered by role.
 */
export function allowedTransitions(
  from: OrderStatus,
  role?: TransitionRole,
): OrderStatus[] {
  const rules = TRANSITIONS[from];
  if (!role) return rules.map((r) => r.to);
  return rules.filter((r) => r.allowedBy.includes(role)).map((r) => r.to);
}

/**
 * Determines the role of a user relative to an order.
 * Returns undefined if the user is not a participant.
 */
export function resolveRole(
  userId: string,
  order: { buyerId: string; sellerId: string },
): "buyer" | "seller" | undefined {
  if (userId === order.buyerId) return "buyer";
  if (userId === order.sellerId) return "seller";
  return undefined;
}
