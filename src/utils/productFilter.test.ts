import { describe, expect, it } from 'vitest';
import {
  filterLocalProducts,
  filterInStock,
  sortProducts,
} from './productFilter';
import type { Product } from '../types';

const socks: Product = {
  id: 'socks-1',
  name: 'Athletic Cotton Socks',
  image: 'images/t.png',
  rating: { stars: 4.5, count: 10 },
  priceCents: 1090,
  keywords: ['socks', 'crew'],
  stock: 3,
};

const basketball: Product = {
  id: 'ball-1',
  name: 'Intermediate Basketball',
  image: 'images/b.png',
  rating: { stars: 4, count: 5 },
  priceCents: 2095,
  keywords: ['sports', 'ball'],
  stock: 0,
};

const headset: Product = {
  id: 'headset-1',
  name: 'Wireless Headset',
  image: 'images/h.png',
  rating: { stars: 4.5, count: 2 },
  priceCents: 4990,
};

const products = [socks, basketball];

describe('filterLocalProducts', () => {
  it('matches on the product name (case-insensitive, substring)', () => {
    const result = filterLocalProducts(products, 'SOCK');
    expect(result).toEqual([socks]);
  });

  it('matches on keywords', () => {
    const result = filterLocalProducts(products, 'sports');
    expect(result).toEqual([basketball]);
  });

  it('trims surrounding whitespace', () => {
    expect(filterLocalProducts(products, '  basketball  ')).toEqual([basketball]);
  });

  it('returns everything for an empty query', () => {
    expect(filterLocalProducts(products, '')).toEqual(products);
    expect(filterLocalProducts(products, '   ')).toEqual(products);
  });

  it('returns an empty list when nothing matches', () => {
    expect(filterLocalProducts(products, 'toaster')).toEqual([]);
  });
});

const allProducts = [socks, basketball, headset];

describe('sortProducts', () => {
  it('keeps the original order for featured', () => {
    const result = sortProducts(allProducts, 'featured');
    expect(result.map((p) => p.id)).toEqual(['socks-1', 'ball-1', 'headset-1']);
  });

  it('sorts by price ascending', () => {
    const result = sortProducts(allProducts, 'price-asc');
    expect(result.map((p) => p.id)).toEqual(['socks-1', 'ball-1', 'headset-1']);
  });

  it('sorts by price descending', () => {
    const result = sortProducts(allProducts, 'price-desc');
    expect(result.map((p) => p.id)).toEqual(['headset-1', 'ball-1', 'socks-1']);
  });

  it('sorts by rating (stars, then count)', () => {
    const result = sortProducts(allProducts, 'rating');
    // headset (4.5/2) ties socks (4.5/10) on stars, so socks wins on count.
    expect(result.map((p) => p.id)).toEqual(['socks-1', 'headset-1', 'ball-1']);
  });

  it('does not mutate the input list', () => {
    const input = [...allProducts];
    sortProducts(input, 'price-desc');
    expect(input.map((p) => p.id)).toEqual(['socks-1', 'ball-1', 'headset-1']);
  });
});

describe('filterInStock', () => {
  it('keeps products with stock and without a stock value', () => {
    const result = filterInStock(allProducts);
    expect(result.map((p) => p.id)).toEqual(['socks-1', 'headset-1']);
  });
});