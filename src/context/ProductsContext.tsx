import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Product } from '../types';
import { productService } from '../services/productService';
import { products as bundledProducts } from '../data/products';
import { toLocalProduct } from '../utils/product';

const API_PAGE_SIZE = 100;

export type ProductsStatus = 'loading' | 'api' | 'fallback';

interface ProductsContextValue {
  products: Product[];
  status: ProductsStatus;
  getProduct: (productId: string) => Product | undefined;
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [source, setSource] = useState<Product[]>(bundledProducts);
  const [status, setStatus] = useState<ProductsStatus>('fallback');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    (async () => {
      try {
        const first = await productService.getProducts(1, API_PAGE_SIZE);
        if (cancelled) return;

        let all = first.items;
        const pageCount = Math.ceil(first.total / API_PAGE_SIZE);
        for (let page = 2; page <= pageCount; page++) {
          const next = await productService.getProducts(page, API_PAGE_SIZE);
          if (cancelled) return;
          all = all.concat(next.items);
        }

        setSource(all.map(toLocalProduct));
        setStatus('api');
      } catch {
        // No backend (e.g. static demo deploy): keep the bundled catalog.
        if (!cancelled) setStatus('fallback');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const productMap = useMemo(() => new Map(source.map((p) => [p.id, p])), [source]);
  const getProduct = useCallback((productId: string) => productMap.get(productId), [productMap]);

  const value = useMemo(() => ({ products: source, status, getProduct }), [source, status, getProduct]);

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts(): ProductsContextValue {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider');
  return ctx;
}