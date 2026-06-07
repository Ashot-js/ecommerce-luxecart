import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ShoppingBag, UserPlus } from 'lucide-react';
import { useRegisterMutation, setCredentials } from '../store/slices/authSlice';
import './Register.scss';

interface FormErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  confirm_password?: string;
  general?: string;
}

const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [register, { isLoading }] = useRegisterMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const validate = (): boolean => {
    const errs: FormErrors = {};

    if (!firstName.trim()) errs.first_name = 'First name is required.';
    if (!lastName.trim()) errs.last_name = 'Last name is required.';
    if (!email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    if (!password) {
      errs.password = 'Password is required.';
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    }
    if (!confirmPassword) {
      errs.confirm_password = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errs.confirm_password = 'Passwords do not match.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validate()) return;

    try {
      const result = await register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        password,
      }).unwrap();
      dispatch(setCredentials(result));
      navigate('/');
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ||
        'Registration failed. Please try again.';
      setErrors({ general: message });
    }
  };

  return (
    <div className="register">
      <motion.div
        className="register__card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="register__logo">
          <ShoppingBag size={36} strokeWidth={1.5} />
          <span className="register__logo-text">LuxeCart</span>
        </div>

        <h1 className="register__heading">Create Account</h1>
        <p className="register__subtitle">Join LuxeCart and start shopping</p>

        {errors.general && (
          <motion.div
            className="register__error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.2 }}
          >
            {errors.general}
          </motion.div>
        )}

        <form className="register__form" onSubmit={handleSubmit} noValidate>
          <div className="register__row">
            <div className="register__field">
              <label htmlFor="first_name" className="register__label">
                First Name
              </label>
              <div className="register__input-wrapper">
                <User size={18} className="register__input-icon" />
                <input
                  id="first_name"
                  type="text"
                  className={`register__input${errors.first_name ? ' register__input--error' : ''}`}
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              {errors.first_name && (
                <span className="register__field-error">{errors.first_name}</span>
              )}
            </div>

            <div className="register__field">
              <label htmlFor="last_name" className="register__label">
                Last Name
              </label>
              <div className="register__input-wrapper">
                <User size={18} className="register__input-icon" />
                <input
                  id="last_name"
                  type="text"
                  className={`register__input${errors.last_name ? ' register__input--error' : ''}`}
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              {errors.last_name && (
                <span className="register__field-error">{errors.last_name}</span>
              )}
            </div>
          </div>

          <div className="register__field">
            <label htmlFor="email" className="register__label">
              Email
            </label>
            <div className="register__input-wrapper">
              <Mail size={18} className="register__input-icon" />
              <input
                id="email"
                type="email"
                className={`register__input${errors.email ? ' register__input--error' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <span className="register__field-error">{errors.email}</span>
            )}
          </div>

          <div className="register__field">
            <label htmlFor="password" className="register__label">
              Password
            </label>
            <div className="register__input-wrapper">
              <Lock size={18} className="register__input-icon" />
              <input
                id="password"
                type="password"
                className={`register__input${errors.password ? ' register__input--error' : ''}`}
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            {errors.password && (
              <span className="register__field-error">{errors.password}</span>
            )}
          </div>

          <div className="register__field">
            <label htmlFor="confirm_password" className="register__label">
              Confirm Password
            </label>
            <div className="register__input-wrapper">
              <Lock size={18} className="register__input-icon" />
              <input
                id="confirm_password"
                type="password"
                className={`register__input${errors.confirm_password ? ' register__input--error' : ''}`}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            {errors.confirm_password && (
              <span className="register__field-error">{errors.confirm_password}</span>
            )}
          </div>

          <button
            type="submit"
            className="register__submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="register__spinner" />
            ) : (
              <UserPlus size={18} />
            )}
            {isLoading ? 'Creating Account…' : 'Create Account'}
          </button>
        </form>

        <p className="register__login">
          Already have an account?{' '}
          <Link to="/login" className="register__login-link">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
