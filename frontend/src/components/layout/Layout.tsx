import { Outlet } from 'react-router';
import { useSelector } from 'react-redux';
import { AnimatePresence } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import type { RootState } from '../../store';
import './Layout.scss';

export default function Layout() {
  const { isCartDrawerOpen } = useSelector((s: RootState) => s.ui);

  return (
    <div className="layout">
      <Header />
      <main className="layout__main">
        <Outlet />
      </main>
      <Footer />
      <AnimatePresence>
        {isCartDrawerOpen && <CartDrawer />}
      </AnimatePresence>
    </div>
  );
}
