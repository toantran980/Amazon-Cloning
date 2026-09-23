import {
  DELIVERY_OPTIONS,
  DELIVERY_OPTION_IDS,
  DEFAULT_DELIVERY_OPTION_ID,
  getSharedDeliveryOption,
  TAX_RATE,
  calculateDeliveryDate as sharedCalculateDeliveryDate,
} from '../../shared/checkout';
import type { DeliveryOption } from '../types';

export { DELIVERY_OPTIONS, DELIVERY_OPTION_IDS, DEFAULT_DELIVERY_OPTION_ID, TAX_RATE };

export const deliveryOptions: DeliveryOption[] = DELIVERY_OPTIONS;

export function getDeliveryOption(deliveryOptionId: string): DeliveryOption {
  return getSharedDeliveryOption(deliveryOptionId);
}

export function calculateDeliveryDate(option: DeliveryOption): string {
  return sharedCalculateDeliveryDate(option.deliveryDays);
}