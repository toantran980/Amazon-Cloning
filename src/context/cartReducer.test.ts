import { describe, expect, it } from 'vitest';
import { cartReducer, loadCartFromStorage } from './cartReducer';

describe('cartReducer', () => {
  it('adds new product with default delivery option', () => {
    const next = cartReducer([], {
      type: 'ADD_TO_CART',
      productId: 'abc',
      quantity: 2,
    });

    expect(next).toEqual([{ productId: 'abc', quantity: 2, deliveryOptionId: '1' }]);
  });

  it('increments quantity when adding existing product', () => {
    const state = [{ productId: 'abc', quantity: 2, deliveryOptionId: '1' }];
    const next = cartReducer(state, {
      type: 'ADD_TO_CART',
      productId: 'abc',
      quantity: 3,
    });

    expect(next[0].quantity).toBe(5);
  });

  it('updates quantity', () => {
    const state = [{ productId: 'abc', quantity: 2, deliveryOptionId: '1' }];
    const next = cartReducer(state, {
      type: 'UPDATE_QUANTITY',
      productId: 'abc',
      quantity: 7,
    });

    expect(next[0].quantity).toBe(7);
  });

  it('clears cart', () => {
    const state = [{ productId: 'abc', quantity: 2, deliveryOptionId: '1' }];
    const next = cartReducer(state, { type: 'CLEAR_CART' });
    expect(next).toEqual([]);
  });
});

describe('loadCartFromStorage', () => {
  it('filters invalid items from localStorage payload', () => {
    const parsed = loadCartFromStorage(
      JSON.stringify([
        { productId: 'good', quantity: 1, deliveryOptionId: '1' },
        { productId: 'bad', quantity: 0, deliveryOptionId: '1' },
      ])
    );

    expect(parsed).toEqual([{ productId: 'good', quantity: 1, deliveryOptionId: '1' }]);
  });
});