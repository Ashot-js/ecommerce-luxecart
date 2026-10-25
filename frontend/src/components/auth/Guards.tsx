import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { setUser, logout, useLazyGetMeQuery } from '../../store/slices/authSlice';

export function PageLoader() {
  return (
    <div className="page-loader" role="status">
      <div className="page-loader__spinner animate-spin" />
      <p>Loading...</p>
    </div>
  );
}

/** On first load, turns a stored token into a user (or drops it if it is no longer valid). */
export function AuthInit({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const token = useSelector((s: RootState) => s.auth.token);
  const [getMe] = useLazyGetMeQuery();

  useEffect(() => {
    if (!token) return;
    getMe()
      .unwrap()
      .then((data) => dispatch(setUser(data.user)))
      .catch(() => dispatch(logout()));
  }, [token, getMe, dispatch]);

  return <>{children}</>;
}

/** A token without a user means AuthInit is still checking it. */
function useAuthStatus() {
  const { token, user } = useSelector((s: RootState) => s.auth);
  if (user) return { status: 'signed-in' as const, user };
  return { status: token ? ('checking' as const) : ('signed-out' as const), user: null };
}

export function AuthGuard() {
  const { status } = useAuthStatus();
  if (status === 'checking') return <PageLoader />;
  if (status === 'signed-out') return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function AdminGuard() {
  const { status, user } = useAuthStatus();
  if (status === 'checking') return <PageLoader />;
  if (status === 'signed-out') return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}
