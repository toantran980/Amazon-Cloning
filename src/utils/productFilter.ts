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