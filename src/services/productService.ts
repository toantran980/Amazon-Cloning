import { api } from './api';
import type { Product } from '../../shared/types';

export const productService = {
  getProducts: (page = 1, pageSize = 100) =>
    api.get<{ items: Product[]; page: number; pageSize: number; total: number }>(
      `/products?page=${page}&pageSize=${pageSize}`
    ),

  search: (query: string, page = 1, pageSize = 100) =>
    api.get<{ items: Product[]; page: number; pageSize: number; total: number }>(
      `/products?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(query)}`
    ),
};