import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingBag, User, Menu, X, LogOut, Package, Settings,
} from 'lucide-react';
import type { RootState } from '../../store';
import { logout } from '../../store/slices/authSlice';
import {
  toggleMobileMenu, closeMobileMenu, setSearchQuery,
  openCartDrawer,
} from '../../store/slices/uiSlice';
import { useGetCartCountQuery } from '../../store/slices/cartSlice';
import './Header.scss';

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((s: RootState) => s.auth);
  const { isMobileMenuOpen, searchQuery } = useSelector((s: RootState) => s.ui);
  const { data: cartCount } = useGetCartCountQuery(undefined, { skip: !isAuthenticated });
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      dispatch(closeMobileMenu());
    }
  }, [searchQuery, navigate, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    setShowUserMenu(false);
    navigate('/');
  };

  const cartItemCount = cartCount?.count ?? 0;

  return (
    <header className={`header${scrolled ? ' header--scrolled' : ''}`}>
      <div className="header__inner container">
        {/* Logo */}
        <Link to="/" className="header__logo" onClick={() => dispatch(closeMobileMenu())}>
          <span className="header__logo-text">Luxe</span>
          <span className="header__logo-accent">Cart</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="header__nav">
          <Link to="/" className="header__nav-link">Home</Link>
          <Link to="/products" className="header__nav-link">Shop</Link>
          <Link to="/products?featured=true" className="header__nav-link">Featured</Link>
          {isAuthenticated && user?.role === 'admin' && (
            <Link to="/admin" className="header__nav-link header__nav-link--admin">Admin</Link>
          )}
        </nav>

        {/* Search bar */}
        <form className="header__search" onSubmit={handleSearch}>
          <Search size={18} className="header__search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            className="header__search-input"
          />
        </form>

        {/* Actions */}
        <div className="header__actions">
          {/* Cart */}
          <button
            className="header__action-btn"
            onClick={() => isAuthenticated ? dispatch(openCartDrawer()) : navigate('/login')}
            aria-label="Shopping cart"
          >
            <ShoppingBag size={22} />
            {cartItemCount > 0 && (
              <span className="header__cart-badge">{cartItemCount > 99 ? '99+' : cartItemCount}</span>
            )}
          </button>

          {/* User menu */}
          {isAuthenticated ? (
            <div className="header__user-menu">
              <button
                className="header__action-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-label="User menu"
              >
                <User size={22} />
              </button>
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    className="header__dropdown"
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="header__dropdown-header">
                      <p className="header__dropdown-name">{user?.first_name} {user?.last_name}</p>
                      <p className="header__dropdown-email">{user?.email}</p>
                    </div>
                    <div className="header__dropdown-divider" />
                    <Link to="/profile" className="header__dropdown-item" onClick={() => setShowUserMenu(false)}>
                      <User size={16} /> Profile
                    </Link>
                    <Link to="/orders" className="header__dropdown-item" onClick={() => setShowUserMenu(false)}>
                      <Package size={16} /> Orders
                    </Link>
                    {user?.role === 'admin' && (
                      <Link to="/admin" className="header__dropdown-item" onClick={() => setShowUserMenu(false)}>
                        <Settings size={16} /> Admin Panel
                      </Link>
                    )}
                    <div className="header__dropdown-divider" />
                    <button className="header__dropdown-item header__dropdown-item--danger" onClick={handleLogout}>
                      <LogOut size={16} /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link to="/login" className="header__action-btn" aria-label="Sign in">
              <User size={22} />
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            className="header__mobile-toggle"
            onClick={() => dispatch(toggleMobileMenu())}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="header__mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <nav className="header__mobile-nav">
              <Link to="/" className="header__mobile-link" onClick={() => dispatch(closeMobileMenu())}>Home</Link>
              <Link to="/products" className="header__mobile-link" onClick={() => dispatch(closeMobileMenu())}>Shop</Link>
              <Link to="/products?featured=true" className="header__mobile-link" onClick={() => dispatch(closeMobileMenu())}>Featured</Link>
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="header__mobile-link" onClick={() => dispatch(closeMobileMenu())}>Profile</Link>
                  <Link to="/orders" className="header__mobile-link" onClick={() => dispatch(closeMobileMenu())}>Orders</Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="header__mobile-link" onClick={() => dispatch(closeMobileMenu())}>Admin</Link>
                  )}
                  <button className="header__mobile-link header__mobile-link--logout" onClick={handleLogout}>
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="header__mobile-link" onClick={() => dispatch(closeMobileMenu())}>Sign In</Link>
                  <Link to="/register" className="header__mobile-link" onClick={() => dispatch(closeMobileMenu())}>Create Account</Link>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
