import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Save } from 'lucide-react';
import { toast } from 'react-toastify';
import type { RootState } from '../store';
import { setUser } from '../store/slices/authSlice';
import { useUpdateProfileMutation } from '../store/slices/authSlice';
import './Profile.scss';

export default function Profile() {
  const dispatch = useDispatch();
  const { user } = useSelector((s: RootState) => s.auth);
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    address_line1: user?.address_line1 || '',
    address_line2: user?.address_line2 || '',
    city: user?.city || '',
    state: user?.state || '',
    zip_code: user?.zip_code || '',
    country: user?.country || 'US',
  });

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name, last_name: user.last_name,
        phone: user.phone || '', address_line1: user.address_line1 || '',
        address_line2: user.address_line2 || '', city: user.city || '',
        state: user.state || '', zip_code: user.zip_code || '',
        country: user.country || 'US',
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      const result = await updateProfile(form).unwrap();
      dispatch(setUser(result.user));
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  if (!user) return null;

  return (
    <div className="profile">
      <div className="container">
        <h1 className="profile__title">My Profile</h1>
        <div className="divider-accent" />

        <motion.div
          className="profile__grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Account Info */}
          <div className="profile__card">
            <h2 className="profile__section-title">
              <User size={18} /> Account Information
            </h2>
            <div className="profile__info">
              <div className="profile__field">
                <span className="profile__label">Email</span>
                <span className="profile__value">{user.email}</span>
              </div>
              <div className="profile__field">
                <span className="profile__label">Role</span>
                <span className={`profile__role-badge profile__role-badge--${user.role}`}>
                  <Shield size={14} /> {user.role}
                </span>
              </div>
              <div className="profile__field">
                <span className="profile__label">Member Since</span>
                <span className="profile__value">{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="profile__card">
            <h2 className="profile__section-title">
              <Mail size={18} /> Shipping Address
            </h2>
            <div className="profile__form">
              <div className="profile__row">
                <label className="profile__form-field">
                  <span>First Name</span>
                  <input value={form.first_name} onChange={(e) => setForm({...form, first_name: e.target.value})} />
                </label>
                <label className="profile__form-field">
                  <span>Last Name</span>
                  <input value={form.last_name} onChange={(e) => setForm({...form, last_name: e.target.value})} />
                </label>
              </div>
              <label className="profile__form-field">
                <span>Phone</span>
                <input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
              </label>
              <label className="profile__form-field">
                <span>Address Line 1</span>
                <input value={form.address_line1} onChange={(e) => setForm({...form, address_line1: e.target.value})} />
              </label>
              <label className="profile__form-field">
                <span>Address Line 2</span>
                <input value={form.address_line2} onChange={(e) => setForm({...form, address_line2: e.target.value})} />
              </label>
              <div className="profile__row profile__row--3">
                <label className="profile__form-field">
                  <span>City</span>
                  <input value={form.city} onChange={(e) => setForm({...form, city: e.target.value})} />
                </label>
                <label className="profile__form-field">
                  <span>State</span>
                  <input value={form.state} onChange={(e) => setForm({...form, state: e.target.value})} />
                </label>
                <label className="profile__form-field">
                  <span>ZIP</span>
                  <input value={form.zip_code} onChange={(e) => setForm({...form, zip_code: e.target.value})} />
                </label>
              </div>
              <button className="profile__save-btn" onClick={handleSave} disabled={isLoading}>
                <Save size={16} /> {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
