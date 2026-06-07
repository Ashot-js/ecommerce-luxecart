import { Suspense, lazy, useEffect, useState } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router';
import type { RootState } from './store';
import { useSelector, useDispatch } from 'react-redux';

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

// Auth store
import { setCredentials, logout, useLazyGetMeQuery } from './store/slices/authSlice';

// ---- Auth Initializer ----
function AuthInit({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const token = useSelector((s: RootState) => s.auth.token);
  const [triggerGetMe] = useLazyGetMeQuery();

  useEffect(() => {
    if (!token) {
      dispatch(logout());
      return;
    }
    triggerGetMe()
      .unwrap()
      .then((data) => {
        dispatch(setCredentials({ token, user: data.user }));
      })
      .catch(() => {
        localStorage.removeItem('luxecart_token');
        dispatch(logout());
      });
  }, []);

  return <>{children}</>;
}

// ---- Guards ----
function AuthGuard() {
  const { isAuthenticated, token } = useSelector((s: RootState) => s.auth);
  const [isChecking, setIsChecking] = useState(!!token);

  useEffect(() => {
    if (isAuthenticated) setIsChecking(false);
  }, [isAuthenticated]);

  if (isChecking) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function AdminGuard() {
  const { isAuthenticated, user, token } = useSelector((s: RootState) => s.auth);
  const [isChecking, setIsChecking] = useState(!!token);

  useEffect(() => {
    if (isAuthenticated || !token) setIsChecking(false);
  }, [isAuthenticated, token]);

  if (isChecking) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}

// ---- Loading fallback ----
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

// ---- Router ----
export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthInit>
        <Layout />
      </AuthInit>
    ),
    children: [
      { index: true, element: <Suspense fallback={<PageLoader />}><Home /></Suspense> },
      { path: 'products', element: <Suspense fallback={<PageLoader />}><Products /></Suspense> },
      { path: 'products/:slugOrId', element: <Suspense fallback={<PageLoader />}><ProductDetail /></Suspense> },
      { path: 'login', element: <Suspense fallback={<PageLoader />}><Login /></Suspense> },
      { path: 'register', element: <Suspense fallback={<PageLoader />}><Register /></Suspense> },
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
  {
    path: '/admin',
    element: (
      <AuthInit>
        <AdminGuard />
      </AuthInit>
    ),
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
