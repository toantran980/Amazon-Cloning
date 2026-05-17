import { api } from './api';
import type { Order, OrderItem } from '../../shared/types';

type PlaceOrderPayload = {
  items: Omit<OrderItem, 'id' | 'product'>[];
};

export const orderService = {
  getOrders: () => api.get<Order[]>('/orders'),

  placeOrder: (payload: PlaceOrderPayload) =>
    api.post<Order>('/orders', payload),
};
