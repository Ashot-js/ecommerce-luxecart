import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'framer-motion';
import { CreditCard, Shield, Truck } from 'lucide-react';
import { toast } from 'react-toastify';
import { useGetCartQuery } from '../store/slices/cartSlice';
import { useCreateOrderMutation } from '../store/api/ordersApi';
import type { ShippingInfo } from '../types';
import './Checkout.scss';

export default function Checkout() {
  const navigate = useNavigate();
  const { data: cartData } = useGetCartQuery();
  const [createOrder, { isLoading }] = useCreateOrderMutation();
  const items = cartData?.data ?? [];

  const [form, setForm] = useState<ShippingInfo>({
    shipping_name: '',
    shipping_email: '',
    shipping_phone: '',
    shipping_line1: '',
    shipping_line2: '',
    shipping_city: '',
    shipping_state: '',
    shipping_zip: '',
    shipping_country: 'US',
    notes: '',
  });

  const subtotal = items.reduce((s, i) => s + (i.product_price ?? 0) * i.quantity, 0);
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const shipping = subtotal >= 100 ? 0 : 9.99;
  const total = Math.round((subtotal + tax + shipping) * 100) / 100;

  const update = (field: keyof ShippingInfo, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shipping_name || !form.shipping_email || !form.shipping_line1 ||
        !form.shipping_city || !form.shipping_state || !form.shipping_zip) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      const result = await createOrder(form).unwrap();
      toast.success('Order placed successfully!');
      navigate(`/orders/${result.data.id}`);
    } catch (err: any) {
      toast.error(err?.data?.error || 'Failed to place order');
    }
  };

  if (items.length === 0) {
    return (
      <div className="checkout">
        <div className="container">
          <div className="checkout__empty">
            <h2>Your cart is empty</h2>
            <p>Add items to your cart before checking out.</p>
            <Link to="/products" className="checkout__shop-btn">Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout">
      <div className="container">
        <h1 className="checkout__title">Checkout</h1>
        <div className="divider-accent" />

        <motion.form
          className="checkout__grid"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Shipping Form */}
          <div className="checkout__form">
            <h2 className="checkout__section-title">Shipping Information</h2>

            <div className="checkout__row">
              <label className="checkout__field">
                <span>Full Name *</span>
                <input type="text" value={form.shipping_name} onChange={(e) => update('shipping_name', e.target.value)} required />
              </label>
              <label className="checkout__field">
                <span>Email *</span>
                <input type="email" value={form.shipping_email} onChange={(e) => update('shipping_email', e.target.value)} required />
              </label>
            </div>

            <label className="checkout__field">
              <span>Phone (optional)</span>
              <input type="tel" value={form.shipping_phone} onChange={(e) => update('shipping_phone', e.target.value)} />
            </label>

            <label className="checkout__field">
              <span>Address Line 1 *</span>
              <input type="text" value={form.shipping_line1} onChange={(e) => update('shipping_line1', e.target.value)} required />
            </label>

            <label className="checkout__field">
              <span>Address Line 2 (optional)</span>
              <input type="text" value={form.shipping_line2} onChange={(e) => update('shipping_line2', e.target.value)} />
            </label>

            <div className="checkout__row checkout__row--3">
              <label className="checkout__field">
                <span>City *</span>
                <input type="text" value={form.shipping_city} onChange={(e) => update('shipping_city', e.target.value)} required />
              </label>
              <label className="checkout__field">
                <span>State *</span>
                <input type="text" value={form.shipping_state} onChange={(e) => update('shipping_state', e.target.value)} required />
              </label>
              <label className="checkout__field">
                <span>ZIP Code *</span>
                <input type="text" value={form.shipping_zip} onChange={(e) => update('shipping_zip', e.target.value)} required />
              </label>
            </div>

            <label className="checkout__field">
              <span>Notes (optional)</span>
              <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={2} />
            </label>
          </div>

          {/* Order Summary */}
          <div className="checkout__summary">
            <h2 className="checkout__section-title">Order Summary</h2>

            <div className="checkout__items">
              {items.map((item) => (
                <div key={item.id} className="checkout__item">
                  <img
                    src={item.product_image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'}
                    alt={item.product_name}
                    className="checkout__item-img"
                  />
                  <div className="checkout__item-info">
                    <p className="checkout__item-name">{item.product_name}</p>
                    <p className="checkout__item-meta">Qty: {item.quantity}</p>
                  </div>
                  <p className="checkout__item-price">${((item.product_price ?? 0) * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <div className="checkout__totals">
              <div className="checkout__total-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="checkout__total-row">
                <span>Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="checkout__total-row">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="checkout__total-row checkout__total-row--grand">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <button type="submit" className="checkout__submit" disabled={isLoading}>
              <CreditCard size={18} />
              {isLoading ? 'Placing Order...' : 'Place Order'}
            </button>

            <div className="checkout__guarantees">
              <span><Shield size={14} /> Secure Checkout</span>
              <span><Truck size={14} /> {shipping === 0 ? 'Free Shipping' : 'Shipping: $9.99'}</span>
            </div>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
