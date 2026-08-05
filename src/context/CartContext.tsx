import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import type { CartItem } from '../types';
import { useAuth } from './AuthContext';
import { cartService } from '../services/cartService';
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

// Tracks the token we already synced the guest cart for, so we don't re-push
// the same guest items on every page load.
let syncedToken: string | null = null;

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, undefined, loadCart);
  const { token } = useAuth();
  const guestCartRef = useRef<CartItem[]>(cart);

  // Keep a ref of the current guest cart so the sync effect below can access
  // the latest items without re-running on every cart change.
  useEffect(() => {
    guestCartRef.current = cart;
  }, [cart]);

  // Persist local cart to localStorage for guests (no token).
  useEffect(() => {
    if (!token) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart, token]);

  // Merge the guest cart into the server cart once when a token appears.
  useEffect(() => {
    if (!token) {
      syncedToken = null;
      return;
    }

    // Already synced for this token on a previous render/mount.
    if (syncedToken === token) return;

    syncedToken = token;
    let cancelled = false;

    async function mergeCart() {
      try {
        // Push the local (guest) cart to the server so nothing is lost.
        const mergedRows = await cartService.mergeCart(guestCartRef.current);

        // Clear the guest cart from localStorage now that it lives on the server.
        localStorage.removeItem('cart');

        if (cancelled) return;
        const merged: CartItem[] = mergedRows.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          deliveryOptionId: item.deliveryOptionId,
        }));
        dispatch({ type: 'REPLACE_CART', cart: merged });
      } catch {
        // Ignore sync errors; fall back to local cart.
      }
    }

    mergeCart();
    return () => {
      cancelled = true;
    };
  }, [token]);

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
