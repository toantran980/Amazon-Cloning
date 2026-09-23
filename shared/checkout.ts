// Canonical delivery & tax configuration for checkout math.
//
// The client renders from these constants. The server keeps an intentionally
// mirrored copy in `server/src/orderTotals.ts`; drift between the two is
// guarded by `server/tests/checkoutParity.test.ts`.

export interface DeliveryOptionConfig {
  id: string;
  label: string;
  deliveryDays: number;
  priceCents: number;
}

export const DELIVERY_OPTIONS: DeliveryOptionConfig[] = [
  { id: '1', label: 'Standard', deliveryDays: 7, priceCents: 0 },
  { id: '2', label: 'Express', deliveryDays: 3, priceCents: 499 },
  { id: '3', label: 'Priority', deliveryDays: 1, priceCents: 999 },
];

export const DELIVERY_OPTION_IDS = {
  standard: '1',
  expedited: '2',
  overnight: '3',
} as const;

export const DEFAULT_DELIVERY_OPTION_ID = DELIVERY_OPTIONS[0].id;

export function getSharedDeliveryOption(deliveryOptionId: string): DeliveryOptionConfig {
  return DELIVERY_OPTIONS.find((option) => option.id === deliveryOptionId) ?? DELIVERY_OPTIONS[0];
}

// Sales-tax rate applied to product subtotals.
export const TAX_RATE = 0.1;

// Number of working days (skipping weekends) counted from `from`, formatted
// like the client's shipping estimator so guest & authenticated orders agree.
export function calculateDeliveryDate(deliveryDays: number, from: Date = new Date()): string {
  const date = new Date(from);
  let remaining = deliveryDays;

  while (remaining > 0) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) remaining--;
  }

  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}