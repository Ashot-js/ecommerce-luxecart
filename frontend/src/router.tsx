import { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import type { RootState } from './store';
import { useSelector } from 'react-redux';

// Layouts
import Layout from './components/layout/Layout';

// Lazy-loaded pages
const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const Orders = lazy(() => import('./pages/Orders'));

// Admin lazy pages
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));

// Auth guard
function AuthGuard() {
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Admin guard
function AdminGuard() {
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}

// Loading fallback
function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#6B6B6B' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid #2A2A2A', borderTopColor: '#800020', borderRadius: '50%', margin: '0 auto 16px' }} />
        <p>Loading...</p>
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><Home /></Suspense> },
      { path: 'products', element: <Suspense fallback={<PageLoader />}><Products /></Suspense> },
      { path: 'products/:slugOrId', element: <Suspense fallback={<PageLoader />}><ProductDetail /></Suspense> },
      { path: 'login', element: <Suspense fallback={<PageLoader />}><Login /></Suspense> },
      { path: 'register', element: <Suspense fallback={<PageLoader />}><Register /></Suspense> },
      // Protected routes
      {
        element: <AuthGuard />,
        children: [
          { path: 'cart', element: <Suspense fallback={<PageLoader />}><Cart /></Suspense> },
          { path: 'checkout', element: <Suspense fallback={<PageLoader />}><Checkout /></Suspense> },
          { path: 'profile', element: <Suspense fallback={<PageLoader />}><Profile /></Suspense> },
          { path: 'orders', element: <Suspense fallback={<PageLoader />}><Orders /></Suspense> },
        ],
      },
    ],
  },
  // Admin routes
  {
    path: '/admin',
    element: <AdminGuard />,
    children: [
      {
        element: <Suspense fallback={<PageLoader />}><AdminLayout /></Suspense>,
        children: [
          { index: true, element: <Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense> },
          { path: 'products', element: <Suspense fallback={<PageLoader />}><AdminProducts /></Suspense> },
          { path: 'orders', element: <Suspense fallback={<PageLoader />}><AdminOrders /></Suspense> },
        ],
      },
    ],
  },
]);
