// Order status lifecycle helpers.
//
// Statuses progress automatically based on elapsed time since the order was
// placed. This is a deterministic, cron-free way to model the lifecycle
// preparing -> shipped -> delivered.
export type OrderStatus = 'preparing' | 'shipped' | 'delivered';

// Time boundaries (ms) for each status transition.
export const STATUS_TRANSITIONS: { afterMs: number; status: OrderStatus }[] = [
  // In "shipped" for roughly 3 days after being ordered.
  { afterMs: 3 * 24 * 60 * 60 * 1000, status: 'shipped' },
  // Delivered after roughly 7 days.
  { afterMs: 7 * 24 * 60 * 60 * 1000, status: 'delivered' },
];

export function computeStatus(orderDate: number | bigint, savedStatus?: string): OrderStatus {
  const orderTime = typeof orderDate === 'bigint' ? Number(orderDate) : orderDate;
  const elapsedMs = Date.now() - orderTime;

  // If a saved status is ahead (e.g. manually set to delivered), keep it.
  const saved = savedStatus as OrderStatus | undefined;
  if (saved === 'delivered' || saved === 'shipped') return saved;

  let status: OrderStatus = 'preparing';
  for (const transition of STATUS_TRANSITIONS) {
    if (elapsedMs >= transition.afterMs) {
      status = transition.status;
    } else {
      break;
    }
  }
  return status;
}
