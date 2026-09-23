import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProductCard from './ProductCard';
import type { Product } from '../../types';

const { dispatch } = vi.hoisted(() => ({ dispatch: vi.fn() }));

vi.mock('../../context/CartContext', () => ({
  useCartDispatch: () => dispatch,
}));
vi.mock('../../context/ProductsContext', () => ({
  useProducts: () => ({ getProduct: vi.fn(), products: [], status: 'fallback' }),
}));

const baseProduct: Product = {
  id: 'test-id',
  name: 'Test Product',
  image: 'images/test.png',
  rating: { stars: 4.5, count: 12 },
  priceCents: 1090,
  keywords: ['socks'],
  stock: 3,
};

function renderCard(product: Product) {
  return render(
    <MemoryRouter>
      <ProductCard product={product} />
    </MemoryRouter>
  );
}

describe('ProductCard', () => {
  it('renders the product name, price, and rating', () => {
    renderCard(baseProduct);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$10.90')).toBeInTheDocument();
    expect(screen.getByAltText(/4\.5 out of 5 stars/)).toBeInTheDocument();
  });

  it('links the product to its detail page', () => {
    renderCard(baseProduct);
    const link = screen.getByRole('link', { name: /Test Product/ });
    expect(link).toHaveAttribute('href', '/product/test-id');
  });

  it('shows a low-stock warning when stock is limited', () => {
    renderCard(baseProduct);
    expect(screen.getByText('Only 3 left')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to Cart' })).toBeEnabled();
  });

  it('disables Add to Cart and shows out-of-stock when stock is zero', () => {
    renderCard({ ...baseProduct, stock: 0 });
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to Cart' })).toBeDisabled();
  });

  it('does not show a stock warning when stock is healthy', () => {
    renderCard({ ...baseProduct, stock: 30 });
    expect(screen.queryByText(/left/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to Cart' })).toBeEnabled();
  });

  it('dispatches ADD_TO_CART with the selected quantity', () => {
    renderCard(baseProduct);
    fireEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));
    expect(dispatch).toHaveBeenCalledWith({
      type: 'ADD_TO_CART',
      productId: 'test-id',
      quantity: 1,
    });
  });
});