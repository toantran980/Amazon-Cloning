import { describe, expect, it } from 'vitest';
import { filterLocalProducts } from './productFilter';
import type { Product } from '../types';

const socks: Product = {
  id: 'socks-1',
  name: 'Athletic Cotton Socks',
  image: 'images/t.png',
  rating: { stars: 4.5, count: 10 },
  priceCents: 1090,
  keywords: ['socks', 'crew'],
};

const basketball: Product = {
  id: 'ball-1',
  name: 'Intermediate Basketball',
  image: 'images/b.png',
  rating: { stars: 4, count: 5 },
  priceCents: 2095,
  keywords: ['sports', 'ball'],
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