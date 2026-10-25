import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useGetAdminOrdersQuery, useUpdateOrderStatusMutation } from '../../store/api/adminApi';
import { useDebounce } from '../../hooks/useDebounce';
import { apiErrorText } from '../../utils/apiError';
import type { OrderStatus } from '../../types';
import './Orders.scss';

const STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: '#F39C12', processing: '#3498DB', shipped: '#9B59B6',
  delivered: '#2ECC71', cancelled: '#E74C3C',
};

export default function AdminOrders() {
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const debounced = useDebounce(search, 300);

  const { data, isLoading, isError } = useGetAdminOrdersQuery({
    status: filter === 'all' ? undefined : filter,
    search: debounced,
    limit: 100,
  });
  const [updateStatus, { isLoading: updating }] = useUpdateOrderStatusMutation();
  const orders = data?.data ?? [];

  const changeStatus = async (id: string, status: OrderStatus) => {
    try {
      await updateStatus({ id, status }).unwrap();
      toast.success(`Order marked as ${status}`);
    } catch (err) {
      toast.error(apiErrorText(err, 'Could not update the order'));
    }
  };

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  return (
    <div className="admin-orders">
      <div className="admin-orders__toolbar">
        <div className="admin-orders__search">
          <Search size={16} />
          <input
            placeholder="Search by order id, name or email..."
            aria-label="Search orders"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="admin-orders__filters">
          {(['all', ...STATUSES] as const).map((s) => (
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

      <div className="admin-orders__list">
        {orders.map((order) => (
          <motion.div key={order.id} className="admin-orders__card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div
              className="admin-orders__card-header"
              role="button"
              tabIndex={0}
              aria-expanded={expanded === order.id}
              onClick={() => toggle(order.id)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle(order.id))}
            >
              <div className="admin-orders__card-col">
                <span className="admin-orders__card-id">#{order.id.slice(0, 8)}</span>
                <span className="admin-orders__card-date">{new Date(order.created_at).toLocaleDateString()}</span>
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

                  <div className="admin-orders__shipping">
                    <h4>Shipping Address</h4>
                    <p>{order.shipping_name}</p>
                    <p>{order.shipping_line1}{order.shipping_line2 ? `, ${order.shipping_line2}` : ''}</p>
                    <p>{order.shipping_city}, {order.shipping_state} {order.shipping_zip}</p>
                    {order.notes && <p>Note: {order.notes}</p>}
                  </div>

                  <div className="admin-orders__actions">
                    <span>Update Status:</span>
                    <div className="admin-orders__status-btns">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          disabled={order.status === s || updating}
                          onClick={() => changeStatus(order.id, s)}
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
        {!isLoading && orders.length === 0 && (
          <div className="admin-orders__empty">{isError ? 'Could not load orders.' : 'No orders found.'}</div>
        )}
        {isLoading && <div className="admin-orders__empty">Loading orders…</div>}
      </div>
    </div>
  );
}
