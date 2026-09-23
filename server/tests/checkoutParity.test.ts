import { describe, expect, it } from 'vitest';
import { DELIVERY_OPTIONS, TAX_RATE as SHARED_TAX_RATE, calculateDeliveryDate as sharedCalculateDeliveryDate } from '../../shared/checkout';
import { DELIVERY_COST_MAP, TAX_RATE, estimateDeliveryDate } from '../src/orderTotals';

// Guards the mirrored server copy in orderTotals.ts against the canonical
// client config in shared/checkout.ts so the two can never drift again.
describe('checkout parity (shared vs server)', () => {
  it('delivery option cost map matches the canonical shared config', () => {
    for (const option of DELIVERY_OPTIONS) {
      expect(DELIVERY_COST_MAP[option.id]).toBe(option.priceCents);
    }
  });

  it('delivery option ids are covered', () => {
    expect(Object.keys(DELIVERY_COST_MAP).sort()).toEqual(
      DELIVERY_OPTIONS.map((option) => option.id).sort()
    );
  });

  it('tax rate matches the canonical shared config', () => {
    expect(TAX_RATE).toBe(SHARED_TAX_RATE);
  });

  it('delivery date estimates match the shared algorithm for a fixed date', () => {
    const from = new Date(2026, 8, 21); // Monday, Sep 21 2026
    for (const option of DELIVERY_OPTIONS) {
      expect(estimateDeliveryDate(option.id, from)).toBe(
        sharedCalculateDeliveryDate(option.deliveryDays, from)
      );
    }
  });
});