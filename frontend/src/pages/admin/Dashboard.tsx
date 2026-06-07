import { motion } from 'framer-motion';
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import './Dashboard.scss';

// ---- Mock Data ----
const stats = [
  { label: 'Total Products', value: 142, icon: Package, change: '+12 this month' },
  { label: 'Total Orders', value: 3_284, icon: ShoppingCart, change: '+18% vs last month' },
  { label: 'Total Users', value: 1_892, icon: Users, change: '+245 this week' },
  { label: 'Total Revenue', value: '$84,290', icon: DollarSign, change: '+22% vs last month' },
];

interface RecentOrder {
  id: string;
  customer: string;
  date: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

const recentOrders: RecentOrder[] = [
  { id: '#ORD-8912', customer: 'Sarah Johnson', date: '2025-01-15', total: 245.99, status: 'delivered' },
  { id: '#ORD-8913', customer: 'Mike Chen', date: '2025-01-15', total: 89.50, status: 'processing' },
  { id: '#ORD-8914', customer: 'Emily Davis', date: '2025-01-14', total: 432.00, status: 'shipped' },
  { id: '#ORD-8915', customer: 'James Wilson', date: '2025-01-14', total: 129.99, status: 'pending' },
  { id: '#ORD-8916', customer: 'Lisa Brown', date: '2025-01-13', total: 67.25, status: 'cancelled' },
];

interface LowStockItem {
  id: string;
  name: string;
  stock: number;
  threshold: number;
}

const lowStockAlerts: LowStockItem[] = [
  { id: 'prod-1', name: 'Leather Weekend Bag', stock: 3, threshold: 10 },
  { id: 'prod-2', name: 'Cashmere Scarf', stock: 2, threshold: 5 },
  { id: 'prod-3', name: 'Silver Cufflinks', stock: 1, threshold: 8 },
  { id: 'prod-4', name: 'Wool Blazer', stock: 4, threshold: 12 },
];

const statusBadgeClass = (status: string): string => {
  const map: Record<string, string> = {
    delivered: 'dashboard__badge--delivered',
    processing: 'dashboard__badge--processing',
    shipped: 'dashboard__badge--shipped',
    pending: 'dashboard__badge--pending',
    cancelled: 'dashboard__badge--cancelled',
  };
  return map[status] ?? '';
};



export default function Dashboard() {
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

      {/* Stats Grid */}
      <div className="grid-4 dashboard__stats">
        {stats.map((s, i) => (
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
              <span className="dashboard__stat-change">
                <TrendingUp size={12} />
                {s.change}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="dashboard__grid">
        {/* Recent Orders */}
        <motion.div
          className="dashboard__card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.35 }}
        >
          <div className="dashboard__card-header">
            <h3>Recent Orders</h3>
            <a href="/admin/orders" className="dashboard__view-all">View All</a>
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
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="dashboard__order-id">{order.id}</td>
                    <td>{order.customer}</td>
                    <td className="dashboard__muted">{order.date}</td>
                    <td>
                      <span className={`dashboard__badge ${statusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="dashboard__table-right dashboard__total">
                      ${order.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div
          className="dashboard__card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.35 }}
        >
          <div className="dashboard__card-header">
            <h3>
              <AlertTriangle size={18} />
              Low Stock Alerts
            </h3>
          </div>
          <div className="dashboard__alerts">
            {lowStockAlerts.map((item) => (
              <div key={item.id} className="dashboard__alert-item">
                <div className="dashboard__alert-info">
                  <span className="dashboard__alert-name">{item.name}</span>
                  <span className="dashboard__alert-meta">
                    Stock: <strong>{item.stock}</strong> / threshold: {item.threshold}
                  </span>
                </div>
                <div className="dashboard__alert-bar">
                  <div
                    className="dashboard__alert-fill"
                    style={{ width: `${Math.min((item.stock / item.threshold) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
