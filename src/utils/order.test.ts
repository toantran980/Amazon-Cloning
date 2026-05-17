import { describe, expect, it } from 'vitest';
import { buildOrderFromCart, calculateCartTotals } from './order';

describe('calculateCartTotals', () => {
  it('calculates product, shipping, tax, total, and item count', () => {
    const cart = [
      { productId: 'e43638ce-6aa0-4b85-b27f-e1d07eb678c6', quantity: 2, deliveryOptionId: '1' },
      { productId: '15b6fc6f-327a-4ec4-896f-486349e85a3d', quantity: 1, deliveryOptionId: '2' },
    ];

    const totals = calculateCartTotals(cart);

    expect(totals.itemsCount).toBe(3);
    expect(totals.productsCents).toBeGreaterThan(0);
    expect(totals.shippingCents).toBeGreaterThanOrEqual(0);
    expect(totals.totalCents).toBe(totals.productsCents + totals.shippingCents + totals.taxCents);
  });
});

describe('buildOrderFromCart', () => {
  it('builds order with preparing status and deterministic metadata', () => {
    const cart = [
      { productId: 'e43638ce-6aa0-4b85-b27f-e1d07eb678c6', quantity: 1, deliveryOptionId: '1' },
    ];

    const order = buildOrderFromCart(cart, 12345, 'order-fixed-id', 1700000000000);

    expect(order.id).toBe('order-fixed-id');
    expect(order.orderDate).toBe(1700000000000);
    expect(order.totalCents).toBe(12345);
    expect(order.products).toHaveLength(1);
    expect(order.products[0].status).toBe('preparing');
  });
});