import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import CartItem from '../../components/CartItem/CartItem';
import PaymentSummary from '../../components/PaymentSummary/PaymentSummary';

export default function CheckoutPage() {
  const { cart, cartQuantity } = useCart();

  return (
    <>
      <header className="h-[60px] px-[30px] bg-white flex justify-center fixed top-0 left-0 right-0 z-[1000] border-b border-[#dedede]">
        <div className="w-full max-w-[1100px] flex items-center">
          <div className="w-[150px]">
            <Link to="/">
              <img
                className="w-[100px] mt-[12px]"
                src="/images/amazon-logo.png"
                alt="Amazon"
              />
            </Link>
          </div>
          <div className="flex-1 text-[25px] font-medium flex justify-center max-[1000px]:text-[20px] max-[1000px]:mr-[60px] max-[575px]:mr-[5px]">
            <span>
              Checkout (
              <Link
                to="/"
                className="text-[#007185] text-[23px] cursor-pointer max-[1000px]:text-[18px]"
              >
                {cartQuantity} items
              </Link>
              )
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-[1100px] px-[30px] mt-[140px] mb-[100px] mx-auto max-[1000px]:max-w-[500px]">
        <h1 className="font-bold text-[22px] mb-[18px]">Shopping Cart</h1>

        {cart.length === 0 ? (
          <div className="text-center p-[40px] text-[18px]">
            <p>Your cart is empty.</p>
            <Link to="/" className="text-[#017cb6] ml-[8px] hover:text-[#c45000]">
              Continue shopping →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-[1fr_350px] gap-x-[12px] items-start max-[1000px]:grid-cols-1">
            <div>
              {cart.map((item) => (
                <CartItem key={item.productId} cartItem={item} />
              ))}
            </div>
            <PaymentSummary />
          </div>
        )}
      </main>
    </>
  );
}
