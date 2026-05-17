import { Link, useSearchParams } from 'react-router-dom';
import Header from '../../components/Header/Header';
import {
  DEFAULT_ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_PROGRESS_WIDTHS,
  ORDER_STATUS_STEPS,
} from '../../constants/order';
import { loadOrders } from '../../data/orders';
import { getProduct } from '../../data/products';
import type { OrderStatus } from '../../types';

export default function TrackingPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const productId = searchParams.get('productId');

  const orders = loadOrders();
  const order = orders.find((o) => o.id === orderId);
  const orderProduct = order?.products.find((p) => p.productId === productId);
  const product = productId ? getProduct(productId) : undefined;

  const mainClass = 'max-w-[850px] mt-[90px] mb-[100px] px-[30px] mx-auto';
  const ordersLinkClass = 'text-[#017cb6] ml-[8px]';

  if (!order || !orderProduct || !product) {
    return (
      <>
        <Header />
        <main className={mainClass}>
          <div className="text-center p-[40px] text-[18px]">
            <p>Order or product not found.</p>
            <Link to="/orders" className={ordersLinkClass}>
              ← Back to orders
            </Link>
          </div>
        </main>
      </>
    );
  }

  const status = (orderProduct.status ?? DEFAULT_ORDER_STATUS) as OrderStatus;
  const progressWidth = ORDER_STATUS_PROGRESS_WIDTHS[status] ?? ORDER_STATUS_PROGRESS_WIDTHS.preparing;

  return (
    <>
      <Header />
      <main className={mainClass}>
        <Link
          to="/orders"
          className="inline-block mb-[30px] text-[#017cb6] hover:text-[#c45000]"
        >
          ← View all orders
        </Link>

        <p className="text-[25px] font-bold mb-[10px]">
          {status === 'delivered'
            ? `Delivered on ${orderProduct.estimatedDeliveryDate}`
            : `Arriving on ${orderProduct.estimatedDeliveryDate}`}
        </p>

        <p className="mb-[3px]">{product.name}</p>
        <p className="mb-[3px]">Quantity: {orderProduct.quantity}</p>

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
      </main>
    </>
  );
}
