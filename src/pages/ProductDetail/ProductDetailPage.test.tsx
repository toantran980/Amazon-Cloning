import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProductDetailPage from './ProductDetailPage';
import type { Product } from '../../types';

const { dispatch } = vi.hoisted(() => ({ dispatch: vi.fn() }));
const { getProduct } = vi.hoisted(() => ({ getProduct: vi.fn() }));

vi.mock('../../context/ProductsContext', () => ({
  useProducts: () => ({ getProduct, products: [], status: 'fallback' }),
}));
vi.mock('../../context/CartContext', () => ({
  useCartDispatch: () => dispatch,
  useCart: () => ({ cart: [], cartQuantity: 0, dispatch }),
}));
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    token: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

const inStockProduct: Product = {
  id: 'test-id',
  name: 'Detailed Test Product',
  image: 'images/test.png',
  rating: { stars: 4.5, count: 12 },
  priceCents: 1090,
  keywords: ['socks', 'crew'],
  stock: 3,
};

function renderDetail(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/product/${id}`]}>
      <Routes>
        <Route path="/product/:id" element={<ProductDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProductDetailPage', () => {
  it('renders product details with a low-stock badge', () => {
    getProduct.mockReturnValue(inStockProduct);
    renderDetail('test-id');

    expect(screen.getByText('Detailed Test Product')).toBeInTheDocument();
    expect(screen.getByText('$10.90')).toBeInTheDocument();
    expect(screen.getByText('Only 3 left in stock')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to Cart' })).toBeEnabled();
  });

  it('shows out-of-stock state and disables the button', () => {
    getProduct.mockReturnValue({ ...inStockProduct, stock: 0 });
    renderDetail('test-id');

    expect(screen.getByText('Currently out of stock')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to Cart' })).toBeDisabled();
    expect(screen.getByLabelText('Quantity')).toBeDisabled();
  });

  it('dispatches ADD_TO_CART with the selected quantity', () => {
    getProduct.mockReturnValue(inStockProduct);
    renderDetail('test-id');

    fireEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'ADD_TO_CART',
      productId: 'test-id',
      quantity: 1,
    });
  });

  it('shows the not-found state for an unknown id', () => {
    getProduct.mockReturnValue(undefined);
    renderDetail('missing-id');

    expect(screen.getByText('Product not found.')).toBeInTheDocument();
  });
});