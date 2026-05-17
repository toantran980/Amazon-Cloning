import { DEFAULT_ORDER_STATUS } from '../constants/order';
import { calculateDeliveryDate, getDeliveryOption } from '../data/deliveryOptions';
import { getProduct } from '../data/products';
import type { CartItem, Order } from '../types';

export interface CartTotals {
  productsCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  itemsCount: number;
}

export function calculateCartTotals(cart: CartItem[]): CartTotals {
  let productsCents = 0;
  let shippingCents = 0;

  cart.forEach((item) => {
    const product = getProduct(item.productId);
    const option = getDeliveryOption(item.deliveryOptionId);
    if (product) productsCents += product.priceCents * item.quantity;
    shippingCents += option.priceCents;
  });

  const taxCents = Math.round(productsCents * 0.1);

  return {
    productsCents,
    shippingCents,
    taxCents,
    totalCents: productsCents + shippingCents + taxCents,
    itemsCount: cart.reduce((total, item) => total + item.quantity, 0),
  };
}

export function createOrderId(): string {
  return `order-${Date.now()}-${crypto.randomUUID()}`;
}

export function buildOrderFromCart(
  cart: CartItem[],
  totalCents: number,
  orderId: string = createOrderId(),
  orderDate: number = Date.now()
): Order {
  return {
    id: orderId,
    orderDate,
    totalCents,
    products: cart.map((item) => {
      const option = getDeliveryOption(item.deliveryOptionId);
      return {
        productId: item.productId,
        quantity: item.quantity,
        deliveryOptionId: item.deliveryOptionId,
        estimatedDeliveryDate: calculateDeliveryDate(option),
        status: DEFAULT_ORDER_STATUS,
      };
    }),
  };
}