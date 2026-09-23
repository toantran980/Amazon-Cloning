import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ProductsProvider } from './context/ProductsContext';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import RouteLoader from './components/RouteLoader/RouteLoader';
import DemoModeBanner from './components/DemoModeBanner/DemoModeBanner';

const AmazonPage = lazy(() => import('./pages/Amazon/AmazonPage'));
const CheckoutPage = lazy(() => import('./pages/Checkout/CheckoutPage'));
const OrdersPage = lazy(() => import('./pages/Orders/OrdersPage'));
const TrackingPage = lazy(() => import('./pages/Tracking/TrackingPage'));
const LoginPage = lazy(() => import('./pages/Login/LoginPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetail/ProductDetailPage'));

export default function App() {
  return (
    <ErrorBoundary>
      <ProductsProvider>
        <AuthProvider>
          <CartProvider>
            <DemoModeBanner />
            <BrowserRouter>
              <Suspense fallback={<RouteLoader />}>
                <Routes>
                  <Route path="/" element={<AmazonPage />} />
                  <Route path="/product/:id" element={<ProductDetailPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/tracking" element={<TrackingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </ProductsProvider>
    </ErrorBoundary>
  );
}
