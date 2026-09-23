import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Spinner from '../../components/Spinner/Spinner';
import {
  DEFAULT_ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_PROGRESS_WIDTHS,
  ORDER_STATUS_STEPS,
} from '../../constants/order';
import { loadOrders } from '../../data/orders';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductsContext';
import { orderService } from '../../services/orderService';
import type { OrderStatus } from '../../types';

interface TrackedItem {
  quantity: number;
  estimatedDeliveryDate: string;
  status?: string;
}

export default function TrackingPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const productId = searchParams.get('productId');
  const { isAuthenticated } = useAuth();
  const { getProduct } = useProducts();
  const [item, setItem] = useState<TrackedItem | null>(null);
  const [loaded, setLoaded] = useState(false);

  const product = productId ? getProduct(productId) : undefined;

  useEffect(() => {
    let cancelled = false;
    setItem(null);
    setLoaded(false);

    if (!orderId || !productId) {
      setLoaded(true);
      return;
    }

    const requestedOrderId = orderId;
    const requestedProductId = productId;

    async function load() {
      try {
        if (isAuthenticated) {
          const order = await orderService.getOrder(requestedOrderId);
          if (cancelled) return;
          const found = order.items.find((i) => i.productId === requestedProductId);
          if (found) {
            setItem({
              quantity: found.quantity,
              estimatedDeliveryDate: found.estimatedDelivery,
              status: found.status,
            });
          }
        } else {
          const order = loadOrders().find((o) => o.id === requestedOrderId);
          if (cancelled) return;
          const found = order?.products.find((p) => p.productId === requestedProductId);
          if (found) {
            setItem({
              quantity: found.quantity,
              estimatedDeliveryDate: found.estimatedDeliveryDate,
              status: found.status,
            });
          }
        }
      } catch {
        // Treat fetch failures as "not found" for the not-found UI.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [orderId, productId, isAuthenticated]);

  const status = (item?.status ?? DEFAULT_ORDER_STATUS) as OrderStatus;
  const progressWidth = ORDER_STATUS_PROGRESS_WIDTHS[status] ?? ORDER_STATUS_PROGRESS_WIDTHS.preparing;

  const mainClass = 'max-w-[850px] mt-[90px] mb-[100px] px-[30px] mx-auto';
  const ordersLinkClass = 'text-[#017cb6] ml-[8px]';

  return (
    <>
      <Header />
      <main className={mainClass}>
        {!loaded ? (
          <Spinner label="Loading tracking…" />
        ) : !item || !product ? (
          <div className="text-center p-[40px] text-[18px]">
            <p>Order or product not found.</p>
            <Link to="/orders" className={ordersLinkClass}>
              ← Back to orders
            </Link>
          </div>
        ) : (
          <>
            <Link
              to="/orders"
              className="inline-block mb-[30px] text-[#017cb6] hover:text-[#c45000]"
            >
              ← View all orders
            </Link>

            <p className="text-[25px] font-bold mb-[10px]">
              {status === 'delivered'
                ? `Delivered on ${item.estimatedDeliveryDate}`
                : `Arriving on ${item.estimatedDeliveryDate}`}
            </p>

            <p className="mb-[3px]">{product.name}</p>
            <p className="mb-[3px]">Quantity: {item.quantity}</p>

            <img
              className="max-w-[150px] max-h-[150px] mt-[25px] mb-[50px] block"
              src={`/${product.image}`}
              alt={product.name}
            />

            <div className="flex justify-between text-[20px] font-medium mb-[15px] max-[575px]:text-[16px] max-[450px]:flex-col max-[450px]:mb-[5px]">
              {ORDER_STATUS_STEPS.map((step) => (
                <span
                  key={step}
                  className={`max-[450px]:mb-[3px] ${
                    status === step ? 'text-[#067d62]' : ''
                  }`}
                >
                  {ORDER_STATUS_LABELS[step]}
                </span>
              ))}
            </div>

            <div className="h-[25px] w-full border border-[#c8c8c8] rounded-[50px] overflow-hidden">
              <div
                className="h-full bg-green-600 rounded-[50px]"
                style={{ width: progressWidth }}
              />
            </div>
          </>
        )}
      </main>
    </>
  );
}