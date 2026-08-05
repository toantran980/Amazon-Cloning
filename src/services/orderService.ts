import { api } from './api';
import type { Order, OrderItem } from '../../shared/types';

type PlaceOrderPayload = {
  items: Omit<OrderItem, 'id' | 'product'>[];
};

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export const orderService = {
  getOrders: (page = 1, pageSize = 10) =>
    api.get<{ orders: Order[]; page: number; pageSize: number; total: number }>(
      `/orders?page=${page}&pageSize=${pageSize}`
    ),

  placeOrder: (payload: PlaceOrderPayload) =>
    api.post<Order>('/orders', payload),
};
