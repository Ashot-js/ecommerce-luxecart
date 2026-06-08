import { Link } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ShieldCheck } from 'lucide-react';
import {
  useGetCartQuery,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
} from '../store/slices/cartSlice';
import { TAX_RATE, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '../constants';
import './Cart.scss';

const Cart = () => {
  const { data, isLoading, isError } = useGetCartQuery();
  const [updateCartItem] = useUpdateCartItemMutation();
  const [removeCartItem] = useRemoveCartItemMutation();

  const items = data?.data ?? [];

  const subtotal = items.reduce(
    (sum, item) => sum + (item.product_price ?? 0) * item.quantity,
    0
  );
  const tax = subtotal * TAX_RATE;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_COST;
  const total = subtotal + tax + shipping;

  const handleQuantityChange = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    try {
      await updateCartItem({ itemId, quantity: newQty }).unwrap();
    } catch {
      // Silently fail — RTK Query will handle cache invalidation
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await removeCartItem(itemId).unwrap();
    } catch {
      // Silently fail
    }
  };

  // ---- Empty State ----
  if (!isLoading && (!items || items.length === 0)) {
    return (
      <div className="cart">
        <div className="cart__container">
          <motion.div
            className="cart__empty"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ShoppingBag size={64} strokeWidth={1} className="cart__empty-icon" />
            <h2 className="cart__empty-heading">Your cart is empty</h2>
            <p className="cart__empty-text">
              Looks like you haven&apos;t added anything to your cart yet.
            </p>
            <Link to="/products" className="cart__empty-cta">
              Continue Shopping
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart">
      <div className="cart__container">
        <motion.div
          className="cart__main"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="cart__header">
            <h1 className="cart__heading">Shopping Cart</h1>
            <span className="cart__count">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {isLoading && (
            <div className="cart__loading">Loading cart…</div>
          )}

          {isError && (
            <div className="cart__error">
              Failed to load cart. Please try again.
            </div>
          )}

          {!isLoading && !isError && (
            <div className="cart__table-wrapper">
              <table className="cart__table">
                <thead>
                  <tr className="cart__table-head-row">
                    <th className="cart__th cart__th--product">Product</th>
                    <th className="cart__th cart__th--price">Price</th>
                    <th className="cart__th cart__th--quantity">Quantity</th>
                    <th className="cart__th cart__th--total">Total</th>
                    <th className="cart__th cart__th--actions" />
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.tr
                        key={item.id}
                        className="cart__row"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <td className="cart__td cart__td--product">
                          <div className="cart__product">
                            <div className="cart__product-img">
                              {item.product_image_url ? (
                                <img
                                  src={item.product_image_url}
                                  alt={item.product_name ?? ''}
                                  loading="lazy"
                                  decoding="async"
                                />
                              ) : (
                                <ShoppingBag size={24} />
                              )}
                            </div>
                            <span className="cart__product-name">
                              {item.product_name ?? 'Unknown Product'}
                            </span>
                          </div>
                        </td>
                        <td className="cart__td cart__td--price">
                          ${(item.product_price ?? 0).toFixed(2)}
                        </td>
                        <td className="cart__td cart__td--quantity">
                          <div className="cart__qty">
                            <button
                              type="button"
                              className="cart__qty-btn"
                              onClick={() =>
                                handleQuantityChange(item.id, item.quantity - 1)
                              }
                              disabled={item.quantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="cart__qty-value">{item.quantity}</span>
                            <button
                              type="button"
                              className="cart__qty-btn"
                              onClick={() =>
                                handleQuantityChange(item.id, item.quantity + 1)
                              }
                              disabled={item.quantity >= (item.product_stock ?? 99)}
                              aria-label="Increase quantity"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </td>
                        <td className="cart__td cart__td--total">
                          <span className="cart__line-total">
                            ${((item.product_price ?? 0) * item.quantity).toFixed(2)}
                          </span>
                        </td>
                        <td className="cart__td cart__td--actions">
                          <button
                            type="button"
                            className="cart__remove-btn"
                            onClick={() => handleRemove(item.id)}
                            aria-label={`Remove ${item.product_name ?? 'item'}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}

          <div className="cart__bottom-nav">
            <Link to="/products" className="cart__continue-link">
              <ArrowLeft size={16} />
              Continue Shopping
            </Link>
          </div>
        </motion.div>

        {/* ---- Summary Sidebar ---- */}
        <motion.aside
          className="cart__summary"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <h2 className="cart__summary-heading">Order Summary</h2>

          <div className="cart__summary-lines">
            <div className="cart__summary-line">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="cart__summary-line">
              <span>Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="cart__summary-line">
              <span>Shipping</span>
              <span>
                {shipping === 0 ? (
                  <span className="cart__free-shipping">Free</span>
                ) : (
                  `$${shipping.toFixed(2)}`
                )}
              </span>
            </div>
            {subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD && (
              <p className="cart__shipping-hint">
                Add ${(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)} more for free shipping
              </p>
            )}
          </div>

          <div className="cart__summary-divider" />

          <div className="cart__summary-line cart__summary-line--total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <Link to="/checkout" className="cart__checkout-btn">
            <ShieldCheck size={18} />
            Proceed to Checkout
          </Link>
        </motion.aside>
      </div>
    </div>
  );
};

export default Cart;
