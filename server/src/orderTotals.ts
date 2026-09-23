import { createHash } from 'crypto';

// Mirrors the canonical client config in `shared/checkout.ts`.
// The server computes authoritative totals from these; drift is guarded by
// `server/tests/checkoutParity.test.ts`.

export const DELIVERY_COST_MAP: Record<string, number> = {
  '1': 0, // Standard (FREE)
  '2': 499, // Express ($4.99)
  '3': 999, // Priority ($9.99)
};

export const TAX_RATE = 0.1;

export interface OrderLine {
  productId: string;
  quantity: number;
  deliveryOptionId: string;
}

export function computeProductsTotalCents(items: OrderLine[], priceCentsFor: (productId: string) => number) {
  return items.reduce((sum, item) => sum + priceCentsFor(item.productId) * item.quantity, 0);
}

export function computeShippingCents(items: OrderLine[]) {
  return items.reduce((sum, item) => sum + (DELIVERY_COST_MAP[item.deliveryOptionId] ?? 0), 0);
}

export function computeOrderTotals(
  items: OrderLine[],
  priceCentsFor: (productId: string) => number
) {
  const productsTotalCents = computeProductsTotalCents(items, priceCentsFor);
  const shippingCents = computeShippingCents(items);
  const taxCents = Math.round(productsTotalCents * TAX_RATE);

  return {
    productsTotalCents,
    shippingCents,
    taxCents,
    totalCents: productsTotalCents + shippingCents + taxCents,
  };
}

// Stable hash of an order payload so an Idempotency-Key can detect replays with
// a different cart and reject them (409) instead of silently returning the
// original order.
export function computePayloadHash(items: OrderLine[]): string {
  const canonical = items
    .map((item) => `${item.productId}:${item.quantity}:${item.deliveryOptionId}`)
    .sort()
    .join('|');
  return createHash('sha256').update(canonical).digest('hex');
}

// Server-authoritative delivery estimate, mirroring shared/checkout.ts.
export function estimateDeliveryDate(deliveryOptionId: string, from: Date = new Date()): string {
  const deliveryDays = DELIVERY_COST_MAP[deliveryOptionId] !== undefined
    ? deliveryDaysFor(deliveryOptionId)
    : 7;

  const date = new Date(from);
  let remaining = deliveryDays;

  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) remaining--;
  }

  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

const DELIVERY_DAYS: Record<string, number> = {
  '1': 7,
  '2': 3,
  '3': 1,
};

function deliveryDaysFor(deliveryOptionId: string): number {
  return DELIVERY_DAYS[deliveryOptionId] ?? 7;
}