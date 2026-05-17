import { memo, useState, useEffect, useRef } from 'react';
import type { Product } from '../../types';
import { useCartDispatch } from '../../context/CartContext';
import { formatCurrency } from '../../utils/money';

interface ProductCardProps {
  product: Product;
}

function StarRating({ stars }: { stars: number }) {
  const starsStr = String(Math.round(stars * 10));
  return (
    <img
      className="w-[100px] mr-[6px]"
      src={`/images/ratings/rating-${starsStr}.png`}
      alt={`${stars} out of 5 stars`}
    />
  );
}

function ProductCard({ product }: ProductCardProps) {
  const dispatch = useCartDispatch();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleAddToCart() {
    dispatch({ type: 'ADD_TO_CART', productId: product.id, quantity });
    setAdded(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="pt-[40px] pb-[25px] px-[25px] border-r border-b border-[#e7e7e7] flex flex-col">
      <div className="flex justify-center items-center h-[180px] mb-[20px]">
        <img
          className="max-w-full max-h-full"
          src={`/${product.image}`}
          alt={product.name}
        />
      </div>

      <p className="h-[40px] mb-[5px] line-clamp-2">{product.name}</p>

      <div className="flex items-center mb-[10px]">
        <StarRating stars={product.rating.stars} />
        <span className="text-(--amazon-link) cursor-pointer mt-[3px]">{product.rating.count}</span>
      </div>

      <div className="font-bold mb-[10px]">${formatCurrency(product.priceCents)}</div>

      <div className="mb-[17px]">
        <label htmlFor={`qty-${product.id}`} className="sr-only">Quantity</label>
        <select
          id={`qty-${product.id}`}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1" />

      <div
        className={`text-(--amazon-success) text-[16px] flex items-center mb-[8px] transition-opacity duration-200 ${
          added ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <img className="h-[20px] mr-[5px]" src="/images/icons/checkmark.png" alt="" />
        Added
      </div>

      <button
        className="w-full p-[8px] rounded-[50px] text-[#212121] bg-(--amazon-yellow) border border-(--amazon-yellow-border) cursor-pointer shadow-[0_2px_5px_rgba(213,217,217,0.5)] hover:bg-[#f7ca00] hover:border-[#f2c200]"
        onClick={handleAddToCart}
      >
        Add to Cart
      </button>
    </div>
  );
}

export default memo(ProductCard);
