import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ChevronDown, ChevronUp, Clock, Truck, CheckCircle, XCircle } from 'lucide-react';
import { useGetOrdersQuery } from '../store/api/ordersApi';
import { PLACEHOLDER_IMAGE } from '../constants';
import type { OrderStatus } from '../types';
import './Orders.scss';

const STATUS_STEPS: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: 'pending', label: 'Pending', icon: Clock },
  { status: 'processing', label: 'Processing', icon: Package },
  { status: 'shipped', label: 'Shipped', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: CheckCircle },
];

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: '#F39C12', processing: '#3498DB', shipped: '#9B59B6',
  delivered: '#2ECC71', cancelled: '#E74C3C',
};

export default function Orders() {
  const { data, isLoading } = useGetOrdersQuery();
  const orders = data?.data ?? [];
  const [expanded, setExpanded] = useState<string | null>(null);

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return <Clock size={14} />;
      case 'processing': return <Package size={14} />;
      case 'shipped': return <Truck size={14} />;
      case 'delivered': return <CheckCircle size={14} />;
      case 'cancelled': return <XCircle size={14} />;
    }
  };

  const getStatusStep = (status: OrderStatus): number => {
    const idx = STATUS_STEPS.findIndex((s) => s.status === status);
    return idx >= 0 ? idx : -1;
  };

  return (
    <div className="orders">
      <div className="container">
        <h1 className="orders__title">My Orders</h1>
        <div className="divider-accent" />

        {isLoading ? (
          <div className="orders__loading">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="orders__empty">
            <Package size={64} className="orders__empty-icon" />
            <h2>No orders yet</h2>
            <p>Start shopping to see your orders here.</p>
          </div>
        ) : (
          <div className="orders__list">
            {orders.map((order) => (
              <motion.div
                key={order.id}
                className="orders__card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Header */}
                <div
                  className="orders__card-header"
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                >
                  <div className="orders__card-info">
                    <span className="orders__card-id">Order #{order.id.slice(0, 8)}</span>
                    <span className="orders__card-date">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="orders__card-meta">
                    <span
                      className="orders__status-badge"
                      style={{ background: `${STATUS_COLOR[order.status]}20`, color: STATUS_COLOR[order.status] }}
                    >
                      {getStatusIcon(order.status)} {order.status}
                    </span>
                    <span className="orders__card-total">${order.total.toFixed(2)}</span>
                    {expanded === order.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {expanded === order.id && (
                    <motion.div
                      className="orders__detail"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Status timeline */}
                      {order.status !== 'cancelled' && (
                        <div className="orders__timeline">
                          {STATUS_STEPS.map((step, idx) => (
                            <div
                              key={step.status}
                              className={`orders__timeline-step${idx <= getStatusStep(order.status) ? ' orders__timeline-step--active' : ''}`}
                            >
                              <div className="orders__timeline-dot" />
                              <span className="orders__timeline-label">{step.label}</span>
                              {idx < STATUS_STEPS.length - 1 && (
                                <div className={`orders__timeline-line${idx < getStatusStep(order.status) ? ' orders__timeline-line--active' : ''}`} />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Items */}
                      <div className="orders__items">
                        {order.items?.map((item) => (
                          <div key={item.id} className="orders__item">
                            <img
                              src={item.image_url || PLACEHOLDER_IMAGE.replace('w=600', 'w=80')}
                              alt={item.name}
                              className="orders__item-img"
                              loading="lazy"
                              decoding="async"
                            />
                            <div className="orders__item-info">
                              <p className="orders__item-name">{item.name}</p>
                              <p className="orders__item-meta">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                            </div>
                            <p className="orders__item-price">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>

                      {/* Totals */}
                      <div className="orders__totals">
                        <div className="orders__total-row">
                          <span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="orders__total-row">
                          <span>Tax</span><span>${order.tax.toFixed(2)}</span>
                        </div>
                        <div className="orders__total-row">
                          <span>Shipping</span><span>{order.shipping_cost === 0 ? 'Free' : `$${order.shipping_cost.toFixed(2)}`}</span>
                        </div>
                        <div className="orders__total-row orders__total-row--grand">
                          <span>Total</span><span>${order.total.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Shipping info */}
                      {order.shipping_line1 && (
                        <div className="orders__shipping">
                          <h4>Shipping Address</h4>
                          <p>{order.shipping_name}</p>
                          <p>{order.shipping_line1}{order.shipping_line2 ? `, ${order.shipping_line2}` : ''}</p>
                          <p>{order.shipping_city}, {order.shipping_state} {order.shipping_zip}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
