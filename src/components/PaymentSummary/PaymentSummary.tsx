import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartDispatch, useCartState } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductsContext';
import { addOrder } from '../../data/orders';
import { orderService } from '../../services/orderService';
import { formatCurrency } from '../../utils/money';
import { buildOrderFromCart, calculateCartTotals } from '../../utils/order';
import { getDeliveryOption, calculateDeliveryDate } from '../../data/deliveryOptions';

function luhnCheck(cardNumber: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = Number(cardNumber[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

interface PaymentErrors {
  name?: string;
  cardNumber?: string;
  expiry?: string;
  cvc?: string;
}

function validatePayment(cardName: string, cardNumberDigits: string, expiry: string, cvc: string): PaymentErrors {
  const errors: PaymentErrors = {};

  if (!cardName.trim()) errors.name = 'Enter the name on the card.';

  if (cardNumberDigits.length < 13 || cardNumberDigits.length > 19) {
    errors.cardNumber = 'Enter a valid card number.';
  } else if (!luhnCheck(cardNumberDigits)) {
    errors.cardNumber = 'Enter a valid card number.';
  }

  const expiryMatch = expiry.trim().match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
  if (!expiryMatch) {
    errors.expiry = 'Use the format MM/YY.';
  } else {
    const month = Number(expiryMatch[1]);
    const twoDigitYear = Number(expiryMatch[2]);
    const year = 2000 + twoDigitYear;
    const now = new Date();
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);
    if (endOfMonth < now) errors.expiry = 'Card has expired.';
  }

  if (!/^\d{3,4}$/.test(cvc)) errors.cvc = 'Enter the 3-digit security code.';

  return errors;
}

export default function PaymentSummary() {
  const { cart } = useCartState();
  const dispatch = useCartDispatch();
  const { isAuthenticated } = useAuth();
  const { products } = useProducts();
  const navigate = useNavigate();

  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [errors, setErrors] = useState<PaymentErrors>({});
  const [processing, setProcessing] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Saved-for-later items stay out of the order (and its totals).
  const activeCart = useMemo(() => cart.filter((item) => !item.savedForLater), [cart]);
  const { productsCents, shippingCents, taxCents, totalCents, itemsCount } = useMemo(
    () => calculateCartTotals(activeCart, products),
    [activeCart, products]
  );

  async function placeOrder() {
    if (isAuthenticated) {
      const items = activeCart.map((item) => {
        const option = getDeliveryOption(item.deliveryOptionId);
        return {
          productId: item.productId,
          quantity: item.quantity,
          deliveryOptionId: item.deliveryOptionId,
          estimatedDelivery: calculateDeliveryDate(option),
        };
      });
      await orderService.placeOrder({ items });
    } else {
      const order = buildOrderFromCart(activeCart, totalCents);
      addOrder(order);
    }
    // Remove only the purchased items so saved-for-later entries survive.
    activeCart.forEach((item) => dispatch({ type: 'REMOVE_FROM_CART', productId: item.productId }));
  }

  async function handlePlaceOrder() {
    const cardNumberDigits = cardNumber.replace(/\D/g, '');
    const validation = validatePayment(cardName, cardNumberDigits, expiry, cvc);
    setErrors(validation);
    setOrderError('');

    if (Object.keys(validation).length > 0) return;

    if (activeCart.length === 0) {
      setOrderError('Your cart is empty.');
      return;
    }

    // Simulated payment authorization — demo only, no real charge.
    setProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    try {
      await placeOrder();
      navigate('/orders');
    } catch {
      setOrderError('Could not place your order. Please try again.');
    } finally {
      setProcessing(false);
    }
  }

  function formatCardNumber(value: string): string {
    return value
      .replace(/\D/g, '')
      .slice(0, 19)
      .replace(/(.{4})/g, '$1 ')
      .trim();
  }

  function formatExpiry(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  const inputClass =
    'block w-full border border-[#a6a6a6] rounded-[4px] px-[8px] py-[6px] text-[14px]';
  const labelClass = 'block text-[13px] font-medium mb-[4px]';
  const errorTextClass = 'block text-[13px] text-[#c40000] mb-[4px]';
  const rowClass = 'mb-2.25 grid grid-cols-[1fr_auto] text-[15px]';
  const moneyClass = 'text-right';

  return (
    <div className="space-y-[12px]">
      {/* Payment details */}
      <div className="rounded-sm border border-[#dedede] p-4.5 pb-2">
        <p className="mb-3 font-bold text-[18px]">Payment details</p>
        <p className="mb-2 text-[13px] text-[#787878]">
          Demo checkout — enter any card details, no real charge is made.
        </p>

        <div className="mb-3">
          <label className={labelClass} htmlFor="cardNumber">
            Card number
          </label>
          <input
            id="cardNumber"
            className={inputClass}
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          />
          {errors.cardNumber && <span className={errorTextClass}>{errors.cardNumber}</span>}
        </div>

        <div className="mb-3">
          <label className={labelClass} htmlFor="cardName">
            Name on card
          </label>
          <input
            id="cardName"
            className={inputClass}
            autoComplete="cc-name"
            placeholder="Jane Doe"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
          />
          {errors.name && <span className={errorTextClass}>{errors.name}</span>}
        </div>

        <div className="grid grid-cols-2 gap-x-[12px] mb-1">
          <div>
            <label className={labelClass} htmlFor="expiry">
              Expiry (MM/YY)
            </label>
            <input
              id="expiry"
              className={inputClass}
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="09/27"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            />
            {errors.expiry && <span className={errorTextClass}>{errors.expiry}</span>}
          </div>
          <div>
            <label className={labelClass} htmlFor="cvc">
              CVC
            </label>
            <input
              id="cvc"
              className={inputClass}
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="123"
              maxLength={4}
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
            />
            {errors.cvc && <span className={errorTextClass}>{errors.cvc}</span>}
          </div>
        </div>
      </div>

      {/* Order summary + place order */}
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

        {orderError && (
          <p className="mb-2 text-[14px] text-[#c40000]">{orderError}</p>
        )}

        <button
          className="mt-2.75 mb-3.75 w-full cursor-pointer rounded-lg border border-[#fcd200] bg-[#ffd814] py-3 text-[16px] text-[#212121] shadow-[0_2px_5px_rgba(213,217,217,0.5)] hover:bg-[#f7ca00] disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={handlePlaceOrder}
          disabled={processing}
        >
          {processing ? 'Processing payment…' : 'Place your order'}
        </button>
      </div>
    </div>
  );
}