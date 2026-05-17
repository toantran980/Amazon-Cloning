import React, { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import Header from '../../components/Header/Header';
import { loadOrders } from '../../data/orders';
import { getProduct } from '../../data/products';
import { useCartDispatch } from '../../context/CartContext';
import { formatCurrency } from '../../utils/money';

export default function OrdersPage() {
  const orders = useMemo(() => loadOrders(), []);
  const dispatch = useCartDispatch();

  const handleBuyAgain = useCallback(
    (productId: string) => {
      dispatch({
        type: 'ADD_TO_CART',
        productId,
        quantity: 1,
      });
    },
    [dispatch]
  );

  const shopLinkClass = 'text-[#017cb6] ml-[8px] hover:text-[#c45000]';
  const amazonButtonClass =
    'text-[#212121] bg-[#ffd814] border border-[#fcd200] cursor-pointer shadow-[0_2px_5px_rgba(213,217,217,0.5)] hover:bg-[#f7ca00]';

  return (
    <>
      <Header />
      <main className="max-w-[850px] mt-[90px] mb-[100px] px-[20px] mx-auto">
        <h1 className="font-bold text-[26px] mb-[25px]">Your Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center p-[40px] text-[18px]">
            <p>You have no orders yet.</p>
            <Link to="/" className={shopLinkClass}>Start shopping →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-y-[50px]">
            {orders.map((order) => (
              <div key={order.id}>
                {/* Order header */}
                <div className="bg-[#f0f2f2] border border-[#d5d9d9] flex items-center justify-between px-[25px] py-[20px] rounded-t-[8px] max-[575px]:flex-col max-[575px]:items-start max-[575px]:leading-[23px] max-[575px]:p-[15px]">
                  <div className="flex shrink-0 max-[575px]:flex-col">
                    <div className="mr-[45px] max-[575px]:grid max-[575px]:grid-cols-[auto_1fr] max-[575px]:mr-0">
                      <span className="font-medium">Order Placed: </span>
                      <span>{dayjs(order.orderDate).format('MMMM D, YYYY')}</span>
                    </div>
                    <div className="mr-[45px] max-[575px]:grid max-[575px]:grid-cols-[auto_1fr] max-[575px]:mr-0">
                      <span className="font-medium">Total: </span>
                      <span>${formatCurrency(order.totalCents)}</span>
                    </div>
                  </div>
                  <div className="shrink max-[575px]:grid max-[575px]:grid-cols-[auto_1fr]">
                    <span className="font-medium">Order ID: </span>
                    <span>{order.id}</span>
                  </div>
                </div>

                {/* Order products */}
                <div className="px-[25px] py-[40px] border border-[#d5d9d9] border-t-0 rounded-b-[8px] grid grid-cols-[110px_1fr_220px] gap-x-[35px] gap-y-[60px] items-center max-[800px]:grid-cols-[110px_1fr] max-[800px]:gap-y-0 max-[800px]:pb-[8px] max-[450px]:grid-cols-1">
                  {order.products.map((orderProduct) => {
                    const product = getProduct(orderProduct.productId);
                    if (!product) return null;
                    return (
                      <React.Fragment key={orderProduct.productId}>
                        <div className="text-center max-[450px]:mb-[25px]">
                          <img
                            className="max-w-[110px] max-h-[110px] max-[450px]:max-w-[150px] max-[450px]:max-h-[150px] inline-block"
                            src={`/${product.image}`}
                            alt={product.name}
                          />
                        </div>

                        <div>
                          <p className="font-bold mb-[5px] max-[450px]:mb-[10px]">{product.name}</p>
                          <p className="mb-[3px]">Arriving: {orderProduct.estimatedDeliveryDate}</p>
                          <p className="mb-[8px] max-[450px]:mb-[15px]">
                            Quantity: {orderProduct.quantity}
                          </p>
                          <button
                            className={`text-[15px] w-[140px] h-[36px] rounded-[8px] flex items-center justify-center mb-[10px] max-[450px]:w-full max-[450px]:mb-[15px] ${amazonButtonClass}`}
                            onClick={() => handleBuyAgain(product.id)}
                          >
                            <img
                              className="w-[25px] mr-[15px]"
                              src="/images/icons/buy-again.png"
                              alt=""
                            />
                            Buy it again
                          </button>
                        </div>

                        <div className="self-start max-[800px]:col-start-2 max-[800px]:mb-[30px] max-[450px]:col-auto max-[450px]:mb-[70px]">
                          <Link
                            className={`w-full text-[15px] p-[8px] bg-white border border-[#d5d9d9] rounded-[8px] cursor-pointer shadow-[0_2px_5px_rgba(213,217,217,0.5)] text-center block text-[#212121] hover:bg-[#f7fafa] max-[800px]:w-[140px] max-[450px]:w-full max-[450px]:p-[12px]`}
                            to={`/tracking?orderId=${order.id}&productId=${orderProduct.productId}`}
                          >
                            Track package
                          </Link>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
