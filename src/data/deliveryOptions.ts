import dayjs from 'dayjs';
import type { DeliveryOption } from '../types';

export const DEFAULT_DELIVERY_OPTION_ID = '1';
export const DELIVERY_OPTION_IDS = {
  standard: '1',
  expedited: '2',
  overnight: '3',
} as const;

export const deliveryOptions: DeliveryOption[] = [
  { id: DELIVERY_OPTION_IDS.standard, deliveryDays: 7, priceCents: 0 },
  { id: DELIVERY_OPTION_IDS.expedited, deliveryDays: 3, priceCents: 499 },
  { id: DELIVERY_OPTION_IDS.overnight, deliveryDays: 1, priceCents: 999 },
];

export function getDeliveryOption(deliveryOptionId: string): DeliveryOption {
  return (
    deliveryOptions.find((option) => option.id === deliveryOptionId) ||
    deliveryOptions[0]
  );
}

function isWeekend(date: dayjs.Dayjs): boolean {
  const dayOfWeek = date.day();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

export function calculateDeliveryDate(option: DeliveryOption): string {
  let remainingDays = option.deliveryDays;
  let deliveryDate = dayjs();

  while (remainingDays > 0) {
    deliveryDate = deliveryDate.add(1, 'day');
    if (!isWeekend(deliveryDate)) {
      remainingDays--;
    }
  }

  return deliveryDate.format('dddd, MMMM D');
}
