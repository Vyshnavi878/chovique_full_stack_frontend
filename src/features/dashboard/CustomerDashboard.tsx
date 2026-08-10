import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  ShoppingBag,
  Heart,
  MapPin,
  Tag,
  Bell,
  FileText,
  Settings,
  LayoutDashboard,
  CheckCircle,
  Eye,
  AlertTriangle,
  UploadCloud,
  Trash2,
  Plus,
  X,
  Menu,
  Loader2,
  Coins,
  Download
} from 'lucide-react';
import { useApp } from '../../app/providers';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { pageTransition } from '../../lib/framer';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import { BASE_URL } from '../../lib/api';
import { orderService } from '../../services/orderService';
import type { UserCoupon } from '../../types';

type CustomerTab =
  | 'overview'
  | 'rewards'
  | 'profile'
  | 'orders'
  | 'wishlist'
  | 'addresses'
  | 'coupons'
  | 'notifications'
  | 'invoices'
  | 'settings'
  | 'help';

export const CustomerDashboard: React.FC = () => {
  const {
    user,
    role,
    wallet,
    orders,
    setOrders,
    wishlist,
    logout,
    tickets,
    addSupportTicket,
    submitTicketFeedback,
    acknowledgeTicketNotification,
    updateUserProfilePicture,
    updateUserProfile,
    addresses,
    addAddress,
    deleteAddress,
    setDefaultAddress,
    notifications,
    removeNotification
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const navState = location.state as { tab?: CustomerTab } | null;
    if (navState?.tab) {
      setActiveTab(navState.tab);
      navigate('/dashboard', { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  // Redirect if guest/non-customer accesses directly
  useEffect(() => {
    if (role === 'guest') {
      navigate('/login');
    }
  }, [role, navigate]);

  const [activeTab, setActiveTab] = useState<CustomerTab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileGrid, setIsMobileGrid] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileGrid(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Profile Form state — seeded from authenticated user, no hardcoded demo fallbacks
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.profile.phone || '',
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);

  const handleViewInvoice = async (orderId: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const ord = orders.find(o => o.id === orderId);
      if (ord && ord.invoice_url && ord.invoice_url.startsWith('http')) {
        window.open(ord.invoice_url, '_blank');
        return;
      }
      const html = await orderService.getInvoiceHtml(orderId);
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
      }
    } catch (err) {
      console.error('Failed to load invoice', err);
      alert('Could not load invoice. Please try again later.');
    }
  };

  const handleDownloadInvoice = async (orderId: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const ord = orders.find(o => o.id === orderId);
      if (ord && ord.invoice_url && ord.invoice_url.startsWith('http')) {
        const a = document.createElement('a');
        a.href = ord.invoice_url;
        a.target = '_blank';
        a.download = `Invoice-${orderId}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
      const html = await orderService.getInvoiceHtml(orderId);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${orderId.slice(0, 8).toUpperCase()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download invoice', err);
      alert('Could not download invoice.');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      const cancelledOrder = await orderService.cancelOrder(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'Cancelled' } : o)));
    } catch (err) {
      console.error('Failed to cancel order', err);
      alert('Could not cancel order. It may be too late to cancel.');
    }
  };

  // Keep profile form in sync if the user object changes (e.g. after rehydration from /users/me)
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.profile.phone || '',
      });
    }
  }, [user]);

  // --- Avatar upload state ---
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  // --- Profile save state ---
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  // --- Preferences save state ---
  const [isPreferencesSaving, setIsPreferencesSaving] = useState(false);
  const [preferencesSaved, setPreferencesSaved] = useState(false);
  const [preferencesError, setPreferencesError] = useState('');

  // --- Change password state ---
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  const [changePasswordForm, setChangePasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [changePasswordMessage, setChangePasswordMessage] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');

  // --- Coupons: fetched from backend, not hardcoded ---
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [isCouponsLoading, setIsCouponsLoading] = useState(false);
  const [couponsError, setCouponsError] = useState('');

  useEffect(() => {
    if (activeTab !== 'coupons') return;
    let cancelled = false;
    setIsCouponsLoading(true);
    setCouponsError('');
    userService
      .getCoupons()
      .then((data) => {
        if (!cancelled) setCoupons(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load coupons.';
          setCouponsError(message);
        }
      })
      .finally(() => {
        if (!cancelled) setIsCouponsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  // --- Orders: fetched from backend when orders or overview tab is active ---
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  useEffect(() => {
    if (activeTab !== 'orders' && activeTab !== 'overview') return;
    let cancelled = false;
    setIsOrdersLoading(true);
    setOrdersError('');
    orderService
      .getOrders()
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load order history.';
          setOrdersError(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setIsOrdersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, setOrders]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setAvatarError('');
    setIsProfileSaving(true);
    try {
      if (pendingAvatarFile) {
        setIsAvatarUploading(true);
        const formData = new FormData();
        formData.append('avatar', pendingAvatarFile);
        const result = await userService.uploadAvatar(formData);
        updateUserProfilePicture(result.avatar_url);
        setPendingAvatarFile(null);
        setAvatarPreviewUrl(null);
        setIsAvatarUploading(false);
      }

      await updateUserProfile({
        name: profileForm.name,
        phone: profileForm.phone,
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile.';
      setProfileError(msg);
    } finally {
      setIsProfileSaving(false);
      setIsAvatarUploading(false);
    }
  };

  const handlePreferencesSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const dob = (form.elements.namedItem('dob') as HTMLInputElement).value;
    const gender = (form.elements.namedItem('gender') as HTMLSelectElement).value;
    const prefEl = form.elements.namedItem('preferences') as HTMLTextAreaElement | null;
    const preferences = prefEl ? prefEl.value : (user?.profile?.preferences || '');
    setPreferencesError('');
    setIsPreferencesSaving(true);
    try {
      await updateUserProfile({ dob, gender, preferences });
      setPreferencesSaved(true);
      setTimeout(() => setPreferencesSaved(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings.';
      setPreferencesError(msg);
    } finally {
      setIsPreferencesSaving(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordMessage('');

    if (!changePasswordForm.currentPassword) {
      setChangePasswordError('Please enter your current password.');
      return;
    }
    if (changePasswordForm.newPassword.length < 6) {
      setChangePasswordError('New password must be at least 6 characters.');
      return;
    }
    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      setChangePasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await authService.changePassword(
        changePasswordForm.currentPassword,
        changePasswordForm.newPassword,
        changePasswordForm.confirmPassword
      );
      setChangePasswordMessage(res.message || 'Password changed successfully.');
      setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change password.';
      setChangePasswordError(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const totalSpent = orders.reduce((sum, ord) => sum + ord.total, 0);

  if (!user) return null;

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="dashboard-page"
    >
      <div className="container">
        {/* User Card Header */}
        <div
          className="glass-panel"
          style={{
            padding: '30px',
            border: '1px solid var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
            background: 'rgba(var(--dark-chocolate-rgb), 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {user.profile.avatarUrl ? (
              <img
                src={user.profile.avatarUrl}
                alt={user.name}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--gold)',
                  boxShadow: '0 0 15px rgba(201, 168, 76, 0.4)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--gradient-gold)',
                  color: 'var(--dark-chocolate)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1.5rem',
                  boxShadow: '0 0 15px rgba(201, 168, 76, 0.4)',
                }}
              >
                {user.profile.avatar}
              </div>
            )}
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--cream)', margin: 0 }}>
                {user.name}
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <Button
              variant="glass"
              size="sm"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              Log Out
            </Button>
          </div>
        </div>

        {/* Toggle Button for Mobile Dashboard Menu */}
        <button 
          className="dashboard-mobile-trigger"
          onClick={() => setIsSidebarOpen(true)}
          style={{ marginTop: '20px' }}
        >
          <Menu size={18} />
          <span>Dashboard Menu</span>
        </button>

        {/* Dashboard Grid container */}
        <div className="dashboard-container">
          {/* Mobile Overlay Backdrop */}
          <div 
            className={`admin-sidebar-backdrop ${isSidebarOpen ? 'open' : ''}`}
            onClick={() => setIsSidebarOpen(false)}
            style={{ zIndex: 119 }}
          />

          {/* Left Menu bar */}
          <aside className={`dashboard-menu ${isSidebarOpen ? 'open' : ''}`}>
            {/* Mobile Close Button inside Drawer */}
            <div style={{ display: 'none', justifyContent: 'flex-end', marginBottom: '15px' }} className="mobile-close-container">
              <button 
                onClick={() => setIsSidebarOpen(false)} 
                style={{ color: 'var(--rose-gold)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}
              >
                <span>Close</span>
                <X size={18} />
              </button>
            </div>

            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'rewards', label: 'Rewards & Coins', icon: Coins },
              { id: 'profile', label: 'My Profile', icon: User },
              { id: 'orders', label: 'Order History', icon: ShoppingBag },
              { id: 'wishlist', label: 'Wishlist', icon: Heart },
              { id: 'addresses', label: 'Addresses', icon: MapPin },
              { id: 'coupons', label: 'My Coupons', icon: Tag },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'invoices', label: 'Invoices', icon: FileText },
              { id: 'settings', label: 'Account Settings', icon: Settings },
              { id: 'help', label: 'Help & Complaints', icon: AlertTriangle },
            ].map((menuItem) => {
              const Icon = menuItem.icon;
              return (
                <button
                  key={menuItem.id}
                  onClick={() => {
                    setActiveTab(menuItem.id as CustomerTab);
                    setIsSidebarOpen(false);
                  }}
                  className={`dashboard-menu-btn ${activeTab === menuItem.id ? 'active' : ''}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={18} />
                    <span>{menuItem.label}</span>
                  </div>
                  {menuItem.id === 'notifications' && notifications.length > 0 && (
                    <span
                      style={{
                        background: '#ff3b30',
                        color: 'white',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        minWidth: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px',
                      }}
                    >
                      {notifications.length}
                    </span>
                  )}
                </button>
              );
            })}
          </aside>

          {/* Right tab panel */}
          <main className="dashboard-card">
            {/* OVERVIEW PANEL */}
            {activeTab === 'overview' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--cream)', marginBottom: '24px' }}>
                  Account Overview
                </h2>

                {/* Support Tickets Notifications Alert */}
                {tickets.filter(t => t.customerId === user.id && t.status === 'Resolved' && !t.notified).map(t => (
                  <div
                    key={t.id}
                    className="glass-panel"
                    style={{
                      padding: '16px 20px',
                      border: '1px solid var(--gold)',
                      background: 'rgba(201, 168, 76, 0.1)',
                      borderRadius: '8px',
                      marginBottom: '24px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ flex: 1, marginRight: '15px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--gold)', display: 'block', fontSize: '0.9rem' }}>
                        Support Complaint Resolved ({t.id})
                      </span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--cream)' }}>
                        Category: <strong>{t.category}</strong>. Admin has marked this issue as resolved.
                      </p>
                    </div>
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={() => {
                        acknowledgeTicketNotification(t.id);
                        setActiveTab('help');
                      }}
                      glow
                    >
                      Give Feedback
                    </Button>
                  </div>
                ))}
                
                {/* Stats cards row */}
                <div className="dashboard-grid-stats">
                  <div className="dashboard-stat-card">
                    <span style={{ fontSize: '0.8rem', color: 'var(--gold)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      Connoisseur Value
                    </span>
                    <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--cream)' }}>
                      ₹{totalSpent.toLocaleString()}
                    </span>
                  </div>
                  <div className="dashboard-stat-card">
                    <span style={{ fontSize: '0.8rem', color: 'var(--gold)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      Orders Logged
                    </span>
                    <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--cream)' }}>
                      {orders.length}
                    </span>
                  </div>
                  <div className="dashboard-stat-card">
                    <span style={{ fontSize: '0.8rem', color: 'var(--gold)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      Wishlist Saved
                    </span>
                    <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--cream)' }}>
                      {wishlist.length}
                    </span>
                  </div>
                </div>

                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--cream)', marginBottom: '15px' }}>
                  Recent Activity
                </h3>
                {orders.length === 0 ? (
                  <p style={{ color: 'var(--grey-light)', fontStyle: 'italic' }}>No recent orders placed.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {orders.slice(0, 2).map((ord) => (
                      <div
                        key={ord.id}
                        style={{
                          padding: '16px',
                          background: 'rgba(0,0,0,0.2)',
                          borderRadius: '4px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--cream)' }}>{ord.id}</span>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--grey-light)' }}>
                            Date: {ord.date} · Items: {ord.items.length}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--gold)' }}>₹{ord.total}</span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '4px 8px',
                              borderRadius: '2px',
                              background: ord.status === 'Delivered' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(241, 196, 15, 0.2)',
                              color: ord.status === 'Delivered' ? '#2ecc71' : '#f1c40f',
                            }}
                          >
                            {ord.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* REWARDS PANEL */}
            {activeTab === 'rewards' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--cream)', marginBottom: '24px' }}>
                  Chovique Reward Coins & Wallet
                </h2>

                {/* Coin balance card */}
                <div
                  className="glass-panel"
                  style={{
                    padding: '24px',
                    border: '1px solid var(--gold)',
                    borderRadius: '8px',
                    background: 'rgba(212, 175, 55, 0.08)',
                    marginBottom: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '20px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'var(--gradient-gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--dark-chocolate)',
                        boxShadow: '0 0 15px rgba(212, 175, 55, 0.4)',
                      }}
                    >
                      <Coins size={30} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                        Available Reward Balance
                      </span>
                      <h3 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--cream)', margin: '2px 0 0 0' }}>
                        {wallet?.coin_balance ?? 0} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--beige)' }}>Coins</span>
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--grey-light)', margin: '4px 0 0 0' }}>
                        Equivalent value: <strong style={{ color: 'var(--gold)' }}>₹{wallet?.rupee_value ?? 0}</strong>
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '12px 18px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      color: 'var(--beige)',
                      lineHeight: 1.6,
                    }}
                  >
                    <div><strong>Earn Rule:</strong> ₹{wallet?.settings?.spend_per_coin ?? 10} spent = 1 Coin</div>
                    <div><strong>Redeem Rule:</strong> {wallet?.settings?.coins_per_rupee ?? 10} Coins = ₹1 Discount</div>
                    <div><strong>Max Usage:</strong> Up to {wallet?.settings?.max_redemption_percentage ?? 20}% per order</div>
                  </div>
                </div>

                {/* Coin Transactions Audit History */}
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--cream)', marginBottom: '16px' }}>
                  Transaction Ledger & Audit History
                </h3>

                {wallet?.recent_transactions && wallet.recent_transactions.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--gold)' }}>
                          <th style={{ padding: '12px' }}>Date</th>
                          <th style={{ padding: '12px' }}>Type</th>
                          <th style={{ padding: '12px' }}>Coins</th>
                          <th style={{ padding: '12px' }}>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wallet.recent_transactions.map((tx) => (
                          <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--cream)' }}>
                            <td style={{ padding: '12px', color: 'var(--grey-light)', fontSize: '0.85rem' }}>
                              {new Date(tx.created_at).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  padding: '3px 8px',
                                  borderRadius: '3px',
                                  background:
                                    tx.type === 'EARN' || tx.type === 'REFUND'
                                      ? 'rgba(46, 204, 113, 0.2)'
                                      : tx.type === 'REDEEM'
                                      ? 'rgba(231, 76, 60, 0.2)'
                                      : 'rgba(241, 196, 15, 0.2)',
                                  color:
                                    tx.type === 'EARN' || tx.type === 'REFUND'
                                      ? '#2ecc71'
                                      : tx.type === 'REDEEM'
                                      ? '#e74c3c'
                                      : '#f1c40f',
                                }}
                              >
                                {tx.type}
                              </span>
                            </td>
                            <td style={{ padding: '12px', fontWeight: 700, color: tx.coins > 0 ? '#2ecc71' : '#e74c3c' }}>
                              {tx.coins > 0 ? `+${tx.coins}` : tx.coins}
                            </td>
                            <td style={{ padding: '12px', color: 'var(--beige)', fontSize: '0.85rem' }}>
                              {tx.description || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: 'var(--grey-light)', fontStyle: 'italic' }}>No coin transactions recorded yet.</p>
                )}
              </div>
            )}

            {/* PROFILE PANEL */}
            {activeTab === 'profile' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--cream)', marginBottom: '24px' }}>
                  My Profile Details
                </h2>
                
                {/* Profile Picture Uploader */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                  {avatarPreviewUrl || user.profile.avatarUrl ? (
                    <img
                      src={avatarPreviewUrl || user.profile.avatarUrl!}
                      alt="Profile Preview"
                      style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)' }}
                    />
                  ) : (
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--gradient-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 700, color: 'var(--dark-chocolate)' }}>
                      {user.profile.avatar}
                    </div>
                  )}
                  <div>
                    <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--cream)', fontWeight: 600, marginBottom: '6px' }}>Profile Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      id="profile-img-upload"
                      style={{ display: 'none' }}
                      disabled={isAvatarUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setAvatarError('');
                        setPendingAvatarFile(file);
                        setAvatarPreviewUrl(URL.createObjectURL(file));
                      }}
                    />
                    <label
                      htmlFor="profile-img-upload"
                      className="btn-gold"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'var(--gradient-gold)',
                        color: 'var(--dark-chocolate)',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: isAvatarUploading ? 'not-allowed' : 'pointer',
                        opacity: isAvatarUploading ? 0.6 : 1,
                      }}
                    >
                      {isAvatarUploading ? (
                        <>
                          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Uploading...
                        </>
                      ) : (
                        <>
                          <UploadCloud size={14} /> Upload Image
                        </>
                      )}
                    </label>
                    {avatarError && (
                      <p style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: '6px' }}>{avatarError}</p>
                    )}
                  </div>
                </div>
                <form onSubmit={handleProfileSave}>
                  <Input
                    label="Full Name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={profileForm.email}
                    disabled
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  />

                  {profileError && (
                    <div
                      style={{
                        padding: '12px',
                        background: 'rgba(231, 76, 60, 0.1)',
                        border: '1px solid #e74c3c',
                        color: '#e74c3c',
                        borderRadius: '4px',
                        marginBottom: '20px',
                        fontSize: '0.9rem',
                      }}
                    >
                      {profileError}
                    </div>
                  )}

                  {profileSaved && (
                    <div
                      style={{
                        padding: '12px',
                        background: 'rgba(46, 204, 113, 0.1)',
                        border: '1px solid #2ecc71',
                        color: '#2ecc71',
                        borderRadius: '4px',
                        marginBottom: '20px',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <CheckCircle size={16} /> Profile credentials updated successfully.
                    </div>
                  )}

                  <Button variant="gold" type="submit" glow disabled={isProfileSaving}>
                    {isProfileSaving ? (
                      <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </form>
              </div>
            )}

            {/* ORDERS PANEL */}
            {activeTab === 'orders' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--cream)', marginBottom: '24px' }}>
                  My Order Ledger
                </h2>

                {isOrdersLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--gold)', padding: '20px 0' }}>
                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Loading order history...</span>
                  </div>
                ) : ordersError ? (
                  <div
                    style={{
                      padding: '16px',
                      background: 'rgba(231, 76, 60, 0.1)',
                      border: '1px solid #e74c3c',
                      color: '#e74c3c',
                      borderRadius: '6px',
                      marginBottom: '20px',
                    }}
                  >
                    {ordersError}
                  </div>
                ) : orders.length === 0 ? (
                  <div
                    style={{
                      padding: '30px',
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px dashed var(--glass-border)',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <ShoppingBag size={36} style={{ color: 'var(--gold)', marginBottom: '12px', opacity: 0.8 }} />
                    <h3 style={{ color: 'var(--cream)', margin: '0 0 8px 0', fontSize: '1.1rem' }}>No orders found</h3>
                    <p style={{ color: 'var(--grey-light)', margin: '0 0 20px 0', fontSize: '0.9rem' }}>
                      You haven't placed any orders yet. Discover our artisanal chocolates and place your first order.
                    </p>
                    <Button variant="gold" onClick={() => navigate('/shop')} glow size="sm">
                      Explore Shop
                    </Button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {orders.map((ord) => (
                      <div
                        key={ord.id}
                        style={{
                          padding: '20px',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '6px',
                          background: 'rgba(0,0,0,0.2)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginBottom: '15px' }}>
                          <div>
                            <span style={{ fontWeight: 700, color: 'var(--cream)' }}>Reference: {ord.id}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--grey-light)', marginLeft: '15px' }}>
                              Placed: {ord.date}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {ord.paymentMethod && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--rose-gold)', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                                {ord.paymentMethod}
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '4px 10px',
                                borderRadius: '2px',
                                background: ord.status === 'Delivered' ? 'rgba(46, 204, 113, 0.2)' : ord.status === 'Cancelled' ? 'rgba(231, 76, 60, 0.2)' : 'rgba(241, 196, 15, 0.2)',
                                color: ord.status === 'Delivered' ? '#2ecc71' : ord.status === 'Cancelled' ? '#e74c3c' : '#f1c40f',
                              }}
                            >
                              {ord.status}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {ord.items.map((item, idx) => (
                            <div key={item.product?.id || idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                              <span style={{ color: 'var(--beige)' }}>
                                {item.product?.name || 'Chovique Product'} (x{item.quantity})
                              </span>
                              <span>₹{((item.product?.price || 0) * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '15px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
                          <div>
                            <span style={{ color: 'var(--gold)', marginRight: '10px' }}>Total Paid:</span>
                            <span>₹{ord.total.toLocaleString()}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            {ord.status === 'Processing' && (
                              <button
                                onClick={() => handleCancelOrder(ord.id)}
                                style={{
                                  background: 'transparent',
                                  color: 'var(--cream)',
                                  fontSize: '0.85rem',
                                  padding: '5px 12px',
                                  border: '1px solid #ff4d4f',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 77, 79, 0.2)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <X size={14} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }} />
                                Cancel
                              </button>
                            )}
                            <a 
                              href="#" 
                              onClick={(e) => handleViewInvoice(ord.id, e)}
                              style={{ 
                                color: 'var(--cream)', 
                                fontSize: '0.85rem', 
                                textDecoration: 'none',
                                padding: '5px 12px',
                                border: '1px solid var(--gold)',
                                borderRadius: '4px',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.2)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <FileText size={14} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }} />
                              View Invoice
                            </a>
                            <a 
                              href="#" 
                              onClick={(e) => handleDownloadInvoice(ord.id, e)}
                              style={{ 
                                color: 'var(--gold)', 
                                fontSize: '0.85rem', 
                                textDecoration: 'none',
                                padding: '5px 12px',
                                border: '1px solid var(--gold)',
                                borderRadius: '4px',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.2)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <Download size={14} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'text-bottom' }} />
                              Download
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* WISHLIST PANEL */}
            {activeTab === 'wishlist' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--cream)', marginBottom: '15px' }}>
                  Saved Favorites
                </h2>
                <p style={{ color: 'var(--beige)', marginBottom: '24px' }}>
                  Manage items you are monitoring for purchases.
                </p>
                <Button variant="gold" onClick={() => navigate('/wishlist')} glow>
                  View My Wishlist Grid
                </Button>
              </div>
            )}

            {/* ADDRESSES PANEL */}
            {activeTab === 'addresses' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--cream)', margin: 0 }}>
                    Shipping Address Book
                  </h2>
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => setShowAddAddressForm(!showAddAddressForm)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {showAddAddressForm ? <X size={14} /> : <Plus size={14} />}
                    {showAddAddressForm ? 'Cancel' : 'Add New Address'}
                  </Button>
                </div>

                {showAddAddressForm && (
                  <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--gold)', background: 'rgba(26,13,0,0.4)', marginBottom: '30px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--cream)', marginBottom: '15px' }}>
                      Add New Shipping Address
                    </h3>
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const title = (form.elements.namedItem('title') as HTMLInputElement).value;
                      const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                      const street = (form.elements.namedItem('street') as HTMLInputElement).value;
                      const city = (form.elements.namedItem('city') as HTMLInputElement).value;
                      const state = (form.elements.namedItem('state') as HTMLInputElement).value;
                      const zip = (form.elements.namedItem('zip') as HTMLInputElement).value;
                      const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;
                      const isDefault = (form.elements.namedItem('isDefault') as HTMLInputElement).checked;

                      addAddress({ title, name, street, city, state, zip, phone, isDefault });
                      form.reset();
                      setShowAddAddressForm(false);
                      alert('New address saved successfully.');
                    }} style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1fr 1fr', gap: '15px' }}>
                      <Input label="Address Label (e.g. Home, Office)" name="title" required />
                      <Input label="Recipient Full Name" name="name" required />
                      <div style={{ gridColumn: isMobileGrid ? 'span 1' : 'span 2' }}>
                        <Input label="Street Address" name="street" required />
                      </div>
                      <Input label="City" name="city" required />
                      <Input label="State" name="state" required />
                      <Input label="ZIP / Postal Code" name="zip" required />
                      <Input label="Phone Number" name="phone" required type="tel" />
                      
                      <div style={{ gridColumn: isMobileGrid ? 'span 1' : 'span 2', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                        <input type="checkbox" name="isDefault" id="is-default-address" style={{ accentColor: 'var(--gold)' }} />
                        <label htmlFor="is-default-address" style={{ color: 'var(--cream)', fontSize: '0.85rem', cursor: 'pointer' }}>
                          Make this my default shipping address
                        </label>
                      </div>

                      <div style={{ gridColumn: isMobileGrid ? 'span 1' : 'span 2', marginTop: '10px' }}>
                        <Button variant="gold" type="submit" glow>
                          Save Address
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      style={{
                        padding: '20px',
                        borderRadius: '6px',
                        border: addr.isDefault ? '2px solid var(--gold)' : '1px solid var(--glass-border)',
                        background: 'rgba(0,0,0,0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <h4 style={{ color: 'var(--gold)', fontSize: '0.95rem', margin: 0 }}>{addr.title}</h4>
                          {addr.isDefault && (
                            <span style={{ fontSize: '0.65rem', padding: '2px 8px', background: 'rgba(201, 168, 76, 0.15)', color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: '12px', fontWeight: 600 }}>
                              DEFAULT
                            </span>
                          )}
                        </div>
                        <p style={{ color: 'var(--cream)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                          <strong>{addr.name}</strong>
                          <br />
                          {addr.street}
                          <br />
                          {addr.city}, {addr.state} - {addr.zip}
                          <br />
                          Phone: {addr.phone}
                        </p>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                        {!addr.isDefault ? (
                          <button
                            onClick={() => setDefaultAddress(addr.id)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--gold)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Set as Default
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--grey-light)' }}>Primary Shipping</span>
                        )}
                        
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${addr.title}" address?`)) {
                              deleteAddress(addr.id);
                            }
                          }}
                          style={{ background: 'transparent', border: 'none', color: 'var(--rose-gold)', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* COUPONS PANEL */}
            {activeTab === 'coupons' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--cream)', marginBottom: '24px' }}>
                  My Available Coupons
                </h2>
                {isCouponsLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--beige)', padding: '30px 0', justifyContent: 'center' }}>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Loading your coupons...
                  </div>
                ) : couponsError ? (
                  <p style={{ color: '#e74c3c', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>{couponsError}</p>
                ) : coupons.length === 0 ? (
                  <p style={{ color: 'var(--grey-light)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                    No coupons available on your account right now.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {coupons.map((c) => {
                      const discountStr =
                        c.discount_type === 'PERCENTAGE' || (c.discount_percent && c.discount_percent > 0)
                          ? `${c.discount_percent || c.discountPercent}% OFF`
                          : c.discount_type === 'FIXED_AMOUNT' || (c.discount_amount && c.discount_amount > 0)
                          ? `₹${c.discount_amount} OFF`
                          : c.discount_type === 'FREE_SHIPPING'
                          ? 'Free Shipping'
                          : c.desc || 'Special Offer';

                      const isExpired = c.expires_at ? new Date(c.expires_at).getTime() < Date.now() : false;
                      const isActive = (c.status === 'ACTIVE' || (c.is_active !== false && c.status !== 'INACTIVE')) && !isExpired;
                      const statusLabel = isActive ? 'ACTIVE' : 'INACTIVE';

                      let expiryStr = 'No Expiry';
                      if (c.expires_at) {
                        try {
                          const d = new Date(c.expires_at);
                          expiryStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                        } catch {
                          expiryStr = c.expires_at;
                        }
                      } else if (c.exp) {
                        expiryStr = c.exp;
                      }

                      return (
                        <div
                          key={c.code}
                          style={{
                            padding: '20px',
                            borderRadius: '8px',
                            border: isActive ? '1px solid var(--gold)' : '1px solid var(--glass-border)',
                            background: isActive ? 'rgba(201, 168, 76, 0.04)' : 'rgba(0, 0, 0, 0.25)',
                            opacity: isActive ? 1 : 0.75,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--cream)', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {c.name || c.code}
                              </h3>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                <span
                                  style={{
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    color: 'var(--gold)',
                                    background: 'var(--dark-chocolate)',
                                    padding: '3px 10px',
                                    border: '1px dashed var(--gold)',
                                    borderRadius: '4px',
                                    letterSpacing: '0.5px',
                                  }}
                                >
                                  Code: {c.code}
                                </span>
                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--cream)' }}>
                                  Discount: {discountStr}
                                </span>
                              </div>
                            </div>

                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                letterSpacing: '1px',
                                padding: '4px 12px',
                                borderRadius: '4px',
                                background: isActive ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                                color: isActive ? '#2ecc71' : '#e74c3c',
                                border: isActive ? '1px solid #2ecc71' : '1px solid #e74c3c',
                                textTransform: 'uppercase',
                              }}
                            >
                              Status: {statusLabel}
                            </span>
                          </div>

                          {c.description && (
                            <p style={{ color: 'var(--grey-light)', fontSize: '0.85rem', margin: 0 }}>
                              {c.description}
                            </p>
                          )}

                          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--rose-gold)' }}>
                            <span>Expires: {expiryStr}</span>
                            {c.minimum_order_amount ? (
                              <span>Min Order: ₹{c.minimum_order_amount}</span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* NOTIFICATIONS PANEL */}
            {activeTab === 'notifications' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--cream)', marginBottom: '24px' }}>
                  Activity Alerts
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {notifications.length === 0 ? (
                    <p style={{ color: 'var(--grey-light)', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', margin: '40px 0' }}>
                      No new activity alerts or notifications.
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          padding: '16px',
                          borderRadius: '4px',
                          background: 'rgba(201, 168, 76, 0.04)',
                          border: '1px solid var(--gold)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ color: 'var(--cream)', fontSize: '0.9rem' }}>{n.text}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--grey-light)' }}>{n.date}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <Button
                            variant="glass"
                            size="sm"
                            onClick={() => {
                              removeNotification(n.id);
                              if (n.type === 'support') {
                                setActiveTab('help');
                              } else if (n.type === 'order') {
                                setActiveTab('orders');
                              }
                            }}
                          >
                            View
                          </Button>
                          <Button
                            variant="text"
                            size="sm"
                            onClick={() => removeNotification(n.id)}
                            style={{ color: 'var(--rose-gold)' }}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* INVOICES PANEL */}
            {activeTab === 'invoices' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--cream)', marginBottom: '24px' }}>
                  Historical Invoices
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      style={{
                        padding: '16px',
                        borderRadius: '4px',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <h4 style={{ color: 'var(--cream)', fontSize: '0.95rem', margin: 0 }}>Invoice for {ord.id}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--grey-light)' }}>Placed on {ord.date}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--cream)', marginRight: '8px' }}>₹{ord.total.toLocaleString()}</span>
                        <Button
                          variant="glass"
                          size="sm"
                          onClick={(e) => handleViewInvoice(ord.id, e)}
                        >
                          <FileText size={14} />
                          View
                        </Button>
                        <Button
                          variant="gold"
                          size="sm"
                          onClick={(e) => handleDownloadInvoice(ord.id, e)}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SETTINGS PANEL */}
            {activeTab === 'settings' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--cream)', marginBottom: '24px' }}>
                  Account Preferences & Settings
                </h2>
                
                <form onSubmit={handlePreferencesSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--gold)', margin: 0 }}>
                      Personal Demographics
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1fr 1fr', gap: '20px' }}>
                      <Input
                        label="Date of Birth"
                        type="date"
                        name="dob"
                        defaultValue={user.profile.dob || '1995-08-15'}
                      />
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--grey-light)', marginBottom: '6px', fontWeight: 600 }}>
                          Gender
                        </label>
                        <select
                          name="gender"
                          defaultValue={user.profile.gender || 'Female'}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '4px',
                            color: 'var(--cream)',
                            fontSize: '0.9rem',
                            outline: 'none',
                          }}
                        >
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Non-binary">Non-binary</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>
                  </div>



                  {preferencesError && (
                    <div
                      style={{
                        padding: '12px',
                        background: 'rgba(231, 76, 60, 0.1)',
                        border: '1px solid #e74c3c',
                        color: '#e74c3c',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                      }}
                    >
                      {preferencesError}
                    </div>
                  )}

                  {preferencesSaved && (
                    <div
                      style={{
                        padding: '12px',
                        background: 'rgba(46, 204, 113, 0.1)',
                        border: '1px solid #2ecc71',
                        color: '#2ecc71',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <CheckCircle size={16} /> Account preferences saved successfully.
                    </div>
                  )}

                  <div className="glass-panel" style={{ padding: '20px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ color: 'var(--gold)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                          Security Credentials
                        </h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--grey-light)' }}>
                          Update your account password using your current password.
                        </p>
                      </div>
                      <Button
                        variant="glass"
                        size="sm"
                        type="button"
                        onClick={() => {
                          setShowChangePasswordForm(!showChangePasswordForm);
                          setChangePasswordError('');
                          setChangePasswordMessage('');
                        }}
                      >
                        {showChangePasswordForm ? 'Close Password Form' : 'Change Password'}
                      </Button>
                    </div>

                    {showChangePasswordForm && (
                      <form onSubmit={handleChangePasswordSubmit} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <Input
                          label="Current Password"
                          type="password"
                          placeholder="Enter current password"
                          value={changePasswordForm.currentPassword}
                          onChange={(e) => setChangePasswordForm({ ...changePasswordForm, currentPassword: e.target.value })}
                        />
                        <Input
                          label="New Password"
                          type="password"
                          placeholder="Enter new password (min 6 chars)"
                          value={changePasswordForm.newPassword}
                          onChange={(e) => setChangePasswordForm({ ...changePasswordForm, newPassword: e.target.value })}
                        />
                        <Input
                          label="Confirm New Password"
                          type="password"
                          placeholder="Confirm new password"
                          value={changePasswordForm.confirmPassword}
                          onChange={(e) => setChangePasswordForm({ ...changePasswordForm, confirmPassword: e.target.value })}
                        />

                        {changePasswordError && (
                          <div style={{ padding: '10px', background: 'rgba(231, 76, 60, 0.1)', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: '4px', fontSize: '0.85rem' }}>
                            {changePasswordError}
                          </div>
                        )}

                        {changePasswordMessage && (
                          <div style={{ padding: '10px', background: 'rgba(46, 204, 113, 0.1)', border: '1px solid #2ecc71', color: '#2ecc71', borderRadius: '4px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle size={14} /> {changePasswordMessage}
                          </div>
                        )}

                        <div>
                          <Button variant="gold" size="sm" type="submit" disabled={isChangingPassword} glow>
                            {isChangingPassword ? (
                              <>
                                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Updating...
                              </>
                            ) : (
                              'Update Password'
                            )}
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '15px' }}>
                    <Button variant="gold" type="submit" glow disabled={isPreferencesSaving}>
                      {isPreferencesSaving ? (
                        <>
                          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving Settings...
                        </>
                      ) : (
                        'Save Settings'
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* HELP & COMPLAINTS PANEL */}
            {activeTab === 'help' && (
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--cream)', marginBottom: '24px' }}>
                  Help & Support Center
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1.2fr 1fr', gap: '30px', alignItems: 'flex-start' }}>
                  {/* Raise Complaint Form */}
                  <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--gold)', marginBottom: '15px' }}>
                      Submit a New Support Complaint
                    </h3>
                    <p style={{ color: 'var(--beige)', fontSize: '0.85rem', marginBottom: '20px' }}>
                      Our Atelier support desk will inspect and resolve your issue within 24-48 business hours.
                    </p>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const cat = (form.elements.namedItem('category') as HTMLSelectElement).value as any;
                      const desc = (form.elements.namedItem('description') as HTMLTextAreaElement).value;
                      if (!desc.trim()) return;
                      addSupportTicket(cat, desc);
                      form.reset();
                      alert('Complaint raised successfully. You can track its status in the history log.');
                    }}>
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--grey-light)', marginBottom: '6px', fontWeight: 600 }}>
                          Select Complaint Category
                        </label>
                        <select
                          name="category"
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '4px',
                            color: 'var(--cream)',
                            fontSize: '0.9rem',
                            outline: 'none',
                          }}
                        >
                          <option value="Chocolate melted">Chocolate melted</option>
                          <option value="Slow delivery">Slow delivery</option>
                          <option value="Return order was not accepting">Return order was not accepting</option>
                          <option value="Refund amount are not debited in mentioned days">Refund amount are not debited in mentioned days</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--grey-light)', marginBottom: '6px', fontWeight: 600 }}>
                          Describe the Problem
                        </label>
                        <textarea
                          name="description"
                          required
                          placeholder="Please provide details such as Order Reference and exact description of the issue..."
                          rows={5}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '4px',
                            color: 'var(--cream)',
                            fontSize: '0.9rem',
                            outline: 'none',
                            resize: 'none',
                          }}
                        />
                      </div>

                      <Button variant="gold" type="submit" glow>
                        Submit Support Ticket
                      </Button>
                    </form>
                  </div>

                  {/* Complaint Logs History */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--cream)', marginBottom: '15px' }}>
                        Your Support History
                      </h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {tickets.filter(t => t.customerId === user.id).length === 0 ? (
                          <p style={{ color: 'var(--grey-light)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                            You have no support complaints raised.
                          </p>
                        ) : (
                          tickets.filter(t => t.customerId === user.id).map(ticket => {
                            const isResolved = ticket.status === 'Resolved';
                            return (
                              <div
                                key={ticket.id}
                                style={{
                                  padding: '16px',
                                  background: 'rgba(0,0,0,0.2)',
                                  borderRadius: '6px',
                                  borderLeft: isResolved ? '3px solid #2ecc71' : '3px solid var(--gold)',
                                  borderTop: '1px solid var(--glass-border)',
                                  borderRight: '1px solid var(--glass-border)',
                                  borderBottom: '1px solid var(--glass-border)',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '0.85rem' }}>
                                    {ticket.id}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: '0.7rem',
                                      padding: '2px 8px',
                                      borderRadius: '12px',
                                      background: isResolved ? 'rgba(46, 204, 113, 0.15)' : 'rgba(201, 168, 76, 0.15)',
                                      color: isResolved ? '#2ecc71' : 'var(--gold)',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {ticket.status}
                                  </span>
                                </div>
                                
                                <span style={{ fontSize: '0.75rem', color: 'var(--grey-light)', display: 'block', marginBottom: '8px' }}>
                                  Category: <strong>{ticket.category}</strong> · Opened: {ticket.date}
                                </span>
                                
                                <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: 'var(--cream)', lineHeight: '1.4' }}>
                                  {ticket.description}
                                </p>

                                {ticket.adminNotes && (
                                  <div
                                    style={{
                                      padding: '10px 12px',
                                      background: 'rgba(201, 168, 76, 0.08)',
                                      border: '1px dashed rgba(201, 168, 76, 0.3)',
                                      borderRadius: '4px',
                                      fontSize: '0.8rem',
                                      color: 'var(--beige)',
                                      marginBottom: '12px',
                                    }}
                                  >
                                    <strong style={{ color: 'var(--gold)', display: 'block', marginBottom: '4px' }}>Atelier Resolution Notes:</strong>
                                    {ticket.adminNotes}
                                  </div>
                                )}

                                {isResolved && (
                                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', marginTop: '10px' }}>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--cream)', display: 'block', marginBottom: '6px' }}>
                                      Was this issue resolved to your satisfaction?
                                    </span>
                                    
                                    {ticket.customerResolutionFeedback ? (
                                      <span style={{ fontSize: '0.8rem', color: ticket.customerResolutionFeedback === 'Resolved' ? '#2ecc71' : 'var(--rose-gold)', fontWeight: 600 }}>
                                        Feedback submitted: {ticket.customerResolutionFeedback === 'Resolved' ? 'Resolved ✓' : 'Not Resolved ✗'}
                                      </span>
                                    ) : (
                                      <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                          onClick={() => {
                                            submitTicketFeedback(ticket.id, 'Resolved');
                                            acknowledgeTicketNotification(ticket.id);
                                          }}
                                          style={{
                                            padding: '4px 10px',
                                            fontSize: '0.75rem',
                                            background: 'rgba(46, 204, 113, 0.15)',
                                            color: '#2ecc71',
                                            border: '1px solid rgba(46, 204, 113, 0.3)',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                          }}
                                        >
                                          Yes, Resolved
                                        </button>
                                        <button
                                          onClick={() => {
                                            submitTicketFeedback(ticket.id, 'Not Resolved');
                                            acknowledgeTicketNotification(ticket.id);
                                          }}
                                          style={{
                                            padding: '4px 10px',
                                            fontSize: '0.75rem',
                                            background: 'rgba(183, 110, 121, 0.15)',
                                            color: 'var(--rose-gold)',
                                            border: '1px solid rgba(183, 110, 121, 0.3)',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                          }}
                                        >
                                          No, Still Broken
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </motion.div>
  );
};
export default CustomerDashboard;
