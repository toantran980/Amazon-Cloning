import { memo } from 'react';
import type { CartItem as CartItemType } from '../../types';
import { useCartDispatch } from '../../context/CartContext';
import { useProducts } from '../../context/ProductsContext';
import { formatCurrency } from '../../utils/money';

interface SavedForLaterItemProps {
  cartItem: CartItemType;
}

const linkPrimaryClass =
  'text-(--amazon-link) cursor-pointer bg-transparent border-none text-[15px] p-0 hover:text-(--amazon-link-hover)';

function SavedForLaterItem({ cartItem }: SavedForLaterItemProps) {
  const dispatch = useCartDispatch();
  const { getProduct } = useProducts();
  const product = getProduct(cartItem.productId);

  if (!product) return null;

  return (
    <div className="flex items-center gap-x-[20px] border border-[#dedede] rounded-[4px] p-[15px] max-[575px]:flex-col max-[575px]:text-center">
      <img
        className="max-w-[90px] max-h-[90px] shrink-0"
        src={`/${product.image}`}
        alt={product.name}
      />

      <div className="flex-1 min-w-0">
        <p className="font-bold mb-[4px]">{product.name}</p>
        <p className="text-[#b12704] font-bold">
          ${formatCurrency(product.priceCents)}
        </p>
        <p className="text-[15px] text-[#787878]">Quantity: {cartItem.quantity}</p>
      </div>

      <div className="flex flex-col gap-y-[8px] shrink-0">
        <button
          className={linkPrimaryClass}
          onClick={() =>
            dispatch({ type: 'TOGGLE_SAVE_FOR_LATER', productId: cartItem.productId })
          }
        >
          Move to cart
        </button>
        <button
          className={linkPrimaryClass}
          onClick={() => dispatch({ type: 'REMOVE_FROM_CART', productId: cartItem.productId })}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default memo(SavedForLaterItem);