import { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import Layout from './components/layout/Layout';
import { AuthInit, AuthGuard, AdminGuard, PageLoader } from './components/auth/Guards';

const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const Orders = lazy(() => import('./pages/Orders'));

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts = lazy(() => import('./pages/admin/Products'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));

const page = (el: React.ReactNode) => <Suspense fallback={<PageLoader />}>{el}</Suspense>;

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthInit>
        <Layout />
      </AuthInit>
    ),
    children: [
      { index: true, element: page(<Home />) },
      { path: 'products', element: page(<Products />) },
      { path: 'products/:slugOrId', element: page(<ProductDetail />) },
      { path: 'login', element: page(<Login />) },
      { path: 'register', element: page(<Register />) },
      {
        element: <AuthGuard />,
        children: [
          { path: 'cart', element: page(<Cart />) },
          { path: 'checkout', element: page(<Checkout />) },
          { path: 'profile', element: page(<Profile />) },
          { path: 'orders', element: page(<Orders />) },
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
        element: page(<AdminLayout />),
        children: [
          { index: true, element: page(<AdminDashboard />) },
          { path: 'products', element: page(<AdminProducts />) },
          { path: 'orders', element: page(<AdminOrders />) },
        ],
      },
    ],
  },
]);
