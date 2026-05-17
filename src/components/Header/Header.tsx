import { memo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

function Header({ onSearch }: HeaderProps) {
  const { cartQuantity } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  function handleSearch() {
    onSearch?.(searchQuery);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSearch();
  }

  return (
    <header className="bg-(--amazon-header-bg) text-white px-[15px] flex items-center justify-between fixed top-0 left-0 right-0 h-[60px] z-[1000]">
      <div className="w-[180px] max-[800px]:w-auto">
        <Link
          to="/"
          className="inline-block p-[6px] rounded-sm cursor-pointer text-white border border-transparent hover:border-white"
        >
          <img
            className="w-[100px] mt-[5px] max-[575px]:hidden"
            src="/images/amazon-logo-white.png"
            alt="Amazon"
          />
          <img
            className="hidden max-[575px]:block h-[35px] mt-[5px]"
            src="/images/amazon-mobile-logo-white.png"
            alt="Amazon"
          />
        </Link>
      </div>

      {onSearch !== undefined && (
        <div className="flex-1 max-w-[850px] mx-[10px] flex">
          <input
            className="flex-1 w-0 text-[16px] h-[38px] pl-[15px] border-none rounded-l-[4px] rounded-r-none outline-none"
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearch(e.target.value);
            }}
            onKeyDown={handleKeyDown}
          />
          <button
            className="bg-[#febd69] border-none w-[45px] h-[40px] rounded-r-[4px] rounded-l-none shrink-0 cursor-pointer"
            aria-label="Search"
            onClick={handleSearch}
          >
            <img
              className="h-[22px] ml-[2px] mt-[3px]"
              src="/images/icons/search-icon.png"
              alt="Search"
            />
          </button>
        </div>
      )}

      <div className="w-[180px] shrink-0 flex justify-end">
        {isAuthenticated ? (
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="inline-block p-[6px] rounded-sm cursor-pointer text-white border border-transparent hover:border-white text-left"
          >
            <span className="block text-[13px]">Hello, {user?.email.split('@')[0]}</span>
            <span className="block text-[15px] font-bold">Sign Out</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="inline-block p-[6px] rounded-sm cursor-pointer text-white border border-transparent hover:border-white"
          >
            <span className="block text-[13px]">Hello, sign in</span>
            <span className="block text-[15px] font-bold">Account</span>
          </Link>
        )}

        <Link
          to="/orders"
          className="inline-block p-[6px] rounded-sm cursor-pointer text-white border border-transparent hover:border-white"
        >
          <span className="block text-[13px]">Returns</span>
          <span className="block text-[15px] font-bold">&amp; Orders</span>
        </Link>

        <Link to="/checkout" aria-label={`Cart, ${cartQuantity} item${cartQuantity !== 1 ? 's' : ''}`} className="text-white flex items-center relative">
          <img
            className="w-[50px]"
            src="/images/icons/cart-icon.png"
            alt="Cart"
          />
          <div className="text-[#f08804] text-[16px] font-bold absolute top-[4px] left-[22px] w-[26px] text-center">
            {cartQuantity}
          </div>
          <div className="mt-[12px] text-[15px] font-bold">Cart</div>
        </Link>
      </div>
    </header>
  );
}

export default memo(Header);
