import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import RouteLoader from './components/RouteLoader/RouteLoader';

const AmazonPage = lazy(() => import('./pages/Amazon/AmazonPage'));
const CheckoutPage = lazy(() => import('./pages/Checkout/CheckoutPage'));
const OrdersPage = lazy(() => import('./pages/Orders/OrdersPage'));
const TrackingPage = lazy(() => import('./pages/Tracking/TrackingPage'));

export default function App() {
  return (
    <ErrorBoundary>
      <CartProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteLoader />}>
            <Routes>
              <Route path="/" element={<AmazonPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/tracking" element={<TrackingPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </CartProvider>
    </ErrorBoundary>
  );
}
