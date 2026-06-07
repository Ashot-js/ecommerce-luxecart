import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router';
import type { RootState } from '../../store';
import { closeCartDrawer } from '../../store/slices/uiSlice';
import {
  useGetCartQuery, useUpdateCartItemMutation, useRemoveCartItemMutation,
} from '../../store/slices/cartSlice';
import './CartDrawer.scss';

export default function CartDrawer() {
  const dispatch = useDispatch();
  const { data: cartData, isLoading } = useGetCartQuery();
  const [updateItem] = useUpdateCartItemMutation();
  const [removeItem] = useRemoveCartItemMutation();
  const { isAuthenticated } = useSelector((s: RootState) => s.auth);

  const items = cartData?.data ?? [];
  const subtotal = items.reduce((sum, item) => sum + (item.product_price ?? 0) * item.quantity, 0);

  if (!isAuthenticated) {
    dispatch(closeCartDrawer());
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <motion.div
        className="cart-drawer__overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => dispatch(closeCartDrawer())}
      />

      {/* Drawer */}
      <motion.aside
        className="cart-drawer"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.25 }}
      >
        {/* Header */}
        <div className="cart-drawer__header">
          <h3 className="cart-drawer__title">
            <ShoppingBag size={20} />
            Cart ({items.length})
          </h3>
          <button className="cart-drawer__close" onClick={() => dispatch(closeCartDrawer())}>
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="cart-drawer__items">
          {isLoading ? (
            <div className="cart-drawer__empty">
              <p>Loading...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="cart-drawer__empty">
              <ShoppingBag size={48} className="cart-drawer__empty-icon" />
              <p className="cart-drawer__empty-text">Your cart is empty</p>
              <Link
                to="/products"
                className="cart-drawer__shop-btn"
                onClick={() => dispatch(closeCartDrawer())}
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="cart-drawer__item">
                <img
                  src={item.product_image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}
                  alt={item.product_name}
                  className="cart-drawer__item-image"
                />
                <div className="cart-drawer__item-info">
                  <p className="cart-drawer__item-name">{item.product_name}</p>
                  <p className="cart-drawer__item-price">
                    ${((item.product_price ?? 0) * item.quantity).toFixed(2)}
                  </p>
                  <div className="cart-drawer__item-qty">
                    <button
                      onClick={() => updateItem({ itemId: item.id, quantity: item.quantity - 1 })}
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => updateItem({ itemId: item.id, quantity: item.quantity + 1 })}
                      disabled={item.quantity >= (item.product_stock ?? 99)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <button
                  className="cart-drawer__item-remove"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="cart-drawer__footer">
            <div className="cart-drawer__subtotal">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <p className="cart-drawer__shipping-note">
              {subtotal >= 100 ? 'Free shipping!' : `Add $${(100 - subtotal).toFixed(2)} for free shipping`}
            </p>
            <Link
              to="/checkout"
              className="cart-drawer__checkout-btn"
              onClick={() => dispatch(closeCartDrawer())}
            >
              Proceed to Checkout
            </Link>
            <button
              className="cart-drawer__continue-btn"
              onClick={() => dispatch(closeCartDrawer())}
            >
              Continue Shopping
            </button>
          </div>
        )}
      </motion.aside>
    </>
  );
}
