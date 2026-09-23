import { api } from './api';
import type { Order, OrderItem } from '../../shared/types';

type PlaceOrderPayload = {
  items: Omit<OrderItem, 'id' | 'product' | 'priceCents' | 'status'>[];
};

export type OrderStatusValue = 'preparing' | 'shipped' | 'delivered';

export const orderService = {
  getOrders: (page = 1, pageSize = 10) =>
    api.get<{ orders: Order[]; page: number; pageSize: number; total: number }>(
      `/orders?page=${page}&pageSize=${pageSize}`
    ),

  getOrder: (orderId: string) => api.get<Order>(`/orders/${orderId}`),

  placeOrder: (payload: PlaceOrderPayload) =>
    api.post<Order>('/orders', payload),

  updateOrderStatus: (orderId: string, status: OrderStatusValue) =>
    api.patch<Order>(`/orders/${orderId}/status`, { status }),
};
