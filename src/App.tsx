import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import RouteLoader from './components/RouteLoader/RouteLoader';

const AmazonPage = lazy(() => import('./pages/Amazon/AmazonPage'));
const CheckoutPage = lazy(() => import('./pages/Checkout/CheckoutPage'));
const OrdersPage = lazy(() => import('./pages/Orders/OrdersPage'));
const TrackingPage = lazy(() => import('./pages/Tracking/TrackingPage'));
const LoginPage = lazy(() => import('./pages/Login/LoginPage'));

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                <Route path="/" element={<AmazonPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/tracking" element={<TrackingPage />} />
                <Route path="/login" element={<LoginPage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
