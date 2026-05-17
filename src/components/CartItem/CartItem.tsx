import { memo, useState } from 'react';
import type { CartItem as CartItemType } from '../../types';
import { useCartDispatch } from '../../context/CartContext';
import { getProduct } from '../../data/products';
import { deliveryOptions, calculateDeliveryDate, getDeliveryOption } from '../../data/deliveryOptions';
import { formatCurrency } from '../../utils/money';

interface CartItemProps {
  cartItem: CartItemType;
}

const linkPrimaryClass =
  'text-(--amazon-link) cursor-pointer bg-transparent border-none [font-size:inherit] p-0 ml-[3px] hover:text-(--amazon-link-hover)';

function CartItem({ cartItem }: CartItemProps) {
  const dispatch = useCartDispatch();
  const product = getProduct(cartItem.productId);
  const [isEditing, setIsEditing] = useState(false);
  const [editQuantity, setEditQuantity] = useState(String(cartItem.quantity));

  if (!product) return null;

  function handleSaveQuantity() {
    const newQty = parseInt(editQuantity, 10);
    if (!isNaN(newQty) && newQty > 0 && newQty <= 999) {
      dispatch({ type: 'UPDATE_QUANTITY', productId: cartItem.productId, quantity: newQty });
    }
    setIsEditing(false);
  }

  function handleDelete() {
    dispatch({ type: 'REMOVE_FROM_CART', productId: cartItem.productId });
  }

  function handleDeliveryChange(optionId: string) {
    dispatch({ type: 'UPDATE_DELIVERY_OPTION', productId: cartItem.productId, deliveryOptionId: optionId });
  }

  const selectedOption = getDeliveryOption(cartItem.deliveryOptionId);

  return (
    <div className="border border-[#dedede] rounded-[4px] p-[18px] mb-[12px]">
      <p className="text-[#007600] font-bold text-[19px] mt-[5px] mb-[22px]">
        Delivery date: {calculateDeliveryDate(selectedOption)}
      </p>

      <div className="grid grid-cols-[100px_1fr_1fr] gap-x-[25px] max-[1000px]:grid-cols-[100px_1fr] max-[1000px]:gap-y-[30px]">
        <img
          className="max-w-full max-h-[120px] mx-auto block"
          src={`/${product.image}`}
          alt={product.name}
        />

        <div>
          <p className="font-bold mb-[8px]">{product.name}</p>
          <p className="text-[#b12704] font-bold mb-[5px]">${formatCurrency(product.priceCents)}</p>

          <div className="mb-[5px]">
            {isEditing ? (
              <>
                <input
                  className="w-[40px] border border-[#d5d9d9] rounded-[4px] py-[2px] px-[4px] text-[15px] mr-[4px]"
                  type="number"
                  min="1"
                  max="999"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                />
                <button className={linkPrimaryClass} onClick={handleSaveQuantity}>
                  Save
                </button>
              </>
            ) : (
              <>
                <span>Quantity: <strong>{cartItem.quantity}</strong></span>
                <button
                  className={linkPrimaryClass}
                  onClick={() => {
                    setEditQuantity(String(cartItem.quantity));
                    setIsEditing(true);
                  }}
                >
                  Update
                </button>
              </>
            )}
            <button className={linkPrimaryClass} onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>

        <div className="mt-[5px] max-[1000px]:col-span-2">
          <p className="font-bold mb-[10px]">Choose a delivery option:</p>
          {deliveryOptions.map((option) => (
            <label key={option.id} className="grid grid-cols-[24px_1fr] mb-[12px] cursor-pointer">
              <input
                className="ml-0 cursor-pointer"
                type="radio"
                name={`delivery-${cartItem.productId}`}
                checked={cartItem.deliveryOptionId === option.id}
                onChange={() => handleDeliveryChange(option.id)}
              />
              <div>
                <p className="text-[#007600] font-medium mb-[3px]">
                  {calculateDeliveryDate(option)}
                </p>
                <p className="text-[#787878] text-[15px]">
                  {option.priceCents === 0 ? 'FREE' : `$${formatCurrency(option.priceCents)}`} Shipping
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(CartItem);
