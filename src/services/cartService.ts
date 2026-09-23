import { api } from './api';
import type { CartItem } from '../../shared/types';

export const cartService = {
  mergeCart: (items: { productId: string; quantity: number; deliveryOptionId?: string }[]) =>
    api.post<CartItem[]>(`/cart/merge`, { items }),
};
