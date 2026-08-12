import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Download,
  Phone,
  Search,
  Printer,
  ArrowLeft,
  Check,
  Truck,
  Package,
  Clock,
  PackageCheck
} from 'lucide-react';
import { useApp } from '../../app/providers';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { pageTransition } from '../../lib/framer';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import { BASE_URL } from '../../lib/api';
import { orderService } from '../../services/orderService';
import { walletService, type CoinTransaction } from '../../services/walletService';
import type { UserCoupon, CustomerAddress } from '../../types';
import { WishlistPage } from '../wishlist/WishlistPage';

type CustomerTab =
  | 'overview'
  | 'rewards'
  | 'profile'
  | 'orders'
  | 'addresses'
  | 'coupons'
  | 'notifications'
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
    updateAddress,
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
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sidebarGroups = [
    {
      groupTitle: 'ACCOUNT',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'addresses', label: 'Addresses', icon: MapPin },
        { id: 'settings', label: 'Account Settings', icon: Settings },
      ],
    },
    {
      groupTitle: 'ORDERS',
      items: [
        { id: 'orders', label: 'Order History', icon: ShoppingBag },
      ],
    },
    {
      groupTitle: 'SHOPPING',
      items: [
        { id: 'coupons', label: 'My Coupons', icon: Tag },
      ],
    },
    {
      groupTitle: 'REWARDS',
      items: [
        { id: 'rewards', label: 'Rewards & Coins', icon: Coins },
      ],
    },
    {
      groupTitle: 'SUPPORT',
      items: [
        { id: 'help', label: 'Help & Support', icon: AlertTriangle },
      ],
    },
  ];

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

  // --- Order Navigation & Selection State ---
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderSubView, setOrderSubView] = useState<'list' | 'details' | 'invoice'>('list');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');
  const [orderSortOrder, setOrderSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [isPdfDownloading, setIsPdfDownloading] = useState<boolean>(false);

  const handleDownloadInvoice = async (orderId: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    try {
      setIsPdfDownloading(true);
      await orderService.downloadInvoicePdf(orderId);
    } catch (err) {
      console.error('Failed to download PDF invoice from backend', err);
      try {
        const html = await orderService.getInvoiceHtml(orderId);
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(html);
          win.document.close();
          setTimeout(() => win.print(), 500);
        }
      } catch {
        alert('Could not generate or download invoice PDF. Please try again.');
      }
    } finally {
      setIsPdfDownloading(false);
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

  // --- Settings form controlled state (dob + gender) ---
  const [settingsForm, setSettingsForm] = useState({
    dob: '',
    gender: '',
  });

  // Sync settingsForm from user profile whenever user is loaded/changed
  useEffect(() => {
    if (user) {
      setSettingsForm({
        dob: user.profile.dob || '',
        gender: user.profile.gender || '',
      });
    }
  }, [user]);

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

  // --- Rewards & Wallet Transactions State ---
  const [walletTxs, setWalletTxs] = useState<CoinTransaction[]>([]);
  const [walletTxsTotal, setWalletTxsTotal] = useState(0);
  const [walletTxsPage, setWalletTxsPage] = useState(1);
  const [walletTxsPages, setWalletTxsPages] = useState(1);
  const [walletTxTypeFilter, setWalletTxTypeFilter] = useState<'ALL' | 'EARN' | 'REDEEM' | 'ADJUSTMENT'>('ALL');
  const [walletDateFrom, setWalletDateFrom] = useState('');
  const [walletDateTo, setWalletDateTo] = useState('');
  const [isWalletTxsLoading, setIsWalletTxsLoading] = useState(false);
  const [walletTxsError, setWalletTxsError] = useState('');

  const fetchWalletTransactions = useCallback(async () => {
    setIsWalletTxsLoading(true);
    setWalletTxsError('');
    try {
      const res = await walletService.getPaginatedTransactions(walletTxTypeFilter, walletTxsPage, 10);
      setWalletTxs(res.items || []);
      setWalletTxsTotal(res.total || 0);
      setWalletTxsPages(res.pages || 1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load wallet transactions.';
      setWalletTxsError(msg);
    } finally {
      setIsWalletTxsLoading(false);
    }
  }, [walletTxTypeFilter, walletTxsPage]);

  useEffect(() => {
    if (activeTab === 'rewards') {
      fetchWalletTransactions();
    }
  }, [activeTab, fetchWalletTransactions]);

  // --- Address Management State & Handlers ---
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressFormError, setAddressFormError] = useState<string>('');
  const [isAddressSaving, setIsAddressSaving] = useState(false);
  const [addressForm, setAddressForm] = useState({
    title: 'Home',
    name: '',
    street: '',
    city: '',
    state: 'Telangana',
    zip: '',
    phone: '',
    isDefault: false,
  });

  const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Chandigarh'
  ];

  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      title: 'Home',
      name: user?.name || '',
      street: '',
      city: '',
      state: 'Telangana',
      zip: '',
      phone: user?.profile?.phone || '',
      isDefault: addresses.length === 0,
    });
    setAddressFormError('');
    setShowAddAddressForm(true);
  };

  const handleEditAddress = (addr: CustomerAddress) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      title: addr.title,
      name: addr.name,
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      phone: addr.phone,
      isDefault: addr.isDefault,
    });
    setAddressFormError('');
    setShowAddAddressForm(true);
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressFormError('');

    const title = addressForm.title.trim();
    const name = addressForm.name.trim();
    const street = addressForm.street.trim();
    const city = addressForm.city.trim();
    const state = addressForm.state.trim();
    const zip = addressForm.zip.trim();
    const phone = addressForm.phone.trim();

    if (!title) {
      setAddressFormError('Address Label is required.');
      return;
    }
    if (title.length < 2 || title.length > 30) {
      setAddressFormError('Address Label must be between 2 and 30 characters.');
      return;
    }
    if (!/[a-zA-Z0-9]/.test(title)) {
      setAddressFormError('Address Label cannot contain only special characters.');
      return;
    }

    if (!name) {
      setAddressFormError('Recipient Full Name is required.');
      return;
    }
    if (name.length < 2 || name.length > 100) {
      setAddressFormError('Recipient Full Name must be between 2 and 100 characters.');
      return;
    }
    if (!/[a-zA-Z]/.test(name)) {
      setAddressFormError('Recipient Full Name must contain valid letters.');
      return;
    }

    if (!street) {
      setAddressFormError('Street Address is required.');
      return;
    }
    if (street.length > 250) {
      setAddressFormError('Street Address cannot exceed 250 characters.');
      return;
    }

    if (!city) {
      setAddressFormError('City is required.');
      return;
    }
    if (city.length < 2 || city.length > 100) {
      setAddressFormError('City must be between 2 and 100 characters.');
      return;
    }
    if (/^\d+$/.test(city)) {
      setAddressFormError('City cannot be numbers-only.');
      return;
    }

    if (!state) {
      setAddressFormError('State is required.');
      return;
    }

    if (!/^\d{6}$/.test(zip)) {
      setAddressFormError('PIN / Postal Code must be exactly 6 digits.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      setAddressFormError('Phone number must be a valid 10-digit Indian number starting with 6, 7, 8, or 9.');
      return;
    }

    setIsAddressSaving(true);
    try {
      if (editingAddressId) {
        await updateAddress(editingAddressId, {
          title,
          name,
          street,
          city,
          state,
          zip,
          phone,
          isDefault: addressForm.isDefault,
        });
      } else {
        await addAddress({
          title,
          name,
          street,
          city,
          state,
          zip,
          phone,
          isDefault: addressForm.isDefault,
        });
      }
      setShowAddAddressForm(false);
      setEditingAddressId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save address.';
      setAddressFormError(msg);
    } finally {
      setIsAddressSaving(false);
    }
  };

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

    const trimmedName = profileForm.name.trim();
    const trimmedPhone = profileForm.phone.trim();

    // Frontend Field Validation
    if (!trimmedName) {
      setProfileError('Full Name is required.');
      return;
    }
    if (trimmedName.length < 2) {
      setProfileError('Full Name must be at least 2 characters.');
      return;
    }
    if (trimmedName.length > 100) {
      setProfileError('Full Name cannot exceed 100 characters.');
      return;
    }
    if (!/[a-zA-Z]/.test(trimmedName)) {
      setProfileError('Full Name must contain valid letters.');
      return;
    }

    if (trimmedPhone && !/^[6-9]\d{9}$/.test(trimmedPhone)) {
      setProfileError('Please enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9.');
      return;
    }

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
        name: trimmedName,
        phone: trimmedPhone,
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

  const handlePreferencesSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPreferencesError('');
    setPreferencesSaved(false);

    // --- Frontend Validation ---
    if (!settingsForm.gender) {
      setPreferencesError('Please select a gender.');
      return;
    }
    if (!settingsForm.dob) {
      setPreferencesError('Date of Birth is required.');
      return;
    }
    const dobDate = new Date(settingsForm.dob);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(dobDate.getTime())) {
      setPreferencesError('Please enter a valid Date of Birth.');
      return;
    }
    if (dobDate >= today) {
      setPreferencesError('Date of Birth must be in the past.');
      return;
    }
    const ageYears = today.getFullYear() - dobDate.getFullYear() -
      (today < new Date(today.getFullYear(), dobDate.getMonth(), dobDate.getDate()) ? 1 : 0);
    if (ageYears < 13) {
      setPreferencesError('You must be at least 13 years old.');
      return;
    }
    if (ageYears > 120) {
      setPreferencesError('Please enter a valid Date of Birth.');
      return;
    }

    setIsPreferencesSaving(true);
    try {
      await updateUserProfile({
        dob: settingsForm.dob,
        gender: settingsForm.gender,
      });
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

    const { currentPassword, newPassword, confirmPassword } = changePasswordForm;

    if (!currentPassword) {
      setChangePasswordError('Current password is required.');
      return;
    }
    if (!newPassword) {
      setChangePasswordError('New password is required.');
      return;
    }
    if (newPassword.length < 6) {
      setChangePasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword === currentPassword) {
      setChangePasswordError('New password must be different from your current password.');
      return;
    }
    if (!confirmPassword) {
      setChangePasswordError('Please confirm your new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePasswordError('New password and confirm password do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await authService.changePassword(currentPassword, newPassword, confirmPassword);
      setChangePasswordMessage(res.message || 'Password changed successfully.');
      setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setShowChangePasswordForm(false), 2000);
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
      {/* Workspace 2-Column Grid Layout */}
      <div className="customer-workspace-layout">
        {/* Mobile Overlay Backdrop */}
        <div
          className={`admin-sidebar-backdrop ${isSidebarOpen ? 'open' : ''}`}
          onClick={() => setIsSidebarOpen(false)}
          style={{ zIndex: 119 }}
        />

        {/* Left Sticky Sidebar Menu */}
        <aside className={`customer-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          {/* Mobile Drawer Close Header */}
          <div className="sidebar-close-btn" style={{ textAlign: 'right', marginBottom: '10px' }}>
            <button
              onClick={() => setIsSidebarOpen(false)}
              style={{ background: 'none', border: 'none', color: '#c9a84c', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 700 }}
            >
              <X size={18} /> CLOSE
            </button>
          </div>



          {/* Grouped Sidebar Items */}
          {sidebarGroups.map((group) => (
            <div key={group.groupTitle} style={{ marginBottom: '6px' }}>
              <div className="sidebar-group-title">{group.groupTitle}</div>
              {group.items.map((menuItem) => {
                const Icon = menuItem.icon;
                const isActive = activeTab === menuItem.id;
                return (
                  <button
                    key={menuItem.id}
                    onClick={() => {
                      setActiveTab(menuItem.id as CustomerTab);
                      setIsSidebarOpen(false);
                    }}
                    className={`dashboard-menu-btn ${isActive ? 'active' : ''}`}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon size={18} />
                      <span>{menuItem.label}</span>
                    </div>
                    {(menuItem as any).badge !== undefined && (menuItem as any).badge > 0 && (
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
                        {(menuItem as any).badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        {/* Right Main Content Workspace Panel */}
        <main className="customer-workspace-main">
          {/* Mobile Drawer Trigger Button */}
          <button
            className="dashboard-mobile-trigger"
            onClick={() => setIsSidebarOpen(true)}
            style={{ marginBottom: '20px' }}
          >
            <Menu size={18} />
            <span>Customer Dashboard Menu</span>
          </button>

          {/* OVERVIEW PANEL */}
          {activeTab === 'overview' && (
            <div>
              {/* Welcome Title Banner */}
              <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.1rem', color: '#f5efe6', margin: '0 0 6px 0', fontWeight: 700 }}>
                  Welcome back, {user.name.split(' ')[0]}! 👋
                </h1>
                <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.92rem', margin: 0 }}>
                  Here's what's happening with your account today.
                </p>
              </div>

              {/* Support Tickets Notifications Alert */}
              {tickets.filter(t => t.customerId === user.id && t.status === 'Resolved' && !t.notified).map(t => (
                <div
                  key={t.id}
                  style={{
                    padding: '16px 20px',
                    border: '1px solid #c9a84c',
                    background: 'rgba(201, 168, 76, 0.1)',
                    borderRadius: '10px',
                    marginBottom: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ flex: 1, marginRight: '15px' }}>
                    <span style={{ fontWeight: 700, color: '#c9a84c', display: 'block', fontSize: '0.9rem' }}>
                      Support Complaint Resolved ({t.id})
                    </span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#f5efe6' }}>
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

              {/* 4 Summary Cards Grid */}
              <div className="dashboard-grid-stats">
                {/* Card 1: TOTAL ORDERS */}
                <div className="dashboard-stat-card" onClick={() => setActiveTab('orders')}>
                  <div>
                    <span className="stat-card-title">TOTAL ORDERS</span>
                    <span className="stat-card-value">{orders.length}</span>
                  </div>
                  <div className="stat-card-link">
                    <span>View all orders</span>
                    <span>→</span>
                  </div>
                </div>

                {/* Card 2: REWARD COINS */}
                <div className="dashboard-stat-card" onClick={() => setActiveTab('rewards')}>
                  <div>
                    <span className="stat-card-title">REWARD COINS</span>
                    <span className="stat-card-value">{wallet?.coin_balance ?? 219}</span>
                  </div>
                  <div className="stat-card-link">
                    <span>Worth ₹{(wallet?.rupee_value ?? 21.9).toFixed(2)} in rewards</span>
                    <span>→</span>
                  </div>
                </div>

                {/* Card 3: AVAILABLE COUPONS */}
                <div className="dashboard-stat-card" onClick={() => setActiveTab('coupons')}>
                  <div>
                    <span className="stat-card-title">AVAILABLE COUPONS</span>
                    <span className="stat-card-value">3</span>
                  </div>
                  <div className="stat-card-link">
                    <span>View all coupons</span>
                    <span>→</span>
                  </div>
                </div>
              </div>

              {/* 2-Column Activity Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1fr 1fr', gap: '28px' }}>
                {/* Left Column: Recent Orders */}
                <div
                  style={{
                    background: 'rgba(18, 14, 11, 0.95)',
                    border: '1px solid rgba(201, 168, 76, 0.25)',
                    borderRadius: '12px',
                    padding: '24px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: '#f5efe6', margin: 0 }}>
                      Recent Orders
                    </h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      style={{ background: 'none', border: 'none', color: '#c9a84c', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      View All Orders →
                    </button>
                  </div>

                  {orders.length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', fontSize: '0.9rem' }}>No recent orders placed.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {orders.slice(0, 4).map((ord) => (
                        <div
                          key={ord.id}
                          style={{
                            padding: '14px 16px',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '12px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <img
                              src={ord.items[0]?.product?.image || ord.items[0]?.product?.images?.[0] || 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=120&q=80'}
                              alt="Product"
                              style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(201,168,76,0.2)' }}
                            />
                            <div>
                              <span style={{ fontWeight: 700, color: '#f5efe6', fontSize: '0.9rem', display: 'block' }}>{ord.id}</span>
                              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginTop: '2px' }}>
                                {ord.date} · {ord.items.length} {ord.items.length === 1 ? 'Item' : 'Items'}
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontWeight: 700, color: '#f5efe6', fontSize: '0.92rem', display: 'block' }}>
                                ₹{ord.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  display: 'inline-block',
                                  marginTop: '4px',
                                  background:
                                    ord.status === 'Delivered' || ord.status === 'Confirmed'
                                      ? 'rgba(46, 204, 113, 0.15)'
                                      : ord.status === 'Cancelled'
                                      ? 'rgba(231, 76, 60, 0.15)'
                                      : 'rgba(241, 196, 15, 0.15)',
                                  color:
                                    ord.status === 'Delivered' || ord.status === 'Confirmed'
                                      ? '#2ecc71'
                                      : ord.status === 'Cancelled'
                                      ? '#e74c3c'
                                      : '#f1c40f',
                                  border:
                                    ord.status === 'Delivered' || ord.status === 'Confirmed'
                                      ? '1px solid rgba(46, 204, 113, 0.3)'
                                      : ord.status === 'Cancelled'
                                      ? '1px solid rgba(231, 76, 60, 0.3)'
                                      : '1px solid rgba(241, 196, 15, 0.3)',
                                }}
                              >
                                {ord.status}
                              </span>
                            </div>

                            <button
                              onClick={() => setActiveTab('orders')}
                              style={{
                                padding: '8px 14px',
                                background: 'transparent',
                                border: '1px solid rgba(201, 168, 76, 0.4)',
                                color: '#c9a84c',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Available Coupons */}
                <div
                  style={{
                    background: 'rgba(18, 14, 11, 0.95)',
                    border: '1px solid rgba(201, 168, 76, 0.25)',
                    borderRadius: '12px',
                    padding: '24px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: '#f5efe6', margin: 0 }}>
                      Available Coupons
                    </h3>
                    <button
                      onClick={() => setActiveTab('coupons')}
                      style={{ background: 'none', border: 'none', color: '#c9a84c', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      View All Coupons →
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {[
                      { code: 'CHOC10', title: 'Chocolate Delight', desc: '10% OFF on your chocolate order.', terms: 'Min. order: ₹999 · Valid till 31 Aug 2026' },
                      { code: 'CHOC100', title: 'Chocolate Delight', desc: '10% OFF on your chocolate order.', terms: 'Min. order: ₹999 · Valid till 31 Aug 2026' },
                      { code: 'WELCOME5', title: 'Welcome Offer', desc: '5% OFF on your first order.', terms: 'Min. order: ₹500 · No Expiry' },
                    ].map((coupon) => (
                      <div key={coupon.code} className="coupon-ticket-card">
                        <div className="coupon-ticket-left">
                          <span className="coupon-ticket-code">{coupon.code}</span>
                        </div>
                        <div className="coupon-ticket-right">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <h4 style={{ color: '#f5efe6', margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 700 }}>{coupon.title}</h4>
                              <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '0.78rem' }}>{coupon.desc}</p>
                            </div>
                            <button
                              className="coupon-copy-btn"
                              onClick={() => handleCopyCouponCode(coupon.code)}
                            >
                              {copiedCode === coupon.code ? 'Copied!' : 'Copy Code'}
                            </button>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '8px', display: 'block' }}>
                            {coupon.terms}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
                <div style={{ marginBottom: '28px' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: '#f5efe6', margin: '0 0 6px 0', fontWeight: 700 }}>
                    My Profile Details
                  </h2>
                  <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem', margin: 0 }}>
                    Manage your personal information and profile details.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '220px 1fr', gap: '40px', alignItems: 'flex-start' }}>
                  {/* Left Column: Profile Picture Uploader */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
                    <span style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>
                      Profile Image
                    </span>

                    {avatarPreviewUrl || user.profile.avatarUrl ? (
                      <img
                        src={avatarPreviewUrl || user.profile.avatarUrl!}
                        alt="Profile Preview"
                        style={{
                          width: '120px',
                          height: '120px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '2px solid #c9a84c',
                          boxShadow: '0 0 20px rgba(201, 168, 76, 0.3)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '120px',
                          height: '120px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #c9a84c 0%, #e5c875 100%)',
                          color: '#0f0c0a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '2.5rem',
                          fontWeight: 800,
                          boxShadow: '0 0 20px rgba(201, 168, 76, 0.35)',
                        }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      id="profile-img-upload"
                      style={{ display: 'none' }}
                      disabled={isAvatarUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setAvatarError('');
                        
                        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                        const ext = file.name.split('.').pop()?.toLowerCase();
                        const allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
                        
                        if (!allowedTypes.includes(file.type) && (!ext || !allowedExts.includes(ext))) {
                          setAvatarError('Only JPG, JPEG, PNG, and WebP files are allowed.');
                          return;
                        }
                        if (file.size > 5 * 1024 * 1024) {
                          setAvatarError('Maximum allowed image size is 5MB.');
                          return;
                        }
                        setPendingAvatarFile(file);
                        setAvatarPreviewUrl(URL.createObjectURL(file));
                      }}
                    />

                    <label
                      htmlFor="profile-img-upload"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'transparent',
                        color: '#c9a84c',
                        border: '1px solid rgba(201, 168, 76, 0.4)',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: isAvatarUploading ? 'not-allowed' : 'pointer',
                        opacity: isAvatarUploading ? 0.6 : 1,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {isAvatarUploading ? (
                        <>
                          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Uploading...
                        </>
                      ) : (
                        <>
                          <UploadCloud size={16} /> Upload Image
                        </>
                      )}
                    </label>

                    {avatarError && (
                      <p style={{ color: '#e74c3c', fontSize: '0.78rem', margin: 0, fontWeight: 600 }}>{avatarError}</p>
                    )}
                  </div>

                  {/* Right Column: Profile Form Fields */}
                  <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '580px' }}>
                    {/* Full Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.88rem', color: '#f5efe6', fontWeight: 600, marginBottom: '8px' }}>
                        Full Name <span style={{ color: '#c9a84c' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => {
                          setProfileForm({ ...profileForm, name: e.target.value });
                          if (profileError) setProfileError('');
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '6px',
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(201, 168, 76, 0.3)',
                          color: '#f5efe6',
                          fontSize: '0.9rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                        placeholder="Enter your full name"
                      />
                    </div>

                    {/* Email Address */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.88rem', color: '#f5efe6', fontWeight: 600, marginBottom: '8px' }}>
                        Email Address <span style={{ color: '#c9a84c' }}>*</span>
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type="email"
                          value={profileForm.email}
                          disabled
                          style={{
                            width: '100%',
                            padding: '12px 110px 12px 14px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: '0.9rem',
                            cursor: 'not-allowed',
                            boxSizing: 'border-box',
                          }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            right: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'rgba(46, 204, 113, 0.15)',
                            color: '#2ecc71',
                            border: '1px solid rgba(46, 204, 113, 0.3)',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                          }}
                        >
                          <CheckCircle size={13} /> Verified
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', fontStyle: 'italic', display: 'block', marginTop: '6px' }}>
                        Email cannot be changed
                      </span>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.88rem', color: '#f5efe6', fontWeight: 600, marginBottom: '8px' }}>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => {
                          setProfileForm({ ...profileForm, phone: e.target.value });
                          if (profileError) setProfileError('');
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: '6px',
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(201, 168, 76, 0.3)',
                          color: '#f5efe6',
                          fontSize: '0.9rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                        placeholder="e.g. 9876543210"
                      />
                    </div>

                    {/* Error Banner */}
                    {profileError && (
                      <div
                        style={{
                          padding: '12px 16px',
                          background: 'rgba(231, 76, 60, 0.12)',
                          border: '1px solid #e74c3c',
                          color: '#e74c3c',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                        }}
                      >
                        {profileError}
                      </div>
                    )}

                    {/* Success Banner */}
                    {profileSaved && (
                      <div
                        style={{
                          padding: '12px 16px',
                          background: 'rgba(46, 204, 113, 0.12)',
                          border: '1px solid #2ecc71',
                          color: '#2ecc71',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <CheckCircle size={16} /> Profile credentials updated successfully.
                      </div>
                    )}

                    {/* Submit Button */}
                    <div style={{ marginTop: '8px' }}>
                      <button
                        type="submit"
                        disabled={isProfileSaving || isAvatarUploading}
                        style={{
                          padding: '12px 28px',
                          borderRadius: '6px',
                          background: 'linear-gradient(135deg, #c9a84c 0%, #e5c875 100%)',
                          color: '#0f0c0a',
                          border: 'none',
                          fontSize: '0.92rem',
                          fontWeight: 700,
                          cursor: isProfileSaving || isAvatarUploading ? 'not-allowed' : 'pointer',
                          opacity: isProfileSaving || isAvatarUploading ? 0.7 : 1,
                          boxShadow: '0 4px 14px rgba(201, 168, 76, 0.35)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        {isProfileSaving ? (
                          <>
                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ORDERS PANEL */}
            {activeTab === 'orders' && (
              <div>
                {/* 1. ORDER DETAILS SUB-VIEW */}
                {selectedOrder && orderSubView === 'details' && (
                  <div>
                    {/* Back button */}
                    <button
                      type="button"
                      onClick={() => { setSelectedOrder(null); setOrderSubView('list'); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#c9a84c',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '20px',
                        padding: 0,
                      }}
                    >
                      <ArrowLeft size={16} /> Back to Orders
                    </button>

                    {/* Order Title Header */}
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '8px' }}>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#f5efe6', margin: 0, fontWeight: 700 }}>
                        Order #{selectedOrder.id}
                      </h2>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          padding: '4px 14px',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          background:
                            selectedOrder.status === 'Delivered' || selectedOrder.status === 'Confirmed'
                              ? 'rgba(46, 204, 113, 0.18)'
                              : selectedOrder.status === 'Cancelled'
                              ? 'rgba(231, 76, 60, 0.18)'
                              : 'rgba(241, 196, 15, 0.18)',
                          color:
                            selectedOrder.status === 'Delivered' || selectedOrder.status === 'Confirmed'
                              ? '#2ecc71'
                              : selectedOrder.status === 'Cancelled'
                              ? '#e74c3c'
                              : '#f1c40f',
                          border:
                            selectedOrder.status === 'Delivered' || selectedOrder.status === 'Confirmed'
                              ? '1px solid rgba(46, 204, 113, 0.4)'
                              : selectedOrder.status === 'Cancelled'
                              ? '1px solid rgba(231, 76, 60, 0.4)'
                              : '1px solid rgba(241, 196, 15, 0.4)',
                        }}
                      >
                        {selectedOrder.status}
                      </span>
                    </div>

                    <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.9rem', margin: '0 0 28px 0' }}>
                      Placed on {selectedOrder.date} &nbsp;•&nbsp; Payment Method: <strong>{selectedOrder.paymentMethod || 'Cash on Delivery'}</strong>
                    </p>

                    {/* Order Status Lifecycle Tracker Card */}
                    <div
                      style={{
                        background: 'rgba(18, 14, 11, 0.95)',
                        border: '1px solid rgba(201, 168, 76, 0.25)',
                        borderRadius: '14px',
                        padding: '28px 24px',
                        marginBottom: '28px',
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                      }}
                    >
                      {selectedOrder.status === 'Cancelled' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(231, 76, 60, 0.2)', border: '1px solid #e74c3c', color: '#e74c3c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={20} />
                          </div>
                          <div>
                            <h4 style={{ color: '#e74c3c', margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700 }}>Order Cancelled</h4>
                            <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '0.85rem' }}>This order has been cancelled and will not be fulfilled.</p>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                          {/* Progress Line */}
                          <div
                            style={{
                              position: 'absolute',
                              top: '20px',
                              left: '40px',
                              right: '40px',
                              height: '2px',
                              background: 'rgba(255, 255, 255, 0.12)',
                              zIndex: 1,
                            }}
                          />
                          {[
                            { key: 'Placed', label: 'Placed', icon: Clock },
                            { key: 'Confirmed', label: 'Confirmed', icon: Check },
                            { key: 'Processing', label: 'Processing', icon: Package },
                            { key: 'Shipped', label: 'Shipped', icon: Truck },
                            { key: 'Delivered', label: 'Delivered', icon: PackageCheck },
                          ].map((step, idx) => {
                            const stepsOrder = ['Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];
                            const currentIdx = stepsOrder.indexOf(selectedOrder.status || 'Confirmed');
                            const isDone = idx <= (currentIdx >= 0 ? currentIdx : 1);
                            const StepIcon = step.icon;

                            return (
                              <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative' }}>
                                <div
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: isDone ? '#2ecc71' : 'rgba(18, 14, 11, 0.95)',
                                    border: `2px solid ${isDone ? '#2ecc71' : 'rgba(255, 255, 255, 0.2)'}`,
                                    color: isDone ? '#0f0c0a' : 'rgba(255, 255, 255, 0.4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: isDone ? '0 0 14px rgba(46, 204, 113, 0.4)' : 'none',
                                    transition: 'all 0.3s ease',
                                  }}
                                >
                                  <StepIcon size={18} />
                                </div>
                                <span style={{ marginTop: '10px', fontSize: '0.82rem', fontWeight: isDone ? 700 : 500, color: isDone ? '#f5efe6' : 'rgba(255, 255, 255, 0.4)' }}>
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Order Items Table Card */}
                    <div
                      style={{
                        background: 'rgba(18, 14, 11, 0.95)',
                        border: '1px solid rgba(201, 168, 76, 0.25)',
                        borderRadius: '14px',
                        padding: '24px',
                        marginBottom: '28px',
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                      }}
                    >
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: '#f5efe6', margin: '0 0 18px 0', fontWeight: 700 }}>
                        Order Items
                      </h3>

                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                            <th style={{ padding: '10px 12px 14px 0' }}>PRODUCT</th>
                            <th style={{ padding: '10px 12px 14px 12px', textAlign: 'right' }}>PRICE</th>
                            <th style={{ padding: '10px 12px 14px 12px', textAlign: 'center' }}>QTY</th>
                            <th style={{ padding: '10px 0 14px 12px', textAlign: 'right' }}>TOTAL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedOrder.items.map((item: any, idx: number) => {
                            const prodName = item.product?.name || 'Artisanal Chocolate Box';
                            const prodImage = item.product?.image || item.product?.images?.[0] || 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=120&q=80';
                            const sku = item.product?.sku || `SKU-SCB-${idx}`;
                            const price = item.product?.price || item.price || 0;
                            const qty = item.quantity || 1;
                            const lineTotal = price * qty;

                            return (
                              <tr key={item.product?.id || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <td style={{ padding: '16px 12px 16px 0' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <img
                                      src={prodImage}
                                      alt={prodName}
                                      style={{ width: '52px', height: '52px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(201, 168, 76, 0.3)' }}
                                    />
                                    <div>
                                      <h4 style={{ color: '#f5efe6', margin: '0 0 4px 0', fontSize: '0.92rem', fontWeight: 700 }}>{prodName}</h4>
                                      <span style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.78rem' }}>SKU: {sku}</span>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: '16px 12px', textAlign: 'right', color: '#f5efe6', fontWeight: 600 }}>
                                  ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td style={{ padding: '16px 12px', textAlign: 'center', color: '#f5efe6', fontWeight: 600 }}>
                                  {qty}
                                </td>
                                <td style={{ padding: '16px 0 16px 12px', textAlign: 'right', color: '#f5efe6', fontWeight: 700 }}>
                                  ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* 3 Cards Grid Bottom Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1fr 1fr 1fr', gap: '20px', marginBottom: '28px' }}>
                      {/* Card 1: Shipping Address */}
                      <div
                        style={{
                          background: 'rgba(18, 14, 11, 0.95)',
                          border: '1px solid rgba(201, 168, 76, 0.25)',
                          borderRadius: '14px',
                          padding: '22px',
                          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                        }}
                      >
                        <h4 style={{ color: '#f5efe6', margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 700 }}>Shipping Address</h4>
                        <div style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.86rem', lineHeight: 1.6 }}>
                          <p style={{ margin: '0 0 4px 0', fontWeight: 700, color: '#f5efe6' }}>
                            {selectedOrder.shippingAddress?.name || user.name}
                          </p>
                          <div>{selectedOrder.shippingAddress?.street || '12-34, MG Road, Block A'}</div>
                          <div>
                            {selectedOrder.shippingAddress?.city || 'Hyderabad'}, {selectedOrder.shippingAddress?.state || 'Telangana'} - {selectedOrder.shippingAddress?.zip || '500001'}
                          </div>
                          <div>India</div>
                          <div style={{ marginTop: '6px', color: 'rgba(255, 255, 255, 0.6)' }}>
                            {selectedOrder.shippingAddress?.phone || '9876543210'}
                          </div>
                        </div>
                      </div>

                      {/* Card 2: Billing Address */}
                      <div
                        style={{
                          background: 'rgba(18, 14, 11, 0.95)',
                          border: '1px solid rgba(201, 168, 76, 0.25)',
                          borderRadius: '14px',
                          padding: '22px',
                          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                        }}
                      >
                        <h4 style={{ color: '#f5efe6', margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 700 }}>Billing Address</h4>
                        <div style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.86rem', lineHeight: 1.6 }}>
                          <p style={{ margin: '0 0 4px 0', fontWeight: 700, color: '#f5efe6' }}>
                            {selectedOrder.shippingAddress?.name || user.name}
                          </p>
                          <div>{selectedOrder.shippingAddress?.street || '12-34, MG Road, Block A'}</div>
                          <div>
                            {selectedOrder.shippingAddress?.city || 'Hyderabad'}, {selectedOrder.shippingAddress?.state || 'Telangana'} - {selectedOrder.shippingAddress?.zip || '500001'}
                          </div>
                          <div>India</div>
                          <div style={{ marginTop: '6px', color: 'rgba(255, 255, 255, 0.6)' }}>
                            {selectedOrder.shippingAddress?.phone || '9876543210'}
                          </div>
                        </div>
                      </div>

                      {/* Card 3: Order Summary */}
                      <div
                        style={{
                          background: 'rgba(18, 14, 11, 0.95)',
                          border: '1px solid rgba(201, 168, 76, 0.25)',
                          borderRadius: '14px',
                          padding: '22px',
                          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                        }}
                      >
                        <h4 style={{ color: '#f5efe6', margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 700 }}>Order Summary</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255, 255, 255, 0.7)' }}>
                            <span>Subtotal</span>
                            <span style={{ color: '#f5efe6', fontWeight: 600 }}>
                              ₹{(selectedOrder.subtotal || selectedOrder.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255, 255, 255, 0.7)' }}>
                            <span>Coupon Discount</span>
                            <span style={{ color: '#2ecc71', fontWeight: 600 }}>
                              - ₹{(selectedOrder.coupon_discount || selectedOrder.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255, 255, 255, 0.7)' }}>
                            <span>Shipping</span>
                            <span style={{ color: '#f5efe6', fontWeight: 600 }}>
                              ₹{(selectedOrder.shipping || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '10px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-baseline' }}>
                            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f5efe6' }}>Total</span>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#c9a84c' }}>
                                ₹{selectedOrder.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: '#2ecc71', fontWeight: 700 }}>
                                ({selectedOrder.status === 'Cancelled' ? 'Cancelled' : selectedOrder.payment_status || 'Paid'})
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Row */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px' }}>
                      <button
                        type="button"
                        onClick={() => setOrderSubView('invoice')}
                        style={{
                          padding: '11px 22px',
                          borderRadius: '8px',
                          background: 'transparent',
                          border: '1px solid rgba(201, 168, 76, 0.5)',
                          color: '#f5efe6',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <FileText size={16} /> View Invoice
                      </button>
                      <button
                        type="button"
                        disabled={isPdfDownloading}
                        onClick={(e) => handleDownloadInvoice(selectedOrder.id, e)}
                        style={{
                          padding: '11px 24px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #c9a84c 0%, #e5c875 100%)',
                          color: '#0f0c0a',
                          border: 'none',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          cursor: isPdfDownloading ? 'not-allowed' : 'pointer',
                          opacity: isPdfDownloading ? 0.7 : 1,
                          boxShadow: '0 4px 14px rgba(201, 168, 76, 0.35)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        {isPdfDownloading ? (
                          <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Generating PDF...</>
                        ) : (
                          <><Download size={16} /> Download PDF</>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. INVOICE PREVIEW SUB-VIEW */}
                {selectedOrder && orderSubView === 'invoice' && (
                  <div>
                    {/* Back button */}
                    <button
                      type="button"
                      onClick={() => setOrderSubView('details')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#c9a84c',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginBottom: '20px',
                        padding: 0,
                      }}
                    >
                      <ArrowLeft size={16} /> Back to Orders
                    </button>

                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: '#f5efe6', margin: '0 0 24px 0', fontWeight: 700 }}>
                      Invoice Preview
                    </h2>

                    {/* 2-Column Invoice Workspace */}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1fr 300px', gap: '28px', alignItems: 'flex-start' }}>
                      {/* Left: Parchment Invoice Document */}
                      <div
                        style={{
                          background: '#f8f4ec',
                          color: '#1a0d00',
                          borderRadius: '12px',
                          padding: '36px',
                          border: '1px solid #e5dccb',
                          boxShadow: '0 10px 35px rgba(0,0,0,0.85)',
                          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                        }}
                      >
                        {/* Brand & Invoice Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #c9a84c', paddingBottom: '20px', marginBottom: '24px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                              <span style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '2px', color: '#1a0d00' }}>CHOVIQUE</span>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#c9a84c', letterSpacing: '2px', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                              PREMIUM HANDMADE CHOCOLATES
                            </span>
                            <div style={{ fontSize: '0.8rem', color: '#555', lineHeight: 1.5 }}>
                              <div>Chovique Chocolates Pvt. Ltd.</div>
                              <div>123, Chocolate Lane, Hitec City</div>
                              <div>Hyderabad, Telangana - 500081, India</div>
                              <div>Email: hello@chovique.com | Phone: +91 98765 43210</div>
                              <div>GSTIN: 36ABCDE1234F1ZS</div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1a0d00', margin: '0 0 10px 0' }}>INVOICE</h2>
                            <div style={{ fontSize: '0.84rem', color: '#444', lineHeight: 1.6 }}>
                              <div><strong>Invoice No:</strong> INV-{selectedOrder.id}</div>
                              <div><strong>Order No:</strong> {selectedOrder.id}</div>
                              <div><strong>Invoice Date:</strong> {selectedOrder.date}</div>
                              <div><strong>Payment Method:</strong> {selectedOrder.paymentMethod || 'Cash on Delivery'}</div>
                              <div><strong>Payment Status:</strong> <span style={{ color: '#2ecc71', fontWeight: 700 }}>{selectedOrder.status === 'Cancelled' ? 'Cancelled' : selectedOrder.payment_status || 'Paid'}</span></div>
                              <div><strong>Order Status:</strong> {selectedOrder.status}</div>
                            </div>
                          </div>
                        </div>

                        {/* Bill To / Ship To Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px', background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e5dccb' }}>
                          <div>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>BILL TO</span>
                            <div style={{ fontSize: '0.85rem', color: '#333', lineHeight: 1.5 }}>
                              <strong>{selectedOrder.shippingAddress?.name || user.name}</strong>
                              <div>{user.email}</div>
                              <div>{selectedOrder.shippingAddress?.phone || '9876543210'}</div>
                            </div>
                          </div>

                          <div>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>SHIP TO</span>
                            <div style={{ fontSize: '0.85rem', color: '#333', lineHeight: 1.5 }}>
                              <strong>{selectedOrder.shippingAddress?.name || user.name}</strong>
                              <div>{selectedOrder.shippingAddress?.street || '12-34, MG Road, Block A'}</div>
                              <div>{selectedOrder.shippingAddress?.city || 'Hyderabad'}, {selectedOrder.shippingAddress?.state || 'Telangana'} - {selectedOrder.shippingAddress?.zip || '500001'}</div>
                              <div>India</div>
                              <div>{selectedOrder.shippingAddress?.phone || '9876543210'}</div>
                            </div>
                          </div>
                        </div>

                        {/* Invoice Table */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', fontSize: '0.85rem' }}>
                          <thead>
                            <tr style={{ background: '#120e0b', color: '#f5efe6', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                              <th style={{ padding: '10px', textAlign: 'left' }}>#</th>
                              <th style={{ padding: '10px', textAlign: 'left' }}>PRODUCT</th>
                              <th style={{ padding: '10px', textAlign: 'left' }}>SKU</th>
                              <th style={{ padding: '10px', textAlign: 'center' }}>QTY</th>
                              <th style={{ padding: '10px', textAlign: 'right' }}>UNIT PRICE</th>
                              <th style={{ padding: '10px', textAlign: 'right' }}>DISCOUNT</th>
                              <th style={{ padding: '10px', textAlign: 'right' }}>TOTAL</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedOrder.items.map((item: any, idx: number) => {
                              const prodName = item.product?.name || 'Artisanal Chocolate Box';
                              const sku = item.product?.sku || 'SCB-250G';
                              const price = item.product?.price || item.price || 0;
                              const qty = item.quantity || 1;
                              const total = price * qty;

                              return (
                                <tr key={idx} style={{ borderBottom: '1px solid #e5dccb' }}>
                                  <td style={{ padding: '10px' }}>{idx + 1}</td>
                                  <td style={{ padding: '10px', fontWeight: 600 }}>{prodName}</td>
                                  <td style={{ padding: '10px', color: '#666' }}>{sku}</td>
                                  <td style={{ padding: '10px', textAlign: 'center' }}>{qty}</td>
                                  <td style={{ padding: '10px', textAlign: 'right' }}>₹{price.toFixed(2)}</td>
                                  <td style={{ padding: '10px', textAlign: 'right', color: '#e74c3c' }}>-₹{(selectedOrder.coupon_discount || 0).toFixed(2)}</td>
                                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>₹{total.toFixed(2)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>

                        {/* Price Summary */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '32px' }}>
                          <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                              <span>Subtotal</span>
                              <span>₹{(selectedOrder.subtotal || selectedOrder.total).toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e74c3c' }}>
                              <span>Coupon Discount</span>
                              <span>-₹{(selectedOrder.coupon_discount || selectedOrder.discount || 0).toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                              <span>Shipping</span>
                              <span>₹{(selectedOrder.shipping || 0).toFixed(2)}</span>
                            </div>
                            <div style={{ borderTop: '2px solid #1a0d00', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800 }}>
                              <span>Grand Total</span>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ color: '#1a0d00' }}>₹{selectedOrder.total.toFixed(2)}</span>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: '#2ecc71', fontWeight: 700 }}>
                                  ({selectedOrder.status === 'Cancelled' ? 'Cancelled' : selectedOrder.payment_status || 'Paid'})
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Invoice Footer */}
                        <div style={{ borderTop: '1px solid #e5dccb', paddingTop: '16px', textAlign: 'center', fontSize: '0.8rem', color: '#666', lineHeight: 1.5 }}>
                          Thank you for choosing CHOVIQUE. We appreciate your trust and support.
                        </div>
                      </div>

                      {/* Right: Invoice Actions Card */}
                      <div
                        style={{
                          background: 'rgba(18, 14, 11, 0.95)',
                          border: '1px solid rgba(201, 168, 76, 0.25)',
                          borderRadius: '14px',
                          padding: '24px',
                          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                        }}
                      >
                        <h4 style={{ color: '#f5efe6', margin: '0 0 18px 0', fontSize: '1.1rem', fontWeight: 700 }}>
                          Invoice Actions
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <button
                            type="button"
                            disabled={isPdfDownloading}
                            onClick={(e) => handleDownloadInvoice(selectedOrder.id, e)}
                            style={{
                              width: '100%',
                              padding: '12px 18px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #c9a84c 0%, #e5c875 100%)',
                              color: '#0f0c0a',
                              border: 'none',
                              fontSize: '0.92rem',
                              fontWeight: 700,
                              cursor: isPdfDownloading ? 'not-allowed' : 'pointer',
                              boxShadow: '0 4px 14px rgba(201, 168, 76, 0.35)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                            }}
                          >
                            {isPdfDownloading ? (
                              <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Downloading...</>
                            ) : (
                              <><Download size={16} /> Download PDF</>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => window.print()}
                            style={{
                              width: '100%',
                              padding: '12px 18px',
                              borderRadius: '8px',
                              background: 'transparent',
                              border: '1px solid rgba(201, 168, 76, 0.5)',
                              color: '#c9a84c',
                              fontSize: '0.92rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                            }}
                          >
                            <Printer size={16} /> Print Invoice
                          </button>

                          <div
                            style={{
                              marginTop: '12px',
                              padding: '16px',
                              background: 'rgba(0, 0, 0, 0.3)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              color: 'rgba(255, 255, 255, 0.55)',
                              lineHeight: 1.5,
                              textAlign: 'center',
                            }}
                          >
                            This is a computer generated invoice and does not require a signature.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. ORDER HISTORY LIST VIEW (MAIN ORDERS VIEW) */}
                {(!selectedOrder || orderSubView === 'list') && (
                  <div>
                    {/* Header */}
                    <div style={{ marginBottom: '24px' }}>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: '#f5efe6', margin: '0 0 6px 0', fontWeight: 700 }}>
                        Order History
                      </h2>
                      <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem', margin: 0 }}>
                        Track and manage all your orders in one place.
                      </p>
                    </div>

                    {/* Filter Tabs & Search Row */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
                      {/* Status Filters */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {['All Orders', 'Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'].map((statusOption) => {
                          const filterVal = statusOption === 'All Orders' ? 'All' : statusOption;
                          const isActive = orderStatusFilter === filterVal;
                          return (
                            <button
                              key={statusOption}
                              type="button"
                              onClick={() => setOrderStatusFilter(filterVal)}
                              style={{
                                padding: '8px 18px',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                border: isActive ? '1px solid #c9a84c' : '1px solid rgba(201, 168, 76, 0.2)',
                                background: isActive ? '#c9a84c' : 'rgba(18, 14, 11, 0.95)',
                                color: isActive ? '#0f0c0a' : 'rgba(255, 255, 255, 0.8)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              {statusOption}
                            </button>
                          );
                        })}
                      </div>

                      {/* Search Input & Sort Dropdown */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                        {/* Search Input */}
                        <div style={{ position: 'relative', width: isMobileGrid ? '100%' : '320px' }}>
                          <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255, 255, 255, 0.4)' }} />
                          <input
                            type="text"
                            placeholder="Search by Order ID"
                            value={orderSearchQuery}
                            onChange={(e) => setOrderSearchQuery(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '10px 14px 10px 38px',
                              borderRadius: '8px',
                              background: 'rgba(18, 14, 11, 0.95)',
                              border: '1px solid rgba(201, 168, 76, 0.3)',
                              color: '#f5efe6',
                              fontSize: '0.88rem',
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>

                        {/* Sort Dropdown */}
                        <select
                          value={orderSortOrder}
                          onChange={(e) => setOrderSortOrder(e.target.value as 'newest' | 'oldest')}
                          style={{
                            padding: '10px 16px',
                            borderRadius: '8px',
                            background: '#120e0b',
                            border: '1px solid rgba(201, 168, 76, 0.3)',
                            color: '#f5efe6',
                            fontSize: '0.88rem',
                            outline: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="newest" style={{ background: '#120e0b' }}>Newest First</option>
                          <option value="oldest" style={{ background: '#120e0b' }}>Oldest First</option>
                        </select>
                      </div>
                    </div>

                    {/* Order Cards List */}
                    {isOrdersLoading ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#c9a84c', padding: '30px 0', justifyContent: 'center' }}>
                        <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Loading order history...</span>
                      </div>
                    ) : ordersError ? (
                      <div style={{ padding: '16px', background: 'rgba(231, 76, 60, 0.12)', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: '8px' }}>
                        {ordersError}
                      </div>
                    ) : (
                      (() => {
                        const filteredList = orders
                          .filter((ord) => {
                            if (orderStatusFilter !== 'All') {
                              if (ord.status.toLowerCase() !== orderStatusFilter.toLowerCase()) return false;
                            }
                            if (orderSearchQuery.trim() !== '') {
                              const q = orderSearchQuery.trim().toLowerCase();
                              if (!ord.id.toLowerCase().includes(q)) return false;
                            }
                            return true;
                          })
                          .sort((a, b) => {
                            const tA = new Date(a.date).getTime() || 0;
                            const tB = new Date(b.date).getTime() || 0;
                            return orderSortOrder === 'newest' ? tB - tA : tA - tB;
                          });

                        if (filteredList.length === 0) {
                          return (
                            <div style={{ padding: '48px 24px', background: 'rgba(18, 14, 11, 0.95)', border: '1px dashed rgba(201, 168, 76, 0.3)', borderRadius: '14px', textAlign: 'center' }}>
                              <ShoppingBag size={42} style={{ color: '#c9a84c', marginBottom: '12px', opacity: 0.8 }} />
                              <h3 style={{ color: '#f5efe6', margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 700 }}>No Orders Found</h3>
                              <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: '0 0 20px 0', fontSize: '0.9rem' }}>
                                {orderSearchQuery || orderStatusFilter !== 'All' ? 'No orders match your filter criteria.' : "You haven't placed any orders yet."}
                              </p>
                              {(orderSearchQuery || orderStatusFilter !== 'All') ? (
                                <button
                                  type="button"
                                  onClick={() => { setOrderStatusFilter('All'); setOrderSearchQuery(''); }}
                                  style={{ padding: '10px 22px', borderRadius: '6px', background: 'transparent', border: '1px solid #c9a84c', color: '#c9a84c', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                  Clear Filters
                                </button>
                              ) : (
                                <Button variant="gold" onClick={() => navigate('/shop')} glow size="sm">
                                  Explore Shop
                                </Button>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {filteredList.map((ord) => {
                              const firstItem = ord.items[0];
                              const prodName = firstItem?.product?.name || 'Artisanal Chocolate Collection';
                              const prodImage = firstItem?.product?.image || firstItem?.product?.images?.[0] || 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=120&q=80';
                              const totalQty = ord.items.reduce((sum, item) => sum + (item.quantity || 1), 0);

                              return (
                                <div
                                  key={ord.id}
                                  style={{
                                    background: 'rgba(18, 14, 11, 0.95)',
                                    border: '1px solid rgba(201, 168, 76, 0.25)',
                                    borderRadius: '14px',
                                    padding: '24px',
                                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                                    display: 'grid',
                                    gridTemplateColumns: isMobileGrid ? '1fr' : '1.3fr 1.1fr 1.3fr',
                                    gap: '24px',
                                    alignItems: 'center',
                                  }}
                                >
                                  {/* Left: Product Thumbnail & Order Info */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <img
                                      src={prodImage}
                                      alt={prodName}
                                      style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(201, 168, 76, 0.3)', flexShrink: 0 }}
                                    />
                                    <div>
                                      <h3 style={{ color: '#f5efe6', margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 700 }}>
                                        {ord.id}
                                      </h3>
                                      <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.55)', display: 'block', marginBottom: '8px' }}>
                                        Placed on {ord.date} &nbsp;•&nbsp; {ord.paymentMethod || 'Cash on Delivery'}
                                      </span>
                                      <span
                                        style={{
                                          fontSize: '0.72rem',
                                          fontWeight: 800,
                                          padding: '3px 10px',
                                          borderRadius: '4px',
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.5px',
                                          display: 'inline-block',
                                          background:
                                            ord.status === 'Delivered' || ord.status === 'Confirmed'
                                              ? 'rgba(46, 204, 113, 0.18)'
                                              : ord.status === 'Cancelled'
                                              ? 'rgba(231, 76, 60, 0.18)'
                                              : 'rgba(241, 196, 15, 0.18)',
                                          color:
                                            ord.status === 'Delivered' || ord.status === 'Confirmed'
                                              ? '#2ecc71'
                                              : ord.status === 'Cancelled'
                                              ? '#e74c3c'
                                              : '#f1c40f',
                                          border:
                                            ord.status === 'Delivered' || ord.status === 'Confirmed'
                                              ? '1px solid rgba(46, 204, 113, 0.4)'
                                              : ord.status === 'Cancelled'
                                              ? '1px solid rgba(231, 76, 60, 0.4)'
                                              : '1px solid rgba(241, 196, 15, 0.4)',
                                        }}
                                      >
                                        {ord.status}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Middle: Item details & Calculation breakdown */}
                                  <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.75)', lineHeight: 1.6 }}>
                                    <div style={{ fontWeight: 700, color: '#f5efe6', fontSize: '0.92rem', marginBottom: '6px' }}>
                                      {prodName} {totalQty > 1 ? `(x${totalQty})` : ''}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '220px' }}>
                                      <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Subtotal</span>
                                      <span style={{ color: '#f5efe6' }}>₹{(ord.subtotal || ord.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '220px' }}>
                                      <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Coupon Discount</span>
                                      <span style={{ color: '#2ecc71' }}>- ₹{(ord.coupon_discount || ord.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '220px' }}>
                                      <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Shipping</span>
                                      <span style={{ color: '#f5efe6' }}>₹{(ord.shipping || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                  </div>

                                  {/* Right: Total & Action Buttons */}
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobileGrid ? 'flex-start' : 'flex-end', gap: '12px' }}>
                                    <div style={{ textAlign: isMobileGrid ? 'left' : 'right' }}>
                                      <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.5)', display: 'block' }}>Total</span>
                                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#c9a84c' }}>
                                        ₹{ord.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                      <span style={{ fontSize: '0.78rem', color: '#2ecc71', fontWeight: 700, display: 'block', marginTop: '2px' }}>
                                        ({ord.status === 'Cancelled' ? 'Cancelled' : ord.payment_status || 'Paid'})
                                      </span>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                      <button
                                        type="button"
                                        onClick={() => { setSelectedOrder(ord); setOrderSubView('details'); }}
                                        style={{
                                          padding: '8px 16px',
                                          borderRadius: '6px',
                                          background: 'transparent',
                                          border: '1px solid rgba(255, 255, 255, 0.2)',
                                          color: '#f5efe6',
                                          fontSize: '0.82rem',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          transition: 'all 0.2s ease',
                                        }}
                                      >
                                        View Details
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => { setSelectedOrder(ord); setOrderSubView('invoice'); }}
                                        style={{
                                          padding: '8px 16px',
                                          borderRadius: '6px',
                                          background: 'transparent',
                                          border: '1px solid rgba(201, 168, 76, 0.5)',
                                          color: '#c9a84c',
                                          fontSize: '0.82rem',
                                          fontWeight: 700,
                                          cursor: 'pointer',
                                          transition: 'all 0.2s ease',
                                        }}
                                      >
                                        View Invoice
                                      </button>
                                      <button
                                        type="button"
                                        disabled={isPdfDownloading}
                                        onClick={(e) => handleDownloadInvoice(ord.id, e)}
                                        style={{
                                          padding: '8px 16px',
                                          borderRadius: '6px',
                                          background: 'linear-gradient(135deg, #c9a84c 0%, #e5c875 100%)',
                                          color: '#0f0c0a',
                                          border: 'none',
                                          fontSize: '0.82rem',
                                          fontWeight: 700,
                                          cursor: isPdfDownloading ? 'not-allowed' : 'pointer',
                                          boxShadow: '0 2px 10px rgba(201, 168, 76, 0.3)',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                        }}
                                      >
                                        <Download size={14} /> Download PDF
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ADDRESSES PANEL */}
            {activeTab === 'addresses' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: '#f5efe6', margin: '0 0 6px 0', fontWeight: 700 }}>
                      Shipping Address Book
                    </h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem', margin: 0 }}>
                      Manage your shipping addresses for a faster checkout.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (showAddAddressForm) {
                        setShowAddAddressForm(false);
                        setEditingAddressId(null);
                      } else {
                        handleOpenAddAddress();
                      }
                    }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #c9a84c 0%, #e5c875 100%)',
                      color: '#0f0c0a',
                      border: 'none',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(201, 168, 76, 0.35)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {showAddAddressForm ? <X size={16} /> : <Plus size={16} />}
                    {showAddAddressForm ? 'Cancel' : '+ Add New Address'}
                  </button>
                </div>

                {/* Add / Edit Address Form */}
                {showAddAddressForm && (
                  <div
                    style={{
                      background: 'rgba(18, 14, 11, 0.96)',
                      border: '1px solid rgba(201, 168, 76, 0.35)',
                      borderRadius: '12px',
                      padding: '28px',
                      marginBottom: '32px',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                    }}
                  >
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: '#f5efe6', margin: '0 0 20px 0', fontWeight: 700 }}>
                      {editingAddressId ? 'Edit Shipping Address' : 'Add New Shipping Address'}
                    </h3>

                    <form onSubmit={handleAddressSubmit} style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1fr 1fr', gap: '20px' }}>
                      {/* Address Label */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.88rem', color: '#f5efe6', fontWeight: 600, marginBottom: '6px' }}>
                          Address Label <span style={{ color: '#c9a84c' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={addressForm.title}
                          onChange={(e) => setAddressForm({ ...addressForm, title: e.target.value })}
                          placeholder="e.g. Home, Work, Office"
                          style={{
                            width: '100%',
                            padding: '11px 14px',
                            borderRadius: '6px',
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(201, 168, 76, 0.3)',
                            color: '#f5efe6',
                            fontSize: '0.9rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      {/* Recipient Full Name */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.88rem', color: '#f5efe6', fontWeight: 600, marginBottom: '6px' }}>
                          Recipient Full Name <span style={{ color: '#c9a84c' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={addressForm.name}
                          onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                          placeholder="Enter recipient full name"
                          style={{
                            width: '100%',
                            padding: '11px 14px',
                            borderRadius: '6px',
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(201, 168, 76, 0.3)',
                            color: '#f5efe6',
                            fontSize: '0.9rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      {/* Street Address */}
                      <div style={{ gridColumn: isMobileGrid ? 'span 1' : 'span 2' }}>
                        <label style={{ display: 'block', fontSize: '0.88rem', color: '#f5efe6', fontWeight: 600, marginBottom: '6px' }}>
                          Street Address <span style={{ color: '#c9a84c' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={addressForm.street}
                          onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                          placeholder="Flat, House no., Building, Street, Area"
                          style={{
                            width: '100%',
                            padding: '11px 14px',
                            borderRadius: '6px',
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(201, 168, 76, 0.3)',
                            color: '#f5efe6',
                            fontSize: '0.9rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      {/* City */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.88rem', color: '#f5efe6', fontWeight: 600, marginBottom: '6px' }}>
                          City <span style={{ color: '#c9a84c' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          placeholder="e.g. Hyderabad"
                          style={{
                            width: '100%',
                            padding: '11px 14px',
                            borderRadius: '6px',
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(201, 168, 76, 0.3)',
                            color: '#f5efe6',
                            fontSize: '0.9rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      {/* State Select */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.88rem', color: '#f5efe6', fontWeight: 600, marginBottom: '6px' }}>
                          State <span style={{ color: '#c9a84c' }}>*</span>
                        </label>
                        <select
                          value={addressForm.state}
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '11px 14px',
                            borderRadius: '6px',
                            background: '#120e0b',
                            border: '1px solid rgba(201, 168, 76, 0.3)',
                            color: '#f5efe6',
                            fontSize: '0.9rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                            cursor: 'pointer',
                          }}
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st} style={{ background: '#120e0b', color: '#f5efe6' }}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* PIN Code */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.88rem', color: '#f5efe6', fontWeight: 600, marginBottom: '6px' }}>
                          PIN / Postal Code <span style={{ color: '#c9a84c' }}>*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={addressForm.zip}
                          onChange={(e) => setAddressForm({ ...addressForm, zip: e.target.value.replace(/\D/g, '') })}
                          placeholder="e.g. 500001"
                          style={{
                            width: '100%',
                            padding: '11px 14px',
                            borderRadius: '6px',
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(201, 168, 76, 0.3)',
                            color: '#f5efe6',
                            fontSize: '0.9rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      {/* Phone Number */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.88rem', color: '#f5efe6', fontWeight: 600, marginBottom: '6px' }}>
                          Phone Number <span style={{ color: '#c9a84c' }}>*</span>
                        </label>
                        <input
                          type="tel"
                          maxLength={10}
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value.replace(/\D/g, '') })}
                          placeholder="e.g. 9876543210"
                          style={{
                            width: '100%',
                            padding: '11px 14px',
                            borderRadius: '6px',
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(201, 168, 76, 0.3)',
                            color: '#f5efe6',
                            fontSize: '0.9rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      {/* Make default checkbox */}
                      <div style={{ gridColumn: isMobileGrid ? 'span 1' : 'span 2', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                        <input
                          type="checkbox"
                          id="is-default-address-cb"
                          checked={addressForm.isDefault}
                          onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                          style={{ accentColor: '#c9a84c', width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <label htmlFor="is-default-address-cb" style={{ color: '#f5efe6', fontSize: '0.88rem', cursor: 'pointer', fontWeight: 500 }}>
                          Make this my default shipping address
                        </label>
                      </div>

                      {/* Form Error Banner */}
                      {addressFormError && (
                        <div
                          style={{
                            gridColumn: isMobileGrid ? 'span 1' : 'span 2',
                            padding: '12px 16px',
                            background: 'rgba(231, 76, 60, 0.12)',
                            border: '1px solid #e74c3c',
                            color: '#e74c3c',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                          }}
                        >
                          {addressFormError}
                        </div>
                      )}

                      {/* Buttons */}
                      <div style={{ gridColumn: isMobileGrid ? 'span 1' : 'span 2', display: 'flex', gap: '12px', marginTop: '8px' }}>
                        <button
                          type="submit"
                          disabled={isAddressSaving}
                          style={{
                            padding: '10px 24px',
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #c9a84c 0%, #e5c875 100%)',
                            color: '#0f0c0a',
                            border: 'none',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            cursor: isAddressSaving ? 'not-allowed' : 'pointer',
                            opacity: isAddressSaving ? 0.7 : 1,
                            boxShadow: '0 4px 14px rgba(201, 168, 76, 0.35)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          {isAddressSaving ? (
                            <>
                              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...
                            </>
                          ) : (
                            'Save Address'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddAddressForm(false);
                            setEditingAddressId(null);
                          }}
                          style={{
                            padding: '10px 20px',
                            borderRadius: '6px',
                            background: 'transparent',
                            color: 'rgba(255, 255, 255, 0.7)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Address Cards List */}
                {addresses.length === 0 ? (
                  <div
                    style={{
                      padding: '48px 24px',
                      background: 'rgba(18, 14, 11, 0.95)',
                      border: '1px dashed rgba(201, 168, 76, 0.3)',
                      borderRadius: '12px',
                      textAlign: 'center',
                    }}
                  >
                    <MapPin size={42} style={{ color: '#c9a84c', marginBottom: '12px', opacity: 0.8 }} />
                    <h3 style={{ color: '#f5efe6', margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 700 }}>
                      No Saved Addresses Found
                    </h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: '0 0 20px 0', fontSize: '0.9rem' }}>
                      Add your shipping address now to enable one-click checkout.
                    </p>
                    <button
                      onClick={handleOpenAddAddress}
                      style={{
                        padding: '10px 22px',
                        borderRadius: '6px',
                        background: 'linear-gradient(135deg, #c9a84c 0%, #e5c875 100%)',
                        color: '#0f0c0a',
                        border: 'none',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Add Address
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        style={{
                          background: 'rgba(18, 14, 11, 0.95)',
                          border: '1px solid rgba(201, 168, 76, 0.25)',
                          borderRadius: '14px',
                          padding: '24px',
                          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px',
                        }}
                      >
                        {/* Top Header Row of Card */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span
                            style={{
                              background: 'rgba(201, 168, 76, 0.2)',
                              color: '#c9a84c',
                              border: '1px solid rgba(201, 168, 76, 0.4)',
                              padding: '4px 12px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              letterSpacing: '1px',
                            }}
                          >
                            {addr.title}
                          </span>

                          {addr.isDefault ? (
                            <span style={{ color: '#c9a84c', fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              ☆ Default
                            </span>
                          ) : (
                            <button
                              onClick={() => setDefaultAddress(addr.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255, 255, 255, 0.5)',
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                transition: 'color 0.2s ease',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#c9a84c')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)')}
                            >
                              Set as Default
                            </button>
                          )}
                        </div>

                        {/* Recipient Name */}
                        <h3 style={{ color: '#f5efe6', fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                          {addr.name}
                        </h3>

                        {/* Address Details */}
                        <div style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                          <div>{addr.street}</div>
                          <div>
                            {addr.city}, {addr.state} - {addr.zip}
                          </div>
                          <div style={{ color: 'rgba(255, 255, 255, 0.55)', marginTop: '2px' }}>India</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: 'rgba(255, 255, 255, 0.8)' }}>
                            <Phone size={14} style={{ color: '#c9a84c' }} />
                            <span>{addr.phone}</span>
                          </div>
                        </div>

                        {/* Action Buttons Row */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '6px' }}>
                          <button
                            onClick={() => handleEditAddress(addr)}
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(201, 168, 76, 0.4)',
                              color: '#c9a84c',
                              padding: '6px 20px',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${addr.title}" address?`)) {
                                deleteAddress(addr.id);
                              }
                            }}
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(231, 76, 60, 0.5)',
                              color: '#e74c3c',
                              padding: '6px 20px',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* REWARDS & COINS / WALLET PANEL */}
            {activeTab === 'rewards' && (
              <div>
                {/* Page Title & Subtitle */}
                <div style={{ marginBottom: '28px' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: '#f5efe6', margin: '0 0 6px 0', fontWeight: 700 }}>
                    Chovique Reward Coins &amp; Wallet
                  </h2>
                  <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem', margin: 0 }}>
                    Track your coin balance, redemption history, and reward rules.
                  </p>
                </div>

                {/* 1. WALLET BALANCE CARD */}
                <div
                  style={{
                    background: 'rgba(18, 14, 11, 0.96)',
                    border: '1px solid rgba(201, 168, 76, 0.35)',
                    borderRadius: '14px',
                    padding: '28px',
                    marginBottom: '32px',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'rgba(201, 168, 76, 0.85)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    AVAILABLE REWARD BALANCE
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f5efe6', fontFamily: 'var(--font-display)', margin: '8px 0 4px 0' }}>
                    {wallet?.coin_balance ?? 0} Coins
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#c9a84c' }}>
                    Equivalent value: ₹{((wallet?.coin_balance ?? 0) / 10).toFixed(2)}
                  </div>

                  <div style={{ borderTop: '1px solid rgba(201, 168, 76, 0.18)', margin: '20px 0' }} />

                  {/* 3 Rules Cards Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1fr 1fr 1fr', gap: '16px' }}>
                    <div
                      style={{
                        background: 'rgba(0, 0, 0, 0.35)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        padding: '14px 16px',
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', marginBottom: '4px' }}>Earn Rule</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f5efe6' }}>₹10 spent = 1 Coin</div>
                    </div>

                    <div
                      style={{
                        background: 'rgba(0, 0, 0, 0.35)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        padding: '14px 16px',
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', marginBottom: '4px' }}>Redeem Rule</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f5efe6' }}>10 Coins = ₹1 Discount</div>
                    </div>

                    <div
                      style={{
                        background: 'rgba(0, 0, 0, 0.35)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                        padding: '14px 16px',
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', marginBottom: '4px' }}>Max Usage</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f5efe6' }}>Up to 20% per order</div>
                    </div>
                  </div>
                </div>

                {/* 2. TRANSACTION LEDGER & AUDIT HISTORY */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#f5efe6', margin: 0, fontWeight: 700 }}>
                      Transaction Ledger &amp; Audit History
                    </h3>

                    {/* Filter Tabs Row */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {[
                        { key: 'ALL', label: 'All' },
                        { key: 'EARN', label: 'Earned' },
                        { key: 'REDEEM', label: 'Redeemed' },
                        { key: 'ADJUSTMENT', label: 'Adjustments' },
                      ].map((t) => {
                        const isActive = walletTxTypeFilter === t.key;
                        return (
                          <button
                            key={t.key}
                            type="button"
                            onClick={() => {
                              setWalletTxTypeFilter(t.key as any);
                              setWalletTxsPage(1);
                            }}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '6px',
                              border: isActive ? '1px solid #c9a84c' : '1px solid rgba(255, 255, 255, 0.12)',
                              background: isActive ? '#c9a84c' : 'rgba(255, 255, 255, 0.05)',
                              color: isActive ? '#0f0c0a' : '#f5efe6',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Optional Date Filters Row */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>From Date:</span>
                      <input
                        type="date"
                        value={walletDateFrom}
                        onChange={(e) => setWalletDateFrom(e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(201,168,76,0.3)',
                          color: '#f5efe6',
                          fontSize: '0.82rem',
                          colorScheme: 'dark',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>To Date:</span>
                      <input
                        type="date"
                        value={walletDateTo}
                        onChange={(e) => setWalletDateTo(e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(201,168,76,0.3)',
                          color: '#f5efe6',
                          fontSize: '0.82rem',
                          colorScheme: 'dark',
                        }}
                      />
                    </div>

                    {(walletDateFrom || walletDateTo) && (
                      <button
                        type="button"
                        onClick={() => {
                          setWalletDateFrom('');
                          setWalletDateTo('');
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#c9a84c',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Reset Dates
                      </button>
                    )}
                  </div>

                  {/* Loading State */}
                  {isWalletTxsLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255, 255, 255, 0.7)', padding: '48px 0', justifyContent: 'center' }}>
                      <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: '#c9a84c' }} />
                      <span style={{ fontSize: '0.95rem' }}>Loading reward transactions...</span>
                    </div>
                  ) : walletTxsError ? (
                    <div
                      style={{
                        padding: '20px',
                        background: 'rgba(231, 76, 60, 0.12)',
                        border: '1px solid #e74c3c',
                        borderRadius: '10px',
                        color: '#e74c3c',
                        textAlign: 'center',
                      }}
                    >
                      <p style={{ margin: '0 0 12px 0', fontWeight: 600 }}>{walletTxsError}</p>
                      <Button variant="gold" size="sm" onClick={() => fetchWalletTransactions()}>
                        Retry
                      </Button>
                    </div>
                  ) : (() => {
                    const filteredTxs = walletTxs.filter((tx) => {
                      if (!tx.created_at) return true;
                      const txTime = new Date(tx.created_at).getTime();
                      if (walletDateFrom) {
                        const fromTime = new Date(walletDateFrom).getTime();
                        if (txTime < fromTime) return false;
                      }
                      if (walletDateTo) {
                        const toTime = new Date(walletDateTo).setHours(23, 59, 59, 999);
                        if (txTime > toTime) return false;
                      }
                      return true;
                    });

                    if (filteredTxs.length === 0) {
                      return (
                        <div
                          style={{
                            padding: '56px 24px',
                            background: 'rgba(18, 14, 11, 0.95)',
                            border: '1px dashed rgba(201, 168, 76, 0.3)',
                            borderRadius: '14px',
                            textAlign: 'center',
                            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
                          }}
                        >
                          <div
                            style={{
                              width: '72px',
                              height: '72px',
                              borderRadius: '50%',
                              background: 'rgba(201, 168, 76, 0.1)',
                              border: '1px solid rgba(201, 168, 76, 0.3)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '20px',
                            }}
                          >
                            <Coins size={36} style={{ color: '#c9a84c' }} />
                          </div>
                          <h3 style={{ color: '#f5efe6', margin: '0 0 8px 0', fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                            No Reward Transactions Yet
                          </h3>
                          <p style={{ color: 'rgba(255, 255, 255, 0.65)', margin: '0 0 28px 0', fontSize: '0.92rem' }}>
                            Earn Chovique Coins by shopping and redeem them on future orders.
                          </p>
                          <Button variant="gold" size="md" glow onClick={() => navigate('/shop')}>
                            SHOP NOW
                          </Button>
                        </div>
                      );
                    }

                    return (
                      <div
                        style={{
                          background: 'rgba(18, 14, 11, 0.95)',
                          border: '1px solid rgba(201, 168, 76, 0.25)',
                          borderRadius: '14px',
                          overflow: 'hidden',
                          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                        }}
                      >
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                            <thead>
                              <tr style={{ background: 'rgba(0, 0, 0, 0.4)', borderBottom: '1px solid rgba(201, 168, 76, 0.2)' }}>
                                <th style={{ padding: '14px 18px', color: '#c9a84c', fontWeight: 700 }}>Date</th>
                                <th style={{ padding: '14px 18px', color: '#c9a84c', fontWeight: 700 }}>Type</th>
                                <th style={{ padding: '14px 18px', color: '#c9a84c', fontWeight: 700 }}>Amount</th>
                                <th style={{ padding: '14px 18px', color: '#c9a84c', fontWeight: 700 }}>Description</th>
                                <th style={{ padding: '14px 18px', color: '#c9a84c', fontWeight: 700, textAlign: 'right' }}>Order Ref</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredTxs.map((tx) => {
                                const isEarn = tx.type === 'EARN';
                                const isRedeem = tx.type === 'REDEEM';

                                const typeLabel = isEarn ? 'EARN' : isRedeem ? 'REDEEM' : 'ADJUSTMENT';
                                const typeBadgeColor = isEarn ? '#2ecc71' : isRedeem ? '#e74c3c' : '#f1c40f';
                                const typeBadgeBg = isEarn ? 'rgba(46, 204, 113, 0.15)' : isRedeem ? 'rgba(231, 76, 60, 0.15)' : 'rgba(241, 196, 15, 0.15)';

                                const absCoins = Math.abs(tx.coins);
                                const isPositive = tx.coins > 0 || isEarn;
                                const formattedCoins = isPositive ? `+${absCoins} Coins` : `−${absCoins} Coins`;
                                const coinsColor = isEarn ? '#2ecc71' : isRedeem ? '#e74c3c' : '#c9a84c';

                                let dateStr = 'Recently';
                                if (tx.created_at) {
                                  try {
                                    dateStr = new Date(tx.created_at).toLocaleDateString('en-GB', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    });
                                  } catch {
                                    dateStr = tx.created_at;
                                  }
                                }

                                return (
                                  <tr
                                    key={tx.id}
                                    style={{
                                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                                      transition: 'background 0.2s ease',
                                    }}
                                  >
                                    {/* Date */}
                                    <td style={{ padding: '14px 18px', color: 'rgba(255, 255, 255, 0.8)' }}>
                                      {dateStr}
                                    </td>

                                    {/* Type Badge */}
                                    <td style={{ padding: '14px 18px' }}>
                                      <span
                                        style={{
                                          fontSize: '0.72rem',
                                          fontWeight: 800,
                                          letterSpacing: '0.5px',
                                          padding: '4px 10px',
                                          borderRadius: '6px',
                                          background: typeBadgeBg,
                                          color: typeBadgeColor,
                                          border: `1px solid ${typeBadgeColor}`,
                                          textTransform: 'uppercase',
                                        }}
                                      >
                                        ● {typeLabel}
                                      </span>
                                    </td>

                                    {/* Coins Amount */}
                                    <td style={{ padding: '14px 18px', fontWeight: 800, color: coinsColor, fontSize: '0.95rem' }}>
                                      {formattedCoins}
                                    </td>

                                    {/* Description */}
                                    <td style={{ padding: '14px 18px', color: 'rgba(255, 255, 255, 0.7)' }}>
                                      {tx.description || (isEarn ? 'Coins earned for purchase' : isRedeem ? 'Coins redeemed on order' : 'Reward adjustment')}
                                    </td>

                                    {/* Related Order Ref */}
                                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                      {tx.order_id ? (
                                        <span
                                          onClick={() => setActiveTab('orders')}
                                          style={{
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                            color: '#c9a84c',
                                            background: 'rgba(201, 168, 76, 0.1)',
                                            border: '1px solid rgba(201, 168, 76, 0.3)',
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                          }}
                                        >
                                          Order #{tx.order_id.slice(-8)}
                                        </span>
                                      ) : (
                                        <span style={{ color: 'rgba(255, 255, 255, 0.35)', fontSize: '0.8rem' }}>—</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination Footer */}
                        <div
                          style={{
                            padding: '16px 20px',
                            background: 'rgba(0, 0, 0, 0.3)',
                            borderTop: '1px solid rgba(201, 168, 76, 0.15)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '12px',
                            fontSize: '0.84rem',
                            color: 'rgba(255, 255, 255, 0.65)',
                          }}
                        >
                          <div>
                            Showing <strong style={{ color: '#f5efe6' }}>{walletTxsTotal > 0 ? (walletTxsPage - 1) * 10 + 1 : 0}</strong>–<strong style={{ color: '#f5efe6' }}>{Math.min(walletTxsPage * 10, walletTxsTotal)}</strong> of <strong style={{ color: '#f5efe6' }}>{walletTxsTotal}</strong> transactions
                          </div>

                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button
                              type="button"
                              disabled={walletTxsPage <= 1}
                              onClick={() => setWalletTxsPage((p) => Math.max(1, p - 1))}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                background: walletTxsPage > 1 ? 'rgba(201, 168, 76, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                color: walletTxsPage > 1 ? '#c9a84c' : 'rgba(255, 255, 255, 0.3)',
                                border: walletTxsPage > 1 ? '1px solid rgba(201, 168, 76, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: walletTxsPage > 1 ? 'pointer' : 'not-allowed',
                              }}
                            >
                              ← Previous
                            </button>

                            {Array.from({ length: walletTxsPages }, (_, i) => i + 1).map((pg) => (
                              <button
                                key={pg}
                                type="button"
                                onClick={() => setWalletTxsPage(pg)}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  background: pg === walletTxsPage ? '#c9a84c' : 'rgba(255, 255, 255, 0.05)',
                                  color: pg === walletTxsPage ? '#0f0c0a' : '#f5efe6',
                                  border: pg === walletTxsPage ? '1px solid #c9a84c' : '1px solid rgba(255, 255, 255, 0.1)',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                {pg}
                              </button>
                            ))}

                            <button
                              type="button"
                              disabled={walletTxsPage >= walletTxsPages}
                              onClick={() => setWalletTxsPage((p) => Math.min(walletTxsPages, p + 1))}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                background: walletTxsPage < walletTxsPages ? 'rgba(201, 168, 76, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                color: walletTxsPage < walletTxsPages ? '#c9a84c' : 'rgba(255, 255, 255, 0.3)',
                                border: walletTxsPage < walletTxsPages ? '1px solid rgba(201, 168, 76, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: walletTxsPage < walletTxsPages ? 'pointer' : 'not-allowed',
                              }}
                            >
                              Next →
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* COUPONS PANEL */}
            {activeTab === 'coupons' && (
              <div>
                <div style={{ marginBottom: '28px' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: '#f5efe6', margin: '0 0 6px 0', fontWeight: 700 }}>
                    My Available Coupons
                  </h2>
                  <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem', margin: 0 }}>
                    Exclusive promotional discounts and rewards for your orders.
                  </p>
                </div>

                {isCouponsLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255, 255, 255, 0.7)', padding: '48px 0', justifyContent: 'center' }}>
                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: '#c9a84c' }} />
                    <span style={{ fontSize: '0.95rem' }}>Loading your coupons...</span>
                  </div>
                ) : couponsError ? (
                  <div
                    style={{
                      padding: '16px 20px',
                      background: 'rgba(231, 76, 60, 0.12)',
                      border: '1px solid #e74c3c',
                      color: '#e74c3c',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      textAlign: 'center',
                    }}
                  >
                    {couponsError}
                  </div>
                ) : (() => {
                    // Deduplicate coupons by unique uppercase code
                    const seenCodes = new Set<string>();
                    const uniqueCoupons = coupons.filter((c) => {
                      const key = (c.code || '').trim().toUpperCase();
                      if (!key || seenCodes.has(key)) return false;
                      seenCodes.add(key);
                      return true;
                    });

                    if (uniqueCoupons.length === 0) {
                      return (
                        <div
                          style={{
                            padding: '56px 24px',
                            background: 'rgba(18, 14, 11, 0.95)',
                            border: '1px dashed rgba(201, 168, 76, 0.3)',
                            borderRadius: '14px',
                            textAlign: 'center',
                            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
                          }}
                        >
                          <div
                            style={{
                              width: '72px',
                              height: '72px',
                              borderRadius: '50%',
                              background: 'rgba(201, 168, 76, 0.1)',
                              border: '1px solid rgba(201, 168, 76, 0.3)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '20px',
                            }}
                          >
                            <Tag size={36} style={{ color: '#c9a84c' }} />
                          </div>
                          <h3 style={{ color: '#f5efe6', margin: '0 0 8px 0', fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                            No Coupons Available
                          </h3>
                          <p style={{ color: 'rgba(255, 255, 255, 0.65)', margin: '0 0 28px 0', fontSize: '0.92rem' }}>
                            Check back later for exclusive Chovique offers.
                          </p>
                          <Button variant="gold" size="md" glow onClick={() => navigate('/shop')}>
                            SHOP NOW
                          </Button>
                        </div>
                      );
                    }

                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1fr 1fr', gap: '24px' }}>
                        {uniqueCoupons.map((c) => {
                          const couponItem = c as any;
                          const discountStr =
                            c.discount_type === 'PERCENTAGE' || (c.discount_percent && c.discount_percent > 0)
                              ? `${c.discount_percent || couponItem.discountPercent}% OFF`
                              : c.discount_type === 'FIXED_AMOUNT' || (c.discount_amount && c.discount_amount > 0)
                              ? `₹${c.discount_amount} OFF`
                              : c.discount_type === 'FREE_SHIPPING'
                              ? 'FREE SHIPPING'
                              : 'SPECIAL OFFER';

                          const isExpired = c.expires_at ? new Date(c.expires_at).getTime() < Date.now() : false;
                          const isUsed = couponItem.status === 'USED';
                          const isActive = (c.status === 'ACTIVE' || (c.is_active !== false && c.status !== 'INACTIVE')) && !isExpired && !isUsed;
                          const statusLabel = isUsed ? 'USED' : isExpired ? 'EXPIRED' : 'ACTIVE';

                          let expiryStr = 'No expiry';
                          if (c.expires_at) {
                            try {
                              const d = new Date(c.expires_at);
                              expiryStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                            } catch {
                              expiryStr = c.expires_at;
                            }
                          } else if (couponItem.exp) {
                            expiryStr = couponItem.exp;
                          }

                          const titleText = (c.name || couponItem.title || c.code || 'CHOCOLATE DELIGHT').toUpperCase();
                          const minOrderStr = c.minimum_order_amount && c.minimum_order_amount > 0
                            ? `₹${c.minimum_order_amount.toLocaleString('en-IN')}`
                            : 'None';
                          const descText = c.description || couponItem.desc || `Get ${discountStr.toLowerCase()} on your chocolate order.`;

                          const isCopied = copiedCode === c.code;

                          return (
                            <div
                              key={c.code}
                              style={{
                                background: 'rgba(18, 14, 11, 0.96)',
                                border: isActive ? '1px solid rgba(201, 168, 76, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '14px',
                                padding: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                                opacity: isActive ? 1 : 0.65,
                                transition: 'all 0.25s ease',
                              }}
                            >
                              {/* Top Header Row */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                <h3
                                  style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '1.05rem',
                                    fontWeight: 700,
                                    color: '#f5efe6',
                                    margin: 0,
                                    letterSpacing: '0.5px',
                                  }}
                                >
                                  {titleText}
                                </h3>

                                <span
                                  style={{
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    letterSpacing: '0.5px',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    textTransform: 'uppercase',
                                    background: isActive
                                      ? 'rgba(46, 204, 113, 0.15)'
                                      : isUsed
                                      ? 'rgba(255, 255, 255, 0.1)'
                                      : 'rgba(231, 76, 60, 0.15)',
                                    color: isActive ? '#2ecc71' : isUsed ? 'rgba(255, 255, 255, 0.6)' : '#e74c3c',
                                    border: isActive
                                      ? '1px solid #2ecc71'
                                      : isUsed
                                      ? '1px solid rgba(255, 255, 255, 0.2)'
                                      : '1px solid #e74c3c',
                                  }}
                                >
                                  ● {statusLabel}
                                </span>
                              </div>

                              {/* Discount Value Headline */}
                              <div
                                style={{
                                  fontSize: '1.6rem',
                                  fontWeight: 800,
                                  color: '#c9a84c',
                                  margin: '4px 0 14px 0',
                                  fontFamily: 'var(--font-display)',
                                  letterSpacing: '0.5px',
                                }}
                              >
                                {discountStr}
                              </div>

                              {/* Code & Copy Row */}
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  background: 'rgba(0, 0, 0, 0.4)',
                                  border: '1px dashed rgba(201, 168, 76, 0.35)',
                                  borderRadius: '8px',
                                  padding: '10px 14px',
                                  marginBottom: '14px',
                                }}
                              >
                                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f5efe6', letterSpacing: '0.5px' }}>
                                  Code: <span style={{ color: '#c9a84c' }}>{c.code}</span>
                                </span>

                                <button
                                  type="button"
                                  disabled={!isActive}
                                  onClick={() => isActive && handleCopyCouponCode(c.code)}
                                  style={{
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    background: isCopied
                                      ? 'rgba(46, 204, 113, 0.25)'
                                      : isActive
                                      ? 'linear-gradient(135deg, #c9a84c 0%, #e5c875 100%)'
                                      : 'rgba(255, 255, 255, 0.1)',
                                    color: isCopied ? '#2ecc71' : isActive ? '#0f0c0a' : 'rgba(255, 255, 255, 0.4)',
                                    border: isCopied ? '1px solid #2ecc71' : 'none',
                                    fontSize: '0.8rem',
                                    fontWeight: 800,
                                    letterSpacing: '0.5px',
                                    cursor: isActive ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.2s ease',
                                    boxShadow: isActive && !isCopied ? '0 2px 10px rgba(201, 168, 76, 0.3)' : 'none',
                                  }}
                                >
                                  {isCopied ? '✓ COPIED' : 'COPY CODE'}
                                </button>
                              </div>

                              {/* Description */}
                              <p
                                style={{
                                  color: 'rgba(255, 255, 255, 0.7)',
                                  fontSize: '0.86rem',
                                  margin: '0 0 16px 0',
                                  lineHeight: 1.5,
                                }}
                              >
                                {descText}
                              </p>

                              {/* Footer Meta */}
                              <div
                                style={{
                                  borderTop: '1px solid rgba(201, 168, 76, 0.15)',
                                  paddingTop: '12px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: '0.8rem',
                                  color: 'rgba(255, 255, 255, 0.55)',
                                }}
                              >
                                <span>Minimum order: <strong style={{ color: '#f5efe6' }}>{minOrderStr}</strong></span>
                                <span>Valid until: <strong style={{ color: '#f5efe6' }}>{expiryStr}</strong></span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
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

            {/* SETTINGS PANEL */}
            {activeTab === 'settings' && (
              <div>
                {/* Page Header */}
                <div style={{ marginBottom: '28px' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: '#f5efe6', margin: '0 0 6px 0', fontWeight: 700 }}>
                    Account Preferences &amp; Settings
                  </h2>
                  <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem', margin: '0 0 6px 0' }}>
                    Manage your account preferences and security.
                  </p>
                  <p style={{ color: 'rgba(201, 168, 76, 0.7)', fontSize: '0.8rem', margin: 0 }}>
                    Fields marked with <span style={{ color: '#e74c3c', fontWeight: 700 }}>*</span> are required.
                  </p>
                </div>

                <form onSubmit={handlePreferencesSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                  {/* Personal Demographics Card */}
                  <div
                    style={{
                      background: 'rgba(18, 14, 11, 0.95)',
                      border: '1px solid rgba(201, 168, 76, 0.25)',
                      borderRadius: '14px',
                      padding: '28px',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                    }}
                  >
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: '#f5efe6', margin: '0 0 22px 0', fontWeight: 700 }}>
                      Personal Demographics
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1fr 1fr', gap: '20px' }}>
                      {/* Date of Birth — required */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.88rem', color: '#f5efe6', fontWeight: 600, marginBottom: '8px' }}>
                          Date of Birth <span style={{ color: '#e74c3c' }}>*</span>
                        </label>
                        <input
                          type="date"
                          value={settingsForm.dob}
                          max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                          min={new Date(new Date().setFullYear(new Date().getFullYear() - 120)).toISOString().split('T')[0]}
                          onChange={(e) => setSettingsForm({ ...settingsForm, dob: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '11px 14px',
                            borderRadius: '8px',
                            background: 'rgba(0, 0, 0, 0.35)',
                            border: `1px solid ${settingsForm.dob ? 'rgba(46, 204, 113, 0.5)' : 'rgba(201, 168, 76, 0.3)'}`,
                            color: '#f5efe6',
                            fontSize: '0.9rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                            colorScheme: 'dark',
                            transition: 'border-color 0.2s ease',
                          }}
                        />
                        <p style={{ margin: '6px 0 0 2px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
                          Must be at least 13 years old
                        </p>
                      </div>

                      {/* Gender — required */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.88rem', color: '#f5efe6', fontWeight: 600, marginBottom: '8px' }}>
                          Gender <span style={{ color: '#e74c3c' }}>*</span>
                        </label>
                        <select
                          value={settingsForm.gender}
                          onChange={(e) => setSettingsForm({ ...settingsForm, gender: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '11px 14px',
                            borderRadius: '8px',
                            background: '#120e0b',
                            border: `1px solid ${settingsForm.gender ? 'rgba(46, 204, 113, 0.5)' : 'rgba(201, 168, 76, 0.3)'}`,
                            color: settingsForm.gender ? '#f5efe6' : 'rgba(255,255,255,0.45)',
                            fontSize: '0.9rem',
                            outline: 'none',
                            boxSizing: 'border-box',
                            cursor: 'pointer',
                            transition: 'border-color 0.2s ease',
                          }}
                        >
                          <option value="" style={{ background: '#120e0b', color: 'rgba(255,255,255,0.45)' }}>Select Gender</option>
                          <option value="Male" style={{ background: '#120e0b', color: '#f5efe6' }}>Male</option>
                          <option value="Female" style={{ background: '#120e0b', color: '#f5efe6' }}>Female</option>
                          <option value="Non-binary" style={{ background: '#120e0b', color: '#f5efe6' }}>Non-binary</option>
                          <option value="Prefer not to say" style={{ background: '#120e0b', color: '#f5efe6' }}>Prefer not to say</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Security Credentials Card */}
                  <div
                    style={{
                      background: 'rgba(18, 14, 11, 0.95)',
                      border: '1px solid rgba(201, 168, 76, 0.25)',
                      borderRadius: '14px',
                      padding: '28px',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: '#f5efe6', margin: '0 0 6px 0', fontWeight: 700 }}>
                          Security Credentials
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                          Update your password regularly to keep your account secure.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowChangePasswordForm(!showChangePasswordForm);
                          setChangePasswordError('');
                          setChangePasswordMessage('');
                          setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                        }}
                        style={{
                          padding: '9px 22px',
                          borderRadius: '8px',
                          background: 'transparent',
                          border: '1px solid rgba(201, 168, 76, 0.5)',
                          color: '#c9a84c',
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {showChangePasswordForm ? 'Cancel' : 'Change Password'}
                      </button>
                    </div>

                    {/* Change Password Form */}
                    {showChangePasswordForm && (
                      <form
                        onSubmit={handleChangePasswordSubmit}
                        style={{
                          marginTop: '24px',
                          paddingTop: '22px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '16px',
                        }}
                      >
                        {/* Current Password — required */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.88rem', color: '#f5efe6', fontWeight: 600, marginBottom: '8px' }}>
                            Current Password <span style={{ color: '#e74c3c' }}>*</span>
                          </label>
                          <input
                            type="password"
                            placeholder="Enter current password"
                            value={changePasswordForm.currentPassword}
                            onChange={(e) => setChangePasswordForm({ ...changePasswordForm, currentPassword: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '11px 14px',
                              borderRadius: '8px',
                              background: 'rgba(0, 0, 0, 0.35)',
                              border: `1px solid ${changePasswordForm.currentPassword ? 'rgba(46, 204, 113, 0.5)' : 'rgba(201, 168, 76, 0.3)'}`,
                              color: '#f5efe6',
                              fontSize: '0.9rem',
                              outline: 'none',
                              boxSizing: 'border-box',
                              transition: 'border-color 0.2s ease',
                            }}
                          />
                        </div>

                        {/* New Password — required */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.88rem', color: '#f5efe6', fontWeight: 600, marginBottom: '8px' }}>
                            New Password <span style={{ color: '#e74c3c' }}>*</span>
                          </label>
                          <input
                            type="password"
                            placeholder="Enter new password (min 6 characters)"
                            value={changePasswordForm.newPassword}
                            onChange={(e) => setChangePasswordForm({ ...changePasswordForm, newPassword: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '11px 14px',
                              borderRadius: '8px',
                              background: 'rgba(0, 0, 0, 0.35)',
                              border: `1px solid ${
                                changePasswordForm.newPassword.length === 0
                                  ? 'rgba(201, 168, 76, 0.3)'
                                  : changePasswordForm.newPassword.length >= 6
                                  ? 'rgba(46, 204, 113, 0.5)'
                                  : 'rgba(231, 76, 60, 0.5)'
                              }`,
                              color: '#f5efe6',
                              fontSize: '0.9rem',
                              outline: 'none',
                              boxSizing: 'border-box',
                              transition: 'border-color 0.2s ease',
                            }}
                          />
                          {changePasswordForm.newPassword.length > 0 && changePasswordForm.newPassword.length < 6 && (
                            <p style={{ margin: '5px 0 0 2px', fontSize: '0.75rem', color: '#e74c3c', fontWeight: 600 }}>
                              Password must be at least 6 characters ({changePasswordForm.newPassword.length}/6)
                            </p>
                          )}
                        </div>

                        {/* Confirm New Password — required */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.88rem', color: '#f5efe6', fontWeight: 600, marginBottom: '8px' }}>
                            Confirm New Password <span style={{ color: '#e74c3c' }}>*</span>
                          </label>
                          <input
                            type="password"
                            placeholder="Confirm new password"
                            value={changePasswordForm.confirmPassword}
                            onChange={(e) => setChangePasswordForm({ ...changePasswordForm, confirmPassword: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '11px 14px',
                              borderRadius: '8px',
                              background: 'rgba(0, 0, 0, 0.35)',
                              border: `1px solid ${
                                changePasswordForm.confirmPassword.length === 0
                                  ? 'rgba(201, 168, 76, 0.3)'
                                  : changePasswordForm.newPassword === changePasswordForm.confirmPassword
                                  ? 'rgba(46, 204, 113, 0.5)'
                                  : 'rgba(231, 76, 60, 0.5)'
                              }`,
                              color: '#f5efe6',
                              fontSize: '0.9rem',
                              outline: 'none',
                              boxSizing: 'border-box',
                              transition: 'border-color 0.2s ease',
                            }}
                          />
                          {changePasswordForm.confirmPassword.length > 0 && (
                            <p style={{
                              margin: '5px 0 0 2px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: changePasswordForm.newPassword === changePasswordForm.confirmPassword ? '#2ecc71' : '#e74c3c',
                            }}>
                              {changePasswordForm.newPassword === changePasswordForm.confirmPassword
                                ? '✓ Passwords match'
                                : '✗ Passwords do not match'}
                            </p>
                          )}
                        </div>

                        {changePasswordError && (
                          <div style={{ padding: '12px 14px', background: 'rgba(231, 76, 60, 0.12)', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                            {changePasswordError}
                          </div>
                        )}

                        {changePasswordMessage && (
                          <div style={{ padding: '12px 14px', background: 'rgba(46, 204, 113, 0.1)', border: '1px solid #2ecc71', color: '#2ecc71', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                            <CheckCircle size={15} /> {changePasswordMessage}
                          </div>
                        )}

                        <div>
                          <button
                            type="submit"
                            disabled={isChangingPassword}
                            style={{
                              padding: '10px 24px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #c9a84c 0%, #e5c875 100%)',
                              color: '#0f0c0a',
                              border: 'none',
                              fontSize: '0.9rem',
                              fontWeight: 700,
                              cursor: isChangingPassword ? 'not-allowed' : 'pointer',
                              opacity: isChangingPassword ? 0.7 : 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            {isChangingPassword ? (
                              <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Updating...</>
                            ) : (
                              'Update Password'
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Feedback messages for main form */}
                  {preferencesError && (
                    <div style={{ padding: '12px 14px', background: 'rgba(231, 76, 60, 0.12)', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={15} /> {preferencesError}
                    </div>
                  )}
                  {preferencesSaved && (
                    <div style={{ padding: '12px 14px', background: 'rgba(46, 204, 113, 0.1)', border: '1px solid #2ecc71', color: '#2ecc71', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                      <CheckCircle size={15} /> Account preferences saved successfully.
                    </div>
                  )}

                  {/* Save Settings Button */}
                  <div>
                    <button
                      type="submit"
                      disabled={isPreferencesSaving}
                      style={{
                        padding: '12px 32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #c9a84c 0%, #e5c875 100%)',
                        color: '#0f0c0a',
                        border: 'none',
                        fontSize: '1rem',
                        fontWeight: 700,
                        cursor: isPreferencesSaving ? 'not-allowed' : 'pointer',
                        opacity: isPreferencesSaving ? 0.7 : 1,
                        boxShadow: '0 4px 14px rgba(201, 168, 76, 0.35)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      {isPreferencesSaving ? (
                        <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                      ) : (
                        'Save Settings'
                      )}
                    </button>
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
    </motion.div>
  );
};
export default CustomerDashboard;
