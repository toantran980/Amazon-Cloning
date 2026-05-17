import { api } from './api';
import type { Product } from '../../shared/types';

export const productService = {
  getProducts: () => api.get<Product[]>('/products'),
};
