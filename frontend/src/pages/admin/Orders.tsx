import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import type { Order, OrderStatus } from '../../types';
import './Orders.scss';

const MOCK_ORDERS: Order[] = [
  { id: 'ord-001-a1b2', user_id: 'u1', status: 'delivered', total: 379.97, subtotal: 339.98, tax: 27.20, shipping_cost: 0, shipping_name: 'John Doe', shipping_email: 'john@example.com', shipping_phone: null, shipping_line1: '123 Main St', shipping_line2: null, shipping_city: 'New York', shipping_state: 'NY', shipping_zip: '10001', shipping_country: 'US', notes: null, created_at: '2026-06-01T10:00:00Z', updated_at: '2026-06-03T14:00:00Z', items: [{ id: 'oi1', order_id: 'o1', product_id: '1', name: 'Wireless Headphones', price: 249.99, quantity: 1, image_url: null, created_at: '' }, { id: 'oi2', order_id: 'o1', product_id: '3', name: 'Coffee Set', price: 44.99, quantity: 2, image_url: null, created_at: '' }] },
  { id: 'ord-002-c3d4', user_id: 'u2', status: 'processing', total: 94.98, subtotal: 89.99, tax: 7.20, shipping_cost: 9.99, shipping_name: 'Jane Smith', shipping_email: 'jane@example.com', shipping_phone: null, shipping_line1: '456 Oak Ave', shipping_line2: 'Apt 2', shipping_city: 'Los Angeles', shipping_state: 'CA', shipping_zip: '90001', shipping_country: 'US', notes: null, created_at: '2026-06-04T08:00:00Z', updated_at: '2026-06-04T09:00:00Z', items: [{ id: 'oi3', order_id: 'o2', product_id: '2', name: 'Merino Sweater', price: 89.99, quantity: 1, image_url: null, created_at: '' }] },
  { id: 'ord-003-e5f6', user_id: 'u3', status: 'shipped', total: 259.98, subtotal: 249.99, tax: 20.00, shipping_cost: 0, shipping_name: 'Bob Wilson', shipping_email: 'bob@example.com', shipping_phone: null, shipping_line1: '789 Pine Rd', shipping_line2: null, shipping_city: 'Chicago', shipping_state: 'IL', shipping_zip: '60601', shipping_country: 'US', notes: 'Ring doorbell', created_at: '2026-06-02T15:00:00Z', updated_at: '2026-06-03T10:00:00Z', items: [{ id: 'oi4', order_id: 'o3', product_id: '1', name: 'Wireless Headphones', price: 249.99, quantity: 1, image_url: null, created_at: '' }] },
  { id: 'ord-004-g7h8', user_id: 'u4', status: 'pending', total: 308.97, subtotal: 289.98, tax: 23.20, shipping_cost: 0, shipping_name: 'Alice Brown', shipping_email: 'alice@example.com', shipping_phone: null, shipping_line1: '321 Elm St', shipping_line2: null, shipping_city: 'Houston', shipping_state: 'TX', shipping_zip: '77001', shipping_country: 'US', notes: null, created_at: '2026-06-05T12:00:00Z', updated_at: '2026-06-05T12:00:00Z', items: [{ id: 'oi5', order_id: 'o4', product_id: '4', name: 'Running Shoes', price: 129.99, quantity: 2, image_url: null, created_at: '' }, { id: 'oi6', order_id: 'o4', product_id: '8', name: 'Yoga Mat', price: 68.99, quantity: 1, image_url: null, created_at: '' }] },
  { id: 'ord-005-i9j0', user_id: 'u5', status: 'cancelled', total: 159.99, subtotal: 159.99, tax: 12.80, shipping_cost: 0, shipping_name: 'Tom Green', shipping_email: 'tom@example.com', shipping_phone: null, shipping_line1: '555 Maple Dr', shipping_line2: null, shipping_city: 'Miami', shipping_state: 'FL', shipping_zip: '33101', shipping_country: 'US', notes: null, created_at: '2026-05-28T09:00:00Z', updated_at: '2026-05-29T11:00:00Z', items: [{ id: 'oi7', order_id: 'o5', product_id: '6', name: 'Linen Blazer', price: 159.99, quantity: 1, image_url: null, created_at: '' }] },
];

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: '#F39C12', processing: '#3498DB', shipped: '#9B59B6',
  delivered: '#2ECC71', cancelled: '#E74C3C',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = orders.filter((o) => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (search && !o.id.toLowerCase().includes(search.toLowerCase()) &&
        !o.shipping_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const updateStatus = (id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const statuses: (OrderStatus | 'all')[] = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  return (
    <div className="admin-orders">
      {/* Toolbar */}
      <div className="admin-orders__toolbar">
        <div className="admin-orders__search">
          <Search size={16} />
          <input placeholder="Search orders or customer..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="admin-orders__filters">
          {statuses.map((s) => (
            <button
              key={s}
              className={`admin-orders__filter-btn${filter === s ? ' admin-orders__filter-btn--active' : ''}`}
              onClick={() => setFilter(s)}
              style={s !== 'all' && filter === s ? { background: STATUS_COLOR[s], borderColor: STATUS_COLOR[s], color: '#fff' } : {}}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      <div className="admin-orders__list">
        {filtered.map((order) => (
          <motion.div
            key={order.id}
            className="admin-orders__card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="admin-orders__card-header" onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
              <div className="admin-orders__card-col">
                <span className="admin-orders__card-id">{order.id.slice(0, 12)}...</span>
                <span className="admin-orders__card-date">
                  {new Date(order.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="admin-orders__card-col">
                <span className="admin-orders__card-name">{order.shipping_name}</span>
                <span className="admin-orders__card-email">{order.shipping_email}</span>
              </div>
              <span
                className="admin-orders__status"
                style={{ background: `${STATUS_COLOR[order.status]}20`, color: STATUS_COLOR[order.status] }}
              >
                {order.status}
              </span>
              <span className="admin-orders__card-total">${order.total.toFixed(2)}</span>
              {expanded === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            <AnimatePresence>
              {expanded === order.id && (
                <motion.div
                  className="admin-orders__detail"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  {/* Items */}
                  <div className="admin-orders__items">
                    <h4>Order Items</h4>
                    {order.items?.map((item) => (
                      <div key={item.id} className="admin-orders__item">
                        <span className="admin-orders__item-name">{item.name}</span>
                        <span className="admin-orders__item-qty">×{item.quantity}</span>
                        <span className="admin-orders__item-price">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="admin-orders__item admin-orders__item--total">
                      <span>Total</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Shipping */}
                  <div className="admin-orders__shipping">
                    <h4>Shipping Address</h4>
                    <p>{order.shipping_name}</p>
                    <p>{order.shipping_line1}{order.shipping_line2 ? `, ${order.shipping_line2}` : ''}</p>
                    <p>{order.shipping_city}, {order.shipping_state} {order.shipping_zip}</p>
                  </div>

                  {/* Actions */}
                  <div className="admin-orders__actions">
                    <span>Update Status:</span>
                    <div className="admin-orders__status-btns">
                      {(['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map((s) => (
                        <button
                          key={s}
                          disabled={order.status === s}
                          onClick={() => updateStatus(order.id, s)}
                          style={order.status === s ? { background: STATUS_COLOR[s], color: '#fff', borderColor: STATUS_COLOR[s] } : {}}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="admin-orders__empty">No orders found.</div>
        )}
      </div>
    </div>
  );
}
