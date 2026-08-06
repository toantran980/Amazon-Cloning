import { api } from './api';

export interface PaymentIntentItem {
  productId: string;
  quantity: number;
  deliveryOptionId?: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  demoMode: boolean;
}

export const paymentService = {
  createPaymentIntent: (items: PaymentIntentItem[]) =>
    api.post<PaymentIntentResponse>('/payments/create-intent', { items }),
};
