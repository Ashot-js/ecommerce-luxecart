import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ShoppingBag } from 'lucide-react';
import { useLoginMutation, setCredentials } from '../store/slices/authSlice';
import './Login.scss';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const result = await login({ email: email.trim(), password }).unwrap();
      dispatch(setCredentials(result));
      navigate('/');
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ||
        'Login failed. Please check your credentials.';
      setError(message);
    }
  };

  return (
    <div className="login">
      <motion.div
        className="login__card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="login__logo">
          <ShoppingBag size={36} strokeWidth={1.5} />
          <span className="login__logo-text">LuxeCart</span>
        </div>

        <h1 className="login__heading">Welcome Back</h1>
        <p className="login__subtitle">Sign in to your account to continue</p>

        {error && (
          <motion.div
            className="login__error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.div>
        )}

        <form className="login__form" onSubmit={handleSubmit} noValidate>
          <div className="login__field">
            <label htmlFor="email" className="login__label">
              Email
            </label>
            <div className="login__input-wrapper">
              <Mail size={18} className="login__input-icon" />
              <input
                id="email"
                type="email"
                className="login__input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="login__field">
            <label htmlFor="password" className="login__label">
              Password
            </label>
            <div className="login__input-wrapper">
              <Lock size={18} className="login__input-icon" />
              <input
                id="password"
                type="password"
                className="login__input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="login__submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="login__spinner" />
            ) : (
              <LogIn size={18} />
            )}
            {isLoading ? 'Signing In…' : 'Sign In'}
          </button>
        </form>

        <div className="login__divider">
          <span className="login__divider-line" />
          <span className="login__divider-text">or</span>
          <span className="login__divider-line" />
        </div>

        <p className="login__register">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="login__register-link">
            Create one
          </Link>
        </p>

        <p className="login__demo">
          Demo: <strong>demo@luxecart.com</strong> / <strong>password123</strong>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
