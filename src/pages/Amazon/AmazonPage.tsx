import { useEffect, useMemo, useState } from 'react';
import Header from '../../components/Header/Header';
import VirtualizedProductGrid from '../../components/ProductGrid/VirtualizedProductGrid';
import { useProducts } from '../../context/ProductsContext';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { productService } from '../../services/productService';
import { toLocalProduct } from '../../utils/product';
import { filterLocalProducts } from '../../utils/productFilter';
import type { Product } from '../../types';

export default function AmazonPage() {
  const [inputQuery, setInputQuery] = useState('');
  const searchQuery = useDebouncedValue(inputQuery, 300);
  const { products, status } = useProducts();
  const [serverResults, setServerResults] = useState<Product[] | null>(null);

  // When a backend is available, search runs server-side over the full catalog
  // (name + keywords in PostgreSQL). In static/demo mode (no backend, bundled
  // fallback) we filter the bundled list locally so search still works.
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || status !== 'api') {
      setServerResults(null);
      return;
    }

    let cancelled = false;
    productService
      .search(trimmed)
      .then((res) => {
        if (cancelled) return;
        setServerResults(res.items.map(toLocalProduct));
      })
      .catch(() => {
        if (!cancelled) setServerResults([]);
      });

    return () => {
      cancelled = true;
    };
  }, [searchQuery, status]);

  const filteredProducts = useMemo(() => {
    if (searchQuery.trim() && status === 'api') {
      return serverResults ?? [];
    }
    return filterLocalProducts(products, searchQuery);
  }, [searchQuery, status, serverResults, products]);

  const hasQuery = searchQuery.trim().length > 0;
  const showNoResults = hasQuery && filteredProducts.length === 0;

  return (
    <>
      <Header onSearch={setInputQuery} searchQuery={inputQuery} />
      <main className="mt-15 h-[calc(100vh-60px)]">
        {showNoResults ? (
          <div className="h-full flex items-center justify-center px-[30px]">
            <p className="text-[18px] text-[#565959]">
              No products found for “{searchQuery.trim()}”.
            </p>
          </div>
        ) : (
          <VirtualizedProductGrid products={filteredProducts} />
        )}
      </main>
    </>
  );
}