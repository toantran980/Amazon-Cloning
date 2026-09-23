import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import CartItem from '../../components/CartItem/CartItem';
import SavedForLaterItem from '../../components/SavedForLaterItem/SavedForLaterItem';
import PaymentSummary from '../../components/PaymentSummary/PaymentSummary';

export default function CheckoutPage() {
  const { cart, cartQuantity } = useCart();

  const activeCart = cart.filter((item) => !item.savedForLater);
  const savedItems = cart.filter((item) => item.savedForLater);

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
              <p className="font-bold mb-[10px]">Your items</p>
              {activeCart.length === 0 && !savedItems.length ? null : (
                <div className="mb-[40px]">
                  {activeCart.length === 0 ? (
                    <p className="text-[#787878] mb-[12px]">
                      You have no items in your cart right now.
                    </p>
                  ) : null}
                  <div className="flex flex-col gap-y-[35px] mb-[20px]">
                    {activeCart.map((item) => (
                      <CartItem key={item.productId} cartItem={item} />
                    ))}
                  </div>
                </div>
              )}

              {savedItems.length > 0 && (
                <div className="border-t border-[#e7e7e7] pt-[30px]">
                  <h2 className="font-bold text-[20px] mb-[15px]">Saved for later</h2>
                  <p className="text-[14px] text-[#787878] mb-[20px]">
                    {savedItems.length} {savedItems.length === 1 ? 'item' : 'items'} saved — move
                    them back to your cart when you're ready to buy.
                  </p>
                  <div className="flex flex-col gap-y-[20px]">
                    {savedItems.map((item) => (
                      <SavedForLaterItem key={item.productId} cartItem={item} />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <PaymentSummary />
          </div>
        )}
      </main>
    </>
  );
}