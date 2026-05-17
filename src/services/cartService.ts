import { api } from './api';
import type { CartItem } from '../../shared/types';

export const cartService = {
  getCart: () => api.get<CartItem[]>('/cart'),

  addToCart: (productId: string, quantity: number, deliveryOptionId?: string) =>
    api.post<CartItem>('/cart', { productId, quantity, deliveryOptionId }),

  updateItem: (productId: string, data: { quantity?: number; deliveryOptionId?: string }) =>
    api.patch<CartItem>(`/cart/${productId}`, data),

  removeItem: (productId: string) => api.delete<void>(`/cart/${productId}`),

  clearCart: () => api.delete<void>('/cart'),
};
