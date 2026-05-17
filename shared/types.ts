export interface Product {
  id: string;
  image: string;
  name: string;
  ratingStars: number;
  ratingCount: number;
  priceCents: number;
  keywords: string[];
  type?: string;
  sizeChartLink?: string;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  deliveryOptionId: string;
  product: Product;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  priceCents: number;
  deliveryOptionId: string;
  estimatedDelivery: string;
  product: Product;
}

export interface Order {
  id: string;
  userId: string;
  orderDate: number;
  items: OrderItem[];
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
