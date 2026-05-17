import type { OrderStatus } from '../types';

export const DEFAULT_ORDER_STATUS: OrderStatus = 'preparing';

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  'preparing',
  'shipped',
  'delivered',
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  preparing: 'Preparing',
  shipped: 'Shipped',
  delivered: 'Delivered',
};

export const ORDER_STATUS_PROGRESS_WIDTHS: Record<OrderStatus, string> = {
  preparing: '33%',
  shipped: '66%',
  delivered: '100%',
};