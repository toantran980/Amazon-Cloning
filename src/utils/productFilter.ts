import type { Product } from '../types';

// Client-side catalog filter used in static/demo mode (no backend). Mirrors the
// server-side search (name + keywords) in routes/products.ts.
export function filterLocalProducts(products: Product[], query: string): Product[] {
  const trimmed = query.trim();
  if (!trimmed) return products;
  const q = trimmed.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.keywords || []).some((keyword) => keyword.toLowerCase().includes(q))
  );
}

export type ProductSortKey = 'featured' | 'price-asc' | 'price-desc' | 'rating';

export function sortProducts(products: Product[], sort: ProductSortKey): Product[] {
  const list = [...products];
  switch (sort) {
    case 'price-asc':
      return list.sort((a, b) => a.priceCents - b.priceCents);
    case 'price-desc':
      return list.sort((a, b) => b.priceCents - a.priceCents);
    case 'rating':
      return list.sort(
        (a, b) => b.rating.stars - a.rating.stars || b.rating.count - a.rating.count
      );
    default:
      // 'featured' keeps the catalog's original order.
      return list;
  }
}

export function filterInStock(products: Product[]): Product[] {
  return products.filter((p) => p.stock === undefined || p.stock > 0);
}