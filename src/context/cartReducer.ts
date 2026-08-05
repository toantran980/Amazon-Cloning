import type { CartItem } from '../types';
import { DEFAULT_DELIVERY_OPTION_ID } from '../data/deliveryOptions';

export type CartAction =
  | { type: 'ADD_TO_CART'; productId: string; quantity: number }
  | { type: 'REMOVE_FROM_CART'; productId: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number }
  | { type: 'UPDATE_DELIVERY_OPTION'; productId: string; deliveryOptionId: string }
  | { type: 'CLEAR_CART' }
  | { type: 'REPLACE_CART'; cart: CartItem[] };

export function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existing = state.find((item) => item.productId === action.productId);
      if (existing) {
        return state.map((item) =>
          item.productId === action.productId
            ? { ...item, quantity: item.quantity + action.quantity }
            : item
        );
      }
      return [
        ...state,
        {
          productId: action.productId,
          quantity: action.quantity,
          deliveryOptionId: DEFAULT_DELIVERY_OPTION_ID,
        },
      ];
    }
    case 'REMOVE_FROM_CART':
      return state.filter((item) => item.productId !== action.productId);
    case 'UPDATE_QUANTITY':
      return state.map((item) =>
        item.productId === action.productId
          ? { ...item, quantity: action.quantity }
          : item
      );
    case 'UPDATE_DELIVERY_OPTION':
      return state.map((item) =>
        item.productId === action.productId
          ? { ...item, deliveryOptionId: action.deliveryOptionId }
          : item
      );
    case 'CLEAR_CART':
      return [];
    case 'REPLACE_CART':
      return action.cart;
    default:
      return state;
  }
}

export function isValidCartItem(item: unknown): item is CartItem {
  if (typeof item !== 'object' || item === null) return false;
  const { productId, quantity, deliveryOptionId } = item as Record<string, unknown>;
  return (
    typeof productId === 'string' &&
    typeof quantity === 'number' &&
    Number.isInteger(quantity) &&
    quantity > 0 &&
    quantity <= 999 &&
    typeof deliveryOptionId === 'string'
  );
}

export function loadCartFromStorage(rawValue: string | null): CartItem[] {
  try {
    const parsed = JSON.parse(rawValue || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidCartItem);
  } catch {
    return [];
  }
}

export function calculateCartQuantity(cart: CartItem[]): number {
  return cart.reduce((total, item) => total + item.quantity, 0);
}
