import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '../../components/Header/Header';
import { useProducts } from '../../context/ProductsContext';
import { useCartDispatch } from '../../context/CartContext';
import { formatCurrency } from '../../utils/money';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getProduct } = useProducts();
  const dispatch = useCartDispatch();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const product = id ? getProduct(id) : undefined;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!product) {
    return (
      <>
        <Header />
        <main className="max-w-[850px] mt-[90px] mb-[100px] px-[30px] mx-auto text-center p-[40px]">
          <p className="text-[18px] mb-[10px]">Product not found.</p>
          <Link to="/" className="text-[#017cb6] hover:text-[#c45000]">
            ← Back to products
          </Link>
        </main>
      </>
    );
  }

  const viewProduct = product;

  const maxQty = Math.max(1, Math.min(10, viewProduct.stock ?? 10));
  const outOfStock = (viewProduct.stock ?? 1) <= 0;

  function handleAddToCart() {
    dispatch({ type: 'ADD_TO_CART', productId: viewProduct.id, quantity });
    setAdded(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setAdded(false), 2000);
  }

  return (
    <>
      <Header />
      <main className="max-w-[1000px] mt-[90px] mb-[100px] px-[30px] mx-auto">
        <Link to="/" className="inline-block mb-[30px] text-[#017cb6] hover:text-[#c45000]">
          ← Back to products
        </Link>

        <div className="grid grid-cols-[minmax(0,420px)_1fr] gap-x-[40px] gap-y-[30px] max-[800px]:grid-cols-1">
          <div className="flex items-center justify-center h-[360px] max-[800px]:h-[240px]">
            <img
              className="max-w-full max-h-full"
              src={`/${viewProduct.image}`}
              alt={viewProduct.name}
            />
          </div>

          <div>
            <p className="text-[24px] font-bold mb-[8px]">{viewProduct.name}</p>

            <div className="flex items-center mb-[10px]">
              <img
                className="w-[100px] mr-[6px]"
                src={`/images/ratings/rating-${String(Math.round(viewProduct.rating.stars * 10))}.png`}
                alt={`${viewProduct.rating.stars} out of 5 stars`}
              />
              <span className="text-(--amazon-link)">{viewProduct.rating.count}</span>
            </div>

            <div className="text-[28px] font-bold mb-[12px]">
              ${formatCurrency(viewProduct.priceCents)}
            </div>

            {outOfStock ? (
              <p className="text-[#c40000] mb-[12px]">Currently out of stock</p>
            ) : viewProduct.stock !== undefined && viewProduct.stock <= 10 ? (
              <p className="text-[#c40000] mb-[12px]">Only {viewProduct.stock} left in stock</p>
            ) : null}

            <div className="mb-[20px]">
              <label htmlFor="qty" className="sr-only">
                Quantity
              </label>
              <select
                id="qty"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                disabled={outOfStock}
              >
                {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div
              className={`text-(--amazon-success) text-[18px] flex items-center mb-[12px] transition-opacity duration-200 ${
                added ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img className="h-[20px] mr-[5px]" src="/images/icons/checkmark.png" alt="" />
              Added
            </div>

            <button
              className="w-full max-w-[320px] p-[12px] rounded-[50px] text-[#212121] bg-(--amazon-yellow) border border-(--amazon-yellow-border) cursor-pointer shadow-[0_2px_5px_rgba(213,217,217,0.5)] hover:bg-[#f7ca00] hover:border-[#f2c200] disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleAddToCart}
              disabled={outOfStock}
            >
              Add to Cart
            </button>

            {viewProduct.keywords && viewProduct.keywords.length > 0 && (
              <div className="mt-[24px] flex flex-wrap gap-[6px]">
                {viewProduct.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="text-[12px] px-[8px] py-[4px] rounded-full bg-[#f0f2f2] text-[#565959]"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}

            {(viewProduct.type || viewProduct.sizeChartLink) && (
              <p className="mt-[16px] text-[13px] text-[#565959]">
                {viewProduct.type ? `Type: ${viewProduct.type}` : ''}
                {viewProduct.sizeChartLink ? (
                  <>
                    {' · '}
                    <Link to={viewProduct.sizeChartLink} className="text-(--amazon-link)">
                      View size chart
                    </Link>
                  </>
                ) : null}
              </p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}