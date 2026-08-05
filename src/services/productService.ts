import { api } from './api';
import type { Product } from '../../shared/types';

export const productService = {
  getProducts: (page = 1, pageSize = 20) =>
    api.get<{ items: Product[]; page: number; pageSize: number; total: number }>(
      `/products?page=${page}&pageSize=${pageSize}`
    ),
};
