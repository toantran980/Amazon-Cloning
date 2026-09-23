import { describe, expect, it } from 'vitest';
import { computeOrderTotals, computePayloadHash, estimateDeliveryDate } from '../src/orderTotals';

const priceCentsFor = (id: string) => ({ a: 1000, b: 2500 }[id] ?? 0);

describe('computeOrderTotals', () => {
  it('sums products shipping and tax consistently', () => {
    const items = [
      { productId: 'a', quantity: 2, deliveryOptionId: '1' },
      { productId: 'b', quantity: 1, deliveryOptionId: '2' },
    ];

    const totals = computeOrderTotals(items, priceCentsFor);

    expect(totals.productsTotalCents).toBe(2 * 1000 + 1 * 2500);
    expect(totals.shippingCents).toBe(0 + 499);
    expect(totals.taxCents).toBe(Math.round(4500 * 0.1));
    expect(totals.totalCents).toBe(4500 + 499 + totals.taxCents);
  });

  it('applies the delivery cost per item (not per product)', () => {
    const items = [
      { productId: 'a', quantity: 1, deliveryOptionId: '3' },
      { productId: 'a', quantity: 1, deliveryOptionId: '2' },
    ];
    expect(computeOrderTotals(items, priceCentsFor).shippingCents).toBe(999 + 499);
  });
});

describe('computePayloadHash', () => {
  it('is stable regardless of item order', () => {
    const a = [
      { productId: 'a', quantity: 1, deliveryOptionId: '1' },
      { productId: 'b', quantity: 2, deliveryOptionId: '3' },
    ];
    const b = [
      { productId: 'b', quantity: 2, deliveryOptionId: '3' },
      { productId: 'a', quantity: 1, deliveryOptionId: '1' },
    ];
    expect(computePayloadHash(a)).toBe(computePayloadHash(b));
  });

  it('differs when quantities or delivery options change', () => {
    const base = [
      { productId: 'a', quantity: 1, deliveryOptionId: '1' },
      { productId: 'b', quantity: 2, deliveryOptionId: '3' },
    ];
    const differentQty = [
      { productId: 'a', quantity: 2, deliveryOptionId: '1' },
      { productId: 'b', quantity: 2, deliveryOptionId: '3' },
    ];
    const differentOption = [
      { productId: 'a', quantity: 1, deliveryOptionId: '2' },
      { productId: 'b', quantity: 2, deliveryOptionId: '3' },
    ];
    expect(computePayloadHash(base)).not.toBe(computePayloadHash(differentQty));
    expect(computePayloadHash(base)).not.toBe(computePayloadHash(differentOption));
  });
});

describe('estimateDeliveryDate', () => {
  it('skips weekends when counting delivery days', () => {
    // Find a Friday, then 1 working day -> the following Monday.
    const friday = new Date(2026, 0, 1);
    while (friday.getDay() !== 5) friday.setDate(friday.getDate() + 1);

    const nextMonday = new Date(friday);
    nextMonday.setDate(nextMonday.getDate() + 3);
    expect(estimateDeliveryDate('3', friday)).toBe(
      nextMonday.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    );

    // Express = 3 working days from Thursday -> the following Tuesday
    // (Fri + skip weekend + Mon + Tue).
    const thursday = new Date(friday);
    thursday.setDate(thursday.getDate() - 1);
    const tuesday = new Date(nextMonday);
    tuesday.setDate(tuesday.getDate() + 1);
    expect(estimateDeliveryDate('2', thursday)).toBe(
      tuesday.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    );
  });

  it('falls back to standard (7 working day) for unknown ids', () => {
    const monday = new Date(2026, 0, 5);
    while (monday.getDay() !== 1) monday.setDate(monday.getDate() + 1);

    // 7 working days after a Monday lands on a Wednesday.
    const expected = new Date(monday);
    expected.setDate(expected.getDate() + 9);
    expect(estimateDeliveryDate('bogus', monday)).toBe(
      expected.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    );
  });
});