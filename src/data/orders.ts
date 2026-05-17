import type { Order, OrderProduct } from '../types';

function isValidOrderProduct(p: unknown): p is OrderProduct {
  if (typeof p !== 'object' || p === null) return false;
  const { productId, quantity, deliveryOptionId, estimatedDeliveryDate } = p as Record<string, unknown>;
  return (
    typeof productId === 'string' &&
    typeof quantity === 'number' &&
    Number.isInteger(quantity) &&
    quantity > 0 &&
    typeof deliveryOptionId === 'string' &&
    typeof estimatedDeliveryDate === 'string'
  );
}

function isValidOrder(order: unknown): order is Order {
  if (typeof order !== 'object' || order === null) return false;
  const { id, orderDate, totalCents, products } = order as Record<string, unknown>;
  return (
    typeof id === 'string' &&
    typeof orderDate === 'number' &&
    typeof totalCents === 'number' &&
    Array.isArray(products) &&
    products.every(isValidOrderProduct)
  );
}

export function loadOrders(): Order[] {
  try {
    const parsed = JSON.parse(localStorage.getItem('orders') || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidOrder);
  } catch {
    return [];
  }
}

export function saveOrders(orders: Order[]): void {
  localStorage.setItem('orders', JSON.stringify(orders));
}

export function addOrder(order: Order): void {
  const orders = loadOrders();
  orders.unshift(order);
  saveOrders(orders);
}
