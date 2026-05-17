import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import type { CartItem } from '../types';
import {
  calculateCartQuantity,
  cartReducer,
  loadCartFromStorage,
  type CartAction,
} from './cartReducer';

function loadCart(): CartItem[] {
  return loadCartFromStorage(localStorage.getItem('cart'));
}

interface CartStateValue {
  cart: CartItem[];
  cartQuantity: number;
}

interface CartContextValue extends CartStateValue {
  dispatch: React.Dispatch<CartAction>;
}

const CartStateContext = createContext<CartStateValue | null>(null);
const CartDispatchContext = createContext<React.Dispatch<CartAction> | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, undefined, loadCart);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const cartQuantity = calculateCartQuantity(cart);
  const stateValue = useMemo(() => ({ cart, cartQuantity }), [cart, cartQuantity]);

  return (
    <CartDispatchContext.Provider value={dispatch}>
      <CartStateContext.Provider value={stateValue}>{children}</CartStateContext.Provider>
    </CartDispatchContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const state = useCartState();
  const dispatch = useCartDispatch();
  return {
    ...state,
    dispatch,
  };
}

export function useCartState(): CartStateValue {
  const state = useContext(CartStateContext);
  if (!state) throw new Error('useCartState must be used within CartProvider');
  return state;
}

export function useCartDispatch(): React.Dispatch<CartAction> {
  const dispatch = useContext(CartDispatchContext);
  if (!dispatch) throw new Error('useCartDispatch must be used within CartProvider');
  return dispatch;
}
