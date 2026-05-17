import { useMemo, useState } from 'react';
import Header from '../../components/Header/Header';
import VirtualizedProductGrid from '../../components/ProductGrid/VirtualizedProductGrid';
import { products } from '../../data/products';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';

export default function AmazonPage() {
  const [inputQuery, setInputQuery] = useState('');
  const searchQuery = useDebouncedValue(inputQuery, 300);

  const filteredProducts = useMemo(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return products;

    const q = trimmed.toLowerCase();
    return products.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        (p.keywords || []).some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [searchQuery]);

  return (
    <>
      <Header onSearch={setInputQuery} />
      <main className="mt-15 h-[calc(100vh-60px)]">
        <VirtualizedProductGrid products={filteredProducts} />
      </main>
    </>
  );
}
