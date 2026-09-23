export interface Rating {
  stars: number;
  count: number;
}

export interface Product {
  id: string;
  image: string;
  name: string;
  rating: Rating;
  priceCents: number;
  keywords?: string[];
  type?: string;
  sizeChartLink?: string;
  stock?: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
  deliveryOptionId: string;
  savedForLater?: boolean;
}

export interface DeliveryOption {
  id: string;
  deliveryDays: number;
  priceCents: number;
}

export type OrderStatus = 'preparing' | 'shipped' | 'delivered';

export interface OrderProduct {
  productId: string;
  quantity: number;
  deliveryOptionId: string;
  estimatedDeliveryDate: string;
  status?: OrderStatus;
}

export interface Order {
  id: string;
  orderDate: number;
  totalCents: number;
  products: OrderProduct[];
}
