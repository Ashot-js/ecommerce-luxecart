import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ArrowLeft,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import './AdminLayout.scss';

const sidebarLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
];

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="admin-layout__overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`admin-layout__sidebar${mobileOpen ? ' admin-layout__sidebar--open' : ''}`}>
        <div className="admin-layout__sidebar-header">
          <h2 className="admin-layout__logo">LuxeCart</h2>
          <span className="admin-layout__logo-badge">Admin</span>
          <button
            className="admin-layout__sidebar-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-layout__nav">
          {sidebarLinks.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `admin-layout__nav-link${isActive ? ' admin-layout__nav-link--active' : ''}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={20} />
              <span>{label}</span>
              <ChevronRight size={14} className="admin-layout__nav-arrow" />
            </NavLink>
          ))}
        </nav>

        <div className="admin-layout__sidebar-footer">
          <button
            className="admin-layout__back-btn"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={16} />
            <span>Back to Store</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-layout__main">
        <header className="admin-layout__topbar">
          <button
            className="admin-layout__hamburger"
            onClick={() => setMobileOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={22} />
          </button>
          <h1 className="admin-layout__title">Admin Panel</h1>
          <a href="/" className="admin-layout__store-link">
            <ArrowLeft size={16} />
            <span>Back to Store</span>
          </a>
        </header>

        <div className="admin-layout__content">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
