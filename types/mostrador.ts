import type { PreOrderItem } from "@/components/dashboard/pre-order-items-list";

/**
 * A cart item in the Mostrador POS view.
 * Extends PreOrderItem with a stable local ID so the cart can contain
 * multiple entries of the same product with different modifiers.
 */
export type CartItem = PreOrderItem & {
  cartId: string;
};
