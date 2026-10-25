import { motion } from 'framer-motion';
import { Link } from 'react-router';
import { Package, ShoppingCart, Users, DollarSign, AlertTriangle } from 'lucide-react';
import { useGetAdminStatsQuery } from '../../store/api/adminApi';
import { LOW_STOCK_THRESHOLD } from '../../constants';
import './Dashboard.scss';

const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Dashboard() {
  const { data, isLoading, isError, refetch } = useGetAdminStatsQuery();
  const stats = data?.data;

  if (isLoading) return <div className="dashboard__state">Loading dashboard…</div>;
  if (isError || !stats) {
    return (
      <div className="dashboard__state">
        Could not load the dashboard. <button onClick={refetch}>Try again</button>
      </div>
    );
  }

  const cards = [
    { label: 'Active Products', value: stats.total_products.toLocaleString(), icon: Package },
    { label: 'Total Orders', value: stats.total_orders.toLocaleString(), icon: ShoppingCart },
    { label: 'Total Users', value: stats.total_users.toLocaleString(), icon: Users },
    { label: 'Revenue', value: money(stats.total_revenue), icon: DollarSign },
  ];

  return (
    <div className="dashboard">
      <motion.h2
        className="dashboard__heading"
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        Dashboard Overview
      </motion.h2>

      <div className="grid-4 dashboard__stats">
        {cards.map((s, i) => (
          <motion.div
            key={s.label}
            className="dashboard__stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35 }}
          >
            <div className="dashboard__stat-icon">
              <s.icon size={22} />
            </div>
            <div className="dashboard__stat-info">
              <span className="dashboard__stat-value">{s.value}</span>
              <span className="dashboard__stat-label">{s.label}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="dashboard__grid">
        <div className="dashboard__card">
          <div className="dashboard__card-header">
            <h3>Recent Orders</h3>
            <Link to="/admin/orders" className="dashboard__view-all">View All</Link>
          </div>
          <div className="dashboard__table-wrap">
            <table className="dashboard__table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="dashboard__table-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_orders.map((order) => (
                  <tr key={order.id}>
                    <td className="dashboard__order-id">#{order.id.slice(0, 8)}</td>
                    <td>{order.shipping_name}</td>
                    <td className="dashboard__muted">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`dashboard__badge dashboard__badge--${order.status}`}>{order.status}</span>
                    </td>
                    <td className="dashboard__table-right dashboard__total">{money(order.total)}</td>
                  </tr>
                ))}
                {stats.recent_orders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="dashboard__muted">No orders yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashboard__card">
          <div className="dashboard__card-header">
            <h3>
              <AlertTriangle size={18} />
              Low Stock (≤ {LOW_STOCK_THRESHOLD})
            </h3>
          </div>
          <div className="dashboard__alerts">
            {stats.low_stock_products.map((item) => (
              <div key={item.id} className="dashboard__alert-item">
                <div className="dashboard__alert-info">
                  <span className="dashboard__alert-name">{item.name}</span>
                  <span className="dashboard__alert-meta">
                    Stock: <strong>{item.stock}</strong>
                  </span>
                </div>
                <div className="dashboard__alert-bar">
                  <div
                    className="dashboard__alert-fill"
                    style={{ width: `${(item.stock / LOW_STOCK_THRESHOLD) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {stats.low_stock_products.length === 0 && <p className="dashboard__muted">All products are well stocked.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
