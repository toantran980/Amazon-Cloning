import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartDispatch, useCartState } from '../../context/CartContext';
import { addOrder } from '../../data/orders';
import { formatCurrency } from '../../utils/money';
import { buildOrderFromCart, calculateCartTotals } from '../../utils/order';

export default function PaymentSummary() {
  const { cart } = useCartState();
  const dispatch = useCartDispatch();
  const navigate = useNavigate();

  const { productsCents, shippingCents, taxCents, totalCents, itemsCount } = useMemo(
    () => calculateCartTotals(cart),
    [cart]
  );

  function handlePlaceOrder() {
    const order = buildOrderFromCart(cart, totalCents);

    addOrder(order);
    dispatch({ type: 'CLEAR_CART' });
    navigate('/orders');
  }

  const rowClass = 'mb-2.25 grid grid-cols-[1fr_auto] text-[15px]';
  const moneyClass = 'text-right';

  return (
    <div className="rounded-sm border border-[#dedede] p-4.5 pb-1.25">
      <p className="mb-3 font-bold text-[18px]">Order Summary</p>

      <div className={rowClass}>
        <div>Items ({itemsCount}):</div>
        <div className={moneyClass}>${formatCurrency(productsCents)}</div>
      </div>

      <div className={rowClass}>
        <div>Shipping &amp; handling:</div>
        <div className={moneyClass}>${formatCurrency(shippingCents)}</div>
      </div>

      {/* Subtotal row — money cell gets a top border */}
      <div className={rowClass}>
        <div className="pt-2.25">Total before tax:</div>
        <div className={`${moneyClass} border-t border-[#dedede] pt-2.25`}>
          ${formatCurrency(productsCents + shippingCents)}
        </div>
      </div>

      <div className={rowClass}>
        <div>Estimated tax (10%):</div>
        <div className={moneyClass}>${formatCurrency(taxCents)}</div>
      </div>

      <div className={`${rowClass} border-t border-[#dedede] pt-4.5 text-[18px] font-bold text-[#b12704]`}>
        <div>Order total:</div>
        <div className={moneyClass}>${formatCurrency(totalCents)}</div>
      </div>

      <button
        className="mt-2.75 mb-3.75 w-full cursor-pointer rounded-lg border border-[#fcd200] bg-[#ffd814] py-3 text-[16px] text-[#212121] shadow-[0_2px_5px_rgba(213,217,217,0.5)] hover:bg-[#f7ca00]"
        onClick={handlePlaceOrder}
      >
        Place your order
      </button>
    </div>
  );
}
