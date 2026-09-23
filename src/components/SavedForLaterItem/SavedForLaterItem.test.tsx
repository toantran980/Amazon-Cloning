import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SavedForLaterItem from './SavedForLaterItem';
import type { Product, CartItem } from '../../types';

const { dispatch } = vi.hoisted(() => ({ dispatch: vi.fn() }));
const { getProduct } = vi.hoisted(() => ({ getProduct: vi.fn() }));

vi.mock('../../context/CartContext', () => ({
  useCartDispatch: () => dispatch,
}));
vi.mock('../../context/ProductsContext', () => ({
  useProducts: () => ({ getProduct, products: [], status: 'fallback' }),
}));

const product: Product = {
  id: 'test-id',
  name: 'Saved Product',
  image: 'images/saved.png',
  rating: { stars: 4, count: 3 },
  priceCents: 2499,
  keywords: [],
  stock: 5,
};

const cartItem: CartItem = {
  productId: 'test-id',
  quantity: 2,
  deliveryOptionId: '1',
  savedForLater: true,
};

describe('SavedForLaterItem', () => {
  it('renders the saved product details', () => {
    getProduct.mockReturnValue(product);
    render(<SavedForLaterItem cartItem={cartItem} />);

    expect(screen.getByText('Saved Product')).toBeInTheDocument();
    expect(screen.getByText('$24.99')).toBeInTheDocument();
    expect(screen.getByText('Quantity: 2')).toBeInTheDocument();
  });

  it('renders nothing when the product is missing', () => {
    getProduct.mockReturnValue(undefined);
    const { container } = render(<SavedForLaterItem cartItem={cartItem} />);
    expect(container.firstChild).toBeNull();
  });

  it('dispatches TOGGLE_SAVE_FOR_LATER on Move to cart', () => {
    getProduct.mockReturnValue(product);
    render(<SavedForLaterItem cartItem={cartItem} />);

    fireEvent.click(screen.getByRole('button', { name: 'Move to cart' }));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'TOGGLE_SAVE_FOR_LATER',
      productId: 'test-id',
    });
  });

  it('dispatches REMOVE_FROM_CART on Delete', () => {
    getProduct.mockReturnValue(product);
    render(<SavedForLaterItem cartItem={cartItem} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'REMOVE_FROM_CART',
      productId: 'test-id',
    });
  });
});