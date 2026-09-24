import { useEffect, useMemo, useState } from 'react';
import Header from '../../components/Header/Header';
import VirtualizedProductGrid from '../../components/ProductGrid/VirtualizedProductGrid';
import ProductGridSkeleton from '../../components/ProductGrid/ProductGridSkeleton';
import { useProducts } from '../../context/ProductsContext';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { productService } from '../../services/productService';
import { toLocalProduct } from '../../utils/product';
import {
  filterLocalProducts,
  filterInStock,
  sortProducts,
  type ProductSortKey,
} from '../../utils/productFilter';
import type { Product } from '../../types';

const SORT_OPTIONS: Array<{ value: ProductSortKey; label: string }> = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

export default function AmazonPage() {
  const [inputQuery, setInputQuery] = useState('');
  const searchQuery = useDebouncedValue(inputQuery, 300);
  const { products, status } = useProducts();
  const [serverResults, setServerResults] = useState<Product[] | null>(null);
  const [sort, setSort] = useState<ProductSortKey>('featured');
  const [inStockOnly, setInStockOnly] = useState(false);

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

  const visibleProducts = useMemo(() => {
    const list = inStockOnly ? filterInStock(filteredProducts) : filteredProducts;
    return sortProducts(list, sort);
  }, [filteredProducts, inStockOnly, sort]);

  const hasQuery = searchQuery.trim().length > 0;
  const isSearching = hasQuery && status === 'api' && serverResults === null;
  const showNoResults = hasQuery && !isSearching && visibleProducts.length === 0;

  return (
    <>
      <Header onSearch={setInputQuery} searchQuery={inputQuery} />
      <main className="mt-15 h-[calc(100vh-60px)] flex flex-col">
        {showNoResults ? (
          <div className="flex-1 flex items-center justify-center px-[30px]">
            <p className="text-[18px] text-[#565959]">
              No products found for “{searchQuery.trim()}”.
            </p>
          </div>
        ) : (
          <>
            <div className="shrink-0 flex flex-wrap items-center gap-x-[22px] gap-y-[8px] px-[25px] py-[10px] border-b border-[#e7e7e7]">
              <p className="text-[14px] text-[#565959]" data-testid="results-count">
                {visibleProducts.length} {visibleProducts.length === 1 ? 'result' : 'results'}
              </p>
              <label className="flex items-center gap-[6px] text-[14px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                />
                In stock only
              </label>
              <label className="flex items-center gap-[6px] text-[14px]">
                Sort by
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as ProductSortKey)}
                  className="p-[4px] border border-[#d5d9d9] rounded-[8px] bg-white"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex-1 min-h-0">
              {isSearching ? (
                <ProductGridSkeleton />
              ) : (
                <VirtualizedProductGrid products={visibleProducts} highlight={searchQuery.trim()} />
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}