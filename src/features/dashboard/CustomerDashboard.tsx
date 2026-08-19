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
  EyeOff,
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
  CheckCheck,
  RefreshCw,
  Filter,
  ExternalLink,
  Truck,
  Package,
  Clock,
  PackageCheck,
  LogOut,
  MessageSquare,
} from 'lucide-react';
import { useApp } from '../../app/providers';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { pageTransition } from '../../lib/framer';
import { authService } from '../../services/authService';
import { userService } from '../../services/userService';
import { BASE_URL } from '../../lib/api';
import { orderService } from '../../services/orderService';
import { walletService, type CoinTransaction } from '../../services/walletService';
import type { UserCoupon, CustomerAddress, SupportNotification } from '../../types';
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
    removeNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    refreshNotifications,
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
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notifCategory, setNotifCategory] = useState<'all' | 'orders' | 'coupons' | 'rewards' | 'support' | 'system'>('all');
  const [notifReadFilter, setNotifReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [isNotifLoading, setIsNotifLoading] = useState(false);
  const [notifActionSuccess, setNotifActionSuccess] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

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
    dob: user?.profile.dob || '',
    gender: user?.profile.gender || '',
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
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancellingOrderId(orderId);
    try {
      const updatedOrder = await orderService.cancelOrder(orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updatedOrder);
      }
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert('Failed to cancel order. Please try again.');
    } finally {
      setCancellingOrderId(null);
    }
  };

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



  // Keep profile form in sync if the user object changes (e.g. after rehydration from /users/me)
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.profile.phone || '',
        dob: user.profile.dob || '',
        gender: user.profile.gender || '',
      });
    }
  }, [user]);

  // --- Avatar upload state ---
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [imgLoadError, setImgLoadError] = useState(false);

  useEffect(() => {
    setImgLoadError(false);
  }, [avatarPreviewUrl, user?.profile?.avatarUrl, (user?.profile as any)?.avatar_url]);

  // --- Unsaved Changes Tracking ---
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingTabChange, setPendingTabChange] = useState<CustomerTab | null>(null);

  const isProfileDirty = 
    activeTab === 'profile' && (
      pendingAvatarFile !== null ||
      profileForm.name !== (user?.name || '') ||
      profileForm.phone !== (user?.profile.phone || '') ||
      profileForm.dob !== (user?.profile.dob || '') ||
      profileForm.gender !== (user?.profile.gender || '')
    );

  // Fallback interceptor for React Router links since BrowserRouter doesn't support useBlocker
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (!isProfileDirty) return;
      
      let target = e.target as HTMLElement | null;
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }

      if (target && target.tagName === 'A') {
        const href = target.getAttribute('href');
        // Check if it's an internal link navigating away from the dashboard
        if (href && href.startsWith('/') && !href.startsWith('/dashboard')) {
          e.preventDefault();
          e.stopPropagation();
          // Store the destination href in pendingTabChange temporarily (hack)
          setPendingTabChange(href as unknown as CustomerTab);
          setShowUnsavedModal(true);
        }
      }
    };

    document.addEventListener('click', handleGlobalClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, [isProfileDirty]);

  const handleTabChange = (newTab: CustomerTab) => {
    if (activeTab === 'profile' && isProfileDirty) {
      setPendingTabChange(newTab);
      setShowUnsavedModal(true);
      return;
    }
    setActiveTab(newTab);
    setIsSidebarOpen(false);
  };

  const handleConfirmDiscard = () => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.profile.phone || '',
        dob: user.profile.dob || '',
        gender: user.profile.gender || '',
      });
      setPendingAvatarFile(null);
      setAvatarPreviewUrl(null);
    }
    
    if (pendingTabChange) {
      const tabStr = pendingTabChange as string;
      if (tabStr.startsWith('/')) {
        navigate(tabStr);
        return;
      }
      setActiveTab(pendingTabChange);
    }
    setShowUnsavedModal(false);
    setPendingTabChange(null);
    setIsSidebarOpen(false);
  };

  const handleCancelDiscard = () => {
    setShowUnsavedModal(false);
    setPendingTabChange(null);
  };

  // Warn on page reload/close if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isProfileDirty) {
        e.preventDefault();
        e.returnValue = ''; // Standard way to trigger the native browser prompt
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isProfileDirty]);

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

  // --- Update password state (OTP flow) ---
  const [showUpdatePasswordForm, setShowUpdatePasswordForm] = useState(false);
  const [updatePasswordStep, setUpdatePasswordStep] = useState<1 | 2 | 3>(1);
  const [updatePasswordEmail, setUpdatePasswordEmail] = useState('');
  const [updatePasswordOTP, setUpdatePasswordOTP] = useState('');
  const [updatePasswordNew, setUpdatePasswordNew] = useState('');
  const [updatePasswordConfirm, setUpdatePasswordConfirm] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [updatePasswordMessage, setUpdatePasswordMessage] = useState('');
  const [updatePasswordError, setUpdatePasswordError] = useState('');
  const [updatePasswordTimer, setUpdatePasswordTimer] = useState(0);

  // Initialize email when form opens
  useEffect(() => {
    if (showUpdatePasswordForm && user?.email) {
      setUpdatePasswordEmail(user.email);
    }
  }, [showUpdatePasswordForm, user?.email]);

  // Timer countdown
  useEffect(() => {
    if (updatePasswordTimer > 0) {
      const interval = setInterval(() => setUpdatePasswordTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [updatePasswordTimer]);

  // --- Coupons: fetched from backend, not hardcoded ---
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [usedCoupons, setUsedCoupons] = useState<any[]>([]);
  const [isCouponsLoading, setIsCouponsLoading] = useState(false);
  const [couponsError, setCouponsError] = useState('');

  useEffect(() => {
    if (activeTab !== 'coupons') return;
    let cancelled = false;
    setIsCouponsLoading(true);
    setCouponsError('');
    Promise.all([
      userService.getCoupons(),
      userService.getUsedCoupons(),
    ])
      .then(([availData, usedData]) => {
        if (!cancelled) {
          setCoupons(availData || []);
          setUsedCoupons(usedData || []);
        }
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

  // --- Overview Coupons: separate state for the overview tab's coupon preview ---
  // Fetched on mount (overview tab) so the count and cards are always live from the backend.
  const [overviewCoupons, setOverviewCoupons] = useState<UserCoupon[]>([]);
  const [isOverviewCouponsLoading, setIsOverviewCouponsLoading] = useState(false);
  const [overviewCouponsError, setOverviewCouponsError] = useState('');

  useEffect(() => {
    if (activeTab !== 'overview') return;
    let cancelled = false;
    setIsOverviewCouponsLoading(true);
    setOverviewCouponsError('');
    userService
      .getCoupons()
      .then((data) => {
        if (!cancelled) setOverviewCoupons(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load coupons.';
          setOverviewCouponsError(message);
        }
      })
      .finally(() => {
        if (!cancelled) setIsOverviewCouponsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  // --- Rewards & Wallet Transactions State ---
  const [rewardsTab, setRewardsTab] = useState<'balance' | 'rules'>('balance');
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

  // --- Coupon Expiry Date Formatter Helper ---
  const formatCouponExpiry = (rawExp: any): string => {
    if (!rawExp) return 'No expiry';
    const strVal = String(rawExp).trim();
    if (!strVal || strVal.toLowerCase() === 'no expiry' || strVal.toLowerCase() === 'none' || strVal.toLowerCase() === 'null' || strVal.toLowerCase() === 'undefined') {
      return 'No expiry';
    }

    // Match YYYY-MM-DD (e.g. 2026-08-31 or 2026-08-31T23:59:59Z)
    const matchYMD = strVal.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (matchYMD) {
      const [, y, m, d] = matchYMD;
      return `${d}-${m}-${y}`;
    }

    // Match DD-MM-YYYY (e.g. 31-08-2026)
    const matchDMY = strVal.match(/^(\d{2})-(\d{2})-(\d{4})/);
    if (matchDMY) {
      return `${matchDMY[1]}-${matchDMY[2]}-${matchDMY[3]}`;
    }

    // Match DD/MM/YYYY (e.g. 31/08/2026)
    const matchSlashDMY = strVal.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (matchSlashDMY) {
      const [, d, m, y] = matchSlashDMY;
      return `${d}-${m}-${y}`;
    }

    // Match YYYY/MM/DD (e.g. 2026/08/31)
    const matchSlashYMD = strVal.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
    if (matchSlashYMD) {
      const [, y, m, d] = matchSlashYMD;
      return `${d}-${m}-${y}`;
    }

    try {
      const d = new Date(rawExp);
      if (!isNaN(d.getTime())) {
        const day = String(d.getUTCDate()).padStart(2, '0');
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const year = d.getUTCFullYear();
        return `${day}-${month}-${year}`;
      }
    } catch {
      // fallback
    }

    return strVal;
  };

  const parseCouponDate = (val: any): Date | null => {
    if (!val) return null;
    if (val instanceof Date && !isNaN(val.getTime())) return val;
    const str = String(val).trim();
    if (!str || str.toLowerCase() === 'no expiry' || str.toLowerCase() === 'none' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') {
      return null;
    }
    const matchYMD = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}):(\d{2}))?/);
    if (matchYMD) {
      const [, y, m, d, h = '23', min = '59', s = '59'] = matchYMD;
      return new Date(Date.UTC(+y, +m - 1, +d, +h, +min, +s));
    }
    const matchDMY = str.match(/^(\d{2})-(\d{2})-(\d{4})(?:[T\s](\d{2}):(\d{2}):(\d{2}))?/);
    if (matchDMY) {
      const [, d, m, y, h = '23', min = '59', s = '59'] = matchDMY;
      return new Date(Date.UTC(+y, +m - 1, +d, +h, +min, +s));
    }
    const matchSlashDMY = str.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[T\s](\d{2}):(\d{2}):(\d{2}))?/);
    if (matchSlashDMY) {
      const [, d, m, y, h = '23', min = '59', s = '59'] = matchSlashDMY;
      return new Date(Date.UTC(+y, +m - 1, +d, +h, +min, +s));
    }
    const parsed = new Date(val);
    return !isNaN(parsed.getTime()) ? parsed : null;
  };

  // --- Support Form Toggle State ---
  const [showSupportForm, setShowSupportForm] = useState(false);

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

    // DOB validation (if provided) — only checks that date is in the past and plausible
    if (profileForm.dob) {
      const dobDate = new Date(profileForm.dob);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(dobDate.getTime())) {
        setProfileError('Please enter a valid Date of Birth.');
        return;
      }
      if (dobDate >= today) {
        setProfileError('Date of Birth must be in the past.');
        return;
      }
      const ageYears = today.getFullYear() - dobDate.getFullYear() -
        (today < new Date(today.getFullYear(), dobDate.getMonth(), dobDate.getDate()) ? 1 : 0);
      if (ageYears > 120) {
        setProfileError('Please enter a valid Date of Birth.');
        return;
      }
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
        dob: profileForm.dob || undefined,
        gender: profileForm.gender || undefined,
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

  // handlePreferencesSave — DOB/Gender have been moved to My Profile.
  // This handler now only handles the outer settings form submit.
  // Password changes use their own separate handleChangePasswordSubmit.
  const handlePreferencesSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // No-op: the only remaining save in Account Settings is the Change Password
    // sub-form which has its own submit handler. DOB and Gender are now in My Profile.
  };

  const handleSendUpdatePasswordOTP = async () => {
    setUpdatePasswordError('');
    setUpdatePasswordMessage('');
    if (!updatePasswordEmail) {
      setUpdatePasswordError('Email is required.');
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const res = await authService.sendUpdatePasswordOTP(updatePasswordEmail);
      setUpdatePasswordMessage(res.message || 'OTP sent successfully.');
      setUpdatePasswordStep(2);
      setUpdatePasswordTimer(90);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP.';
      setUpdatePasswordError(msg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleVerifyUpdatePasswordOTP = async () => {
    setUpdatePasswordError('');
    setUpdatePasswordMessage('');
    if (!updatePasswordOTP || updatePasswordOTP.length !== 6) {
      setUpdatePasswordError('Please enter a valid 6-digit OTP.');
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const res = await authService.verifyUpdatePasswordOTP(updatePasswordEmail, updatePasswordOTP);
      setUpdatePasswordMessage(res.message || 'OTP verified successfully.');
      setUpdatePasswordStep(3);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to verify OTP.';
      setUpdatePasswordError(msg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleUpdatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatePasswordError('');
    setUpdatePasswordMessage('');

    if (!updatePasswordNew) {
      setUpdatePasswordError('New password is required.');
      return;
    }
    if (updatePasswordNew.length < 8) {
      setUpdatePasswordError('New password must be at least 8 characters.');
      return;
    }
    if (!updatePasswordConfirm) {
      setUpdatePasswordError('Please confirm your new password.');
      return;
    }
    if (updatePasswordNew !== updatePasswordConfirm) {
      setUpdatePasswordError('New password and confirm password do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await authService.updatePasswordWithOTP(
        updatePasswordEmail,
        updatePasswordNew,
        updatePasswordConfirm
      );
      setUpdatePasswordMessage(res.message || 'Password updated successfully.');
      setTimeout(() => {
        setShowUpdatePasswordForm(false);
        setUpdatePasswordStep(1);
        setUpdatePasswordOTP('');
        setUpdatePasswordNew('');
        setUpdatePasswordConfirm('');
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update password.';
      setUpdatePasswordError(msg);
    } finally {
      setIsUpdatingPassword(false);
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
                    onClick={() => handleTabChange(menuItem.id as CustomerTab)}
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

          {/* Session & Logout Group */}
          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(201, 168, 76, 0.2)' }}>
            <div className="sidebar-group-title" style={{ marginTop: 0 }}>SESSION</div>
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                handleLogoutClick();
              }}
              className="dashboard-menu-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                color: '#ff4d4f',
                background: 'rgba(255, 77, 79, 0.08)',
                border: '1px solid rgba(255, 77, 79, 0.25)',
                borderRadius: '8px',
                padding: '10px 14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <LogOut size={18} />
              <span style={{ fontWeight: 600 }}>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Right Main Content Workspace Panel */}
        <main className="customer-workspace-main">
          {/* Top Header Bar with Mobile Drawer Trigger */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <button
              className="dashboard-mobile-trigger"
              onClick={() => setIsSidebarOpen(true)}
              style={{ margin: 0 }}
            >
              <Menu size={18} />
              <span>Customer Dashboard Menu</span>
            </button>
          </div>

          {/* OVERVIEW PANEL */}
          {activeTab === 'overview' && (
            <div>
              {/* Welcome Title Banner */}
              <div style={{ marginBottom: '28px' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.1rem', color: '#f5efe6', margin: '0 0 6px 0', fontWeight: 700 }}>
                  {orders.length === 0
                    ? `Welcome, ${user.name ? user.name.split(' ')[0] : ''}! 👋`
                    : `Welcome back, ${user.name ? user.name.split(' ')[0] : ''}! 👋`
                  }
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
                    <span className="stat-card-value">{isOverviewCouponsLoading ? '…' : overviewCoupons.length}</span>
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
                      {orders.slice(0, 4).map((ord) => {
                        const statusBg =
                          ord.status === 'Delivered' || (ord.status as string) === 'Confirmed'
                            ? 'rgba(46, 204, 113, 0.15)'
                            : ord.status === 'Cancelled'
                            ? 'rgba(231, 76, 60, 0.15)'
                            : 'rgba(241, 196, 15, 0.15)';
                        const statusColor =
                          ord.status === 'Delivered' || (ord.status as string) === 'Confirmed'
                            ? '#2ecc71'
                            : ord.status === 'Cancelled'
                            ? '#e74c3c'
                            : '#f1c40f';
                        const statusBorder =
                          ord.status === 'Delivered' || (ord.status as string) === 'Confirmed'
                            ? '1px solid rgba(46, 204, 113, 0.3)'
                            : ord.status === 'Cancelled'
                            ? '1px solid rgba(231, 76, 60, 0.3)'
                            : '1px solid rgba(241, 196, 15, 0.3)';
                        return (
                          <div
                            key={ord.id}
                            style={{
                              padding: '12px 14px',
                              background: 'rgba(0,0,0,0.3)',
                              border: '1px solid rgba(255,255,255,0.06)',
                              borderRadius: '8px',
                              display: 'grid',
                              gridTemplateColumns: '1fr auto auto',
                              alignItems: 'center',
                              gap: '12px',
                            }}
                          >
                            {/* LEFT: thumbnail + order meta */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                              <img
                                src={ord.items[0]?.product?.image || ord.items[0]?.product?.images?.[0] || 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=120&q=80'}
                                alt="Product"
                                style={{ width: '44px', height: '44px', flexShrink: 0, borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(201,168,76,0.2)' }}
                              />
                              <div style={{ minWidth: 0 }}>
                                <span style={{ fontWeight: 700, color: '#f5efe6', fontSize: '0.82rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ord.id}</span>
                                <span style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.45)', display: 'block', marginTop: '2px', whiteSpace: 'nowrap' }}>
                                  {ord.date} &middot; {ord.items.length} {ord.items.length === 1 ? 'Item' : 'Items'}
                                </span>
                              </div>
                            </div>

                            {/* MIDDLE: amount + status badge */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                              <span style={{ fontWeight: 700, color: '#f5efe6', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                                ₹{ord.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                  display: 'inline-block',
                                  whiteSpace: 'nowrap',
                                  marginTop: '4px',
                                  background: statusBg,
                                  color: statusColor,
                                  border: statusBorder,
                                }}
                              >
                                {ord.status}
                              </span>
                            </div>

                            {/* RIGHT: View Details button */}
                            <div style={{ flexShrink: 0 }}>
                              <button
                                onClick={() => {
                                  setSelectedOrder(ord);
                                  setOrderSubView('details');
                                  setActiveTab('orders');
                                }}
                                style={{
                                  padding: '7px 12px',
                                  background: 'transparent',
                                  border: '1px solid rgba(201, 168, 76, 0.4)',
                                  color: '#c9a84c',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  transition: 'border-color 0.2s, background 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(201,168,76,0.1)';
                                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(201,168,76,0.7)';
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(201,168,76,0.4)';
                                }}
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        );
                      })}
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

                  {/* Loading state */}
                  {isOverviewCouponsLoading && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[1, 2, 3].map((n) => (
                        <div
                          key={n}
                          style={{
                            height: '72px',
                            borderRadius: '8px',
                            background: 'rgba(201,168,76,0.06)',
                            border: '1px solid rgba(201,168,76,0.12)',
                            animation: 'pulse 1.5s ease-in-out infinite',
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* API error state */}
                  {!isOverviewCouponsLoading && overviewCouponsError && (
                    <p style={{ color: 'rgba(231,76,60,0.85)', fontSize: '0.85rem', margin: 0 }}>
                      {overviewCouponsError}
                    </p>
                  )}

                  {/* Empty state */}
                  {!isOverviewCouponsLoading && !overviewCouponsError && overviewCoupons.length === 0 && (
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', fontSize: '0.88rem', margin: 0 }}>
                      No offers available for your account right now.
                    </p>
                  )}

                  {/* Dynamic coupon cards from backend */}
                  {!isOverviewCouponsLoading && !overviewCouponsError && overviewCoupons.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {overviewCoupons.slice(0, 3).map((coupon) => {
                        // Build a human-readable description from real backend fields
                        let couponDesc = '';
                        if (coupon.discount_type === 'PERCENTAGE' && (coupon.discount_percent ?? 0) > 0) {
                          couponDesc = `${coupon.discount_percent}% OFF on your order.`;
                        } else if (coupon.discount_type === 'FIXED_AMOUNT' && (coupon.discount_amount ?? 0) > 0) {
                          couponDesc = `₹${coupon.discount_amount} OFF on your order.`;
                        } else if (coupon.discount_type === 'FREE_SHIPPING') {
                          couponDesc = 'Free Shipping on your order.';
                        } else {
                          couponDesc = coupon.description || coupon.desc || 'Special discount on your order.';
                        }

                        // Build terms line from real backend fields
                        const termsParts: string[] = [];
                        if ((coupon.minimum_order_amount ?? 0) > 0) {
                          termsParts.push(`Min. order: ₹${coupon.minimum_order_amount}`);
                        }
                        const rawExp = coupon.expires_at || coupon.expiryDate || coupon.expiry_date || coupon.expiresAt || coupon.end_date || coupon.endDate || coupon.exp || (coupon as any).expiry;
                        const expFormatted = formatCouponExpiry(rawExp);
                        if (expFormatted && expFormatted.toLowerCase() !== 'no expiry') {
                          termsParts.push(`Expires: ${expFormatted}`);
                        } else {
                          termsParts.push('No Expiry');
                        }
                        const couponTerms = termsParts.join(' · ');

                        return (
                          <div key={coupon.code} className="coupon-ticket-card">
                            <div className="coupon-ticket-left">
                              <span className="coupon-ticket-code">{coupon.code}</span>
                            </div>
                            <div className="coupon-ticket-right">
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                  <h4 style={{ color: '#f5efe6', margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 700 }}>
                                    {coupon.name || coupon.code}
                                  </h4>
                                  <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: '0.78rem' }}>
                                    {couponDesc}
                                  </p>
                                </div>
                                <button
                                  className="coupon-copy-btn"
                                  onClick={() => handleCopyCouponCode(coupon.code)}
                                >
                                  {copiedCode === coupon.code ? 'Copied!' : 'Copy Code'}
                                </button>
                              </div>
                              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: '8px', display: 'block' }}>
                                {couponTerms}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
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

                    {(() => {
                      const profileAvatarRaw = avatarPreviewUrl || user.profile.avatarUrl || (user.profile as any)?.avatar_url;
                      const formattedAvatarUrl = profileAvatarRaw && !profileAvatarRaw.startsWith('http') && !profileAvatarRaw.startsWith('data:') && !profileAvatarRaw.startsWith('blob:')
                        ? profileAvatarRaw.startsWith('/') ? `${BASE_URL}${profileAvatarRaw}` : `${BASE_URL}/${profileAvatarRaw}`
                        : profileAvatarRaw;

                      return formattedAvatarUrl && !imgLoadError ? (
                        <img
                          src={formattedAvatarUrl}
                          alt="Profile Preview"
                          onError={() => setImgLoadError(true)}
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
                      );
                    })()}

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

                    {/* ── Personal Information ── */}
                    <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(201,168,76,0.15)', marginTop: '4px' }}>
                      <h4 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1rem',
                        color: '#c9a84c',
                        fontWeight: 700,
                        margin: '0 0 18px 0',
                        letterSpacing: '0.3px',
                      }}>
                        Personal Information
                      </h4>

                      <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1fr 1fr', gap: '20px' }}>
                        {/* Date of Birth */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.88rem', color: '#f5efe6', fontWeight: 600, marginBottom: '8px' }}>
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            value={profileForm.dob}
                            max={new Date().toISOString().split('T')[0]}
                            min={new Date(new Date().setFullYear(new Date().getFullYear() - 120)).toISOString().split('T')[0]}
                            onChange={(e) => {
                              setProfileForm({ ...profileForm, dob: e.target.value });
                              if (profileError) setProfileError('');
                            }}
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              borderRadius: '6px',
                              background: 'rgba(0, 0, 0, 0.4)',
                              border: `1px solid ${profileForm.dob ? 'rgba(46,204,113,0.5)' : 'rgba(201,168,76,0.3)'}`,
                              color: '#f5efe6',
                              fontSize: '0.9rem',
                              outline: 'none',
                              boxSizing: 'border-box',
                              colorScheme: 'dark',
                              transition: 'border-color 0.2s ease',
                            }}
                          />
                        </div>

                        {/* Gender */}
                        <div>
                          <label style={{ display: 'block', fontSize: '0.88rem', color: '#f5efe6', fontWeight: 600, marginBottom: '8px' }}>
                            Gender
                          </label>
                          <select
                            value={profileForm.gender}
                            onChange={(e) => {
                              setProfileForm({ ...profileForm, gender: e.target.value });
                              if (profileError) setProfileError('');
                            }}
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              borderRadius: '6px',
                              background: '#120e0b',
                              border: `1px solid ${profileForm.gender ? 'rgba(46,204,113,0.5)' : 'rgba(201,168,76,0.3)'}`,
                              color: profileForm.gender ? '#f5efe6' : 'rgba(255,255,255,0.45)',
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
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#f5efe6', margin: 0, fontWeight: 700 }}>
                        Order #{selectedOrder.id}
                      </h2>
                      {/* Order Status Badge */}
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          padding: '4px 14px',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          background:
                            selectedOrder.status === 'Delivered'
                              ? 'rgba(46, 204, 113, 0.18)'
                              : selectedOrder.status === 'Confirmed'
                              ? 'rgba(52, 152, 219, 0.18)'
                              : selectedOrder.status === 'Cancelled'
                              ? 'rgba(231, 76, 60, 0.18)'
                              : selectedOrder.status === 'Returned'
                              ? 'rgba(155, 89, 182, 0.18)'
                              : 'rgba(241, 196, 15, 0.18)',
                          color:
                            selectedOrder.status === 'Delivered'
                              ? '#2ecc71'
                              : selectedOrder.status === 'Confirmed'
                              ? '#3498db'
                              : selectedOrder.status === 'Cancelled'
                              ? '#e74c3c'
                              : selectedOrder.status === 'Returned'
                              ? '#9b59b6'
                              : '#f1c40f',
                          border:
                            selectedOrder.status === 'Delivered'
                              ? '1px solid rgba(46, 204, 113, 0.4)'
                              : selectedOrder.status === 'Confirmed'
                              ? '1px solid rgba(52, 152, 219, 0.4)'
                              : selectedOrder.status === 'Cancelled'
                              ? '1px solid rgba(231, 76, 60, 0.4)'
                              : selectedOrder.status === 'Returned'
                              ? '1px solid rgba(155, 89, 182, 0.4)'
                              : '1px solid rgba(241, 196, 15, 0.4)',
                        }}
                      >
                        Order Status: {selectedOrder.status}
                      </span>
                      {/* Payment Status Badge */}
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          padding: '4px 14px',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          background:
                            (selectedOrder.payment_status || 'Paid').toUpperCase() === 'PAID'
                              ? 'rgba(46, 204, 113, 0.18)'
                              : (selectedOrder.payment_status || '').toUpperCase() === 'FAILED'
                              ? 'rgba(231, 76, 60, 0.18)'
                              : (selectedOrder.payment_status || '').toUpperCase().includes('REFUND')
                              ? 'rgba(155, 89, 182, 0.18)'
                              : 'rgba(241, 196, 15, 0.18)',
                          color:
                            (selectedOrder.payment_status || 'Paid').toUpperCase() === 'PAID'
                              ? '#2ecc71'
                              : (selectedOrder.payment_status || '').toUpperCase() === 'FAILED'
                              ? '#e74c3c'
                              : (selectedOrder.payment_status || '').toUpperCase().includes('REFUND')
                              ? '#9b59b6'
                              : '#f1c40f',
                          border:
                            (selectedOrder.payment_status || 'Paid').toUpperCase() === 'PAID'
                              ? '1px solid rgba(46, 204, 113, 0.4)'
                              : (selectedOrder.payment_status || '').toUpperCase() === 'FAILED'
                              ? '1px solid rgba(231, 76, 60, 0.4)'
                              : (selectedOrder.payment_status || '').toUpperCase().includes('REFUND')
                              ? '1px solid rgba(155, 89, 182, 0.4)'
                              : '1px solid rgba(241, 196, 15, 0.4)',
                        }}
                      >
                        Payment Status: {selectedOrder.payment_status || 'Paid'}
                      </span>
                    </div>

                    <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.9rem', margin: '0 0 28px 0' }}>
                      Placed on {selectedOrder.date} &nbsp;•&nbsp; Payment Method: <strong>{selectedOrder.paymentMethod || 'Cash on Delivery'}</strong>
                    </p>

                    {/* Order Status Lifecycle Tracker Card (Represents Order Status Only) */}
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
                      {(() => {
                        const currentSt = selectedOrder.status || 'Processing';

                        if (currentSt === 'Cancelled') {
                          const cancelledSteps = [
                            { key: 'Placed', label: 'Order Placed', icon: Clock, isDone: true, isError: false },
                            { key: 'Confirmed', label: 'Confirmed', icon: Check, isDone: true, isError: false },
                            { key: 'Cancelled', label: 'Cancelled', icon: X, isDone: true, isError: true },
                          ];
                          return (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                              <div style={{ position: 'absolute', top: '20px', left: '40px', right: '40px', height: '2px', background: 'rgba(231, 76, 60, 0.3)', zIndex: 1 }} />
                              {cancelledSteps.map((step) => {
                                const StepIcon = step.icon;
                                return (
                                  <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative' }}>
                                    <div
                                      style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: step.isError ? '#e74c3c' : '#2ecc71',
                                        border: `2px solid ${step.isError ? '#e74c3c' : '#2ecc71'}`,
                                        color: '#0f0c0a',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: `0 0 14px ${step.isError ? 'rgba(231, 76, 60, 0.4)' : 'rgba(46, 204, 113, 0.4)'}`,
                                      }}
                                    >
                                      <StepIcon size={18} />
                                    </div>
                                    <span style={{ marginTop: '10px', fontSize: '0.82rem', fontWeight: 700, color: step.isError ? '#e74c3c' : '#f5efe6' }}>
                                      {step.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }

                        if (currentSt === 'Returned') {
                          const returnedSteps = [
                            { key: 'Placed', label: 'Order Placed', icon: Clock },
                            { key: 'Confirmed', label: 'Confirmed', icon: Check },
                            { key: 'Processing', label: 'Processing', icon: Package },
                            { key: 'Shipped', label: 'Shipped', icon: Truck },
                            { key: 'Delivered', label: 'Delivered', icon: PackageCheck },
                            { key: 'Returned', label: 'Returned', icon: RefreshCw },
                          ];
                          return (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                              <div style={{ position: 'absolute', top: '20px', left: '40px', right: '40px', height: '2px', background: 'rgba(155, 89, 182, 0.4)', zIndex: 1 }} />
                              {returnedSteps.map((step) => {
                                const StepIcon = step.icon;
                                const isReturn = step.key === 'Returned';
                                return (
                                  <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative' }}>
                                    <div
                                      style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: isReturn ? '#9b59b6' : '#2ecc71',
                                        border: `2px solid ${isReturn ? '#9b59b6' : '#2ecc71'}`,
                                        color: '#0f0c0a',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: `0 0 14px ${isReturn ? 'rgba(155, 89, 182, 0.4)' : 'rgba(46, 204, 113, 0.4)'}`,
                                      }}
                                    >
                                      <StepIcon size={18} />
                                    </div>
                                    <span style={{ marginTop: '10px', fontSize: '0.82rem', fontWeight: 700, color: isReturn ? '#9b59b6' : '#f5efe6' }}>
                                      {step.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }

                        // Normal flow: Placed → Confirmed → Processing → Shipped → Out for Delivery → Delivered
                        const normalSteps = [
                          { key: 'Pending', label: 'Order Placed', icon: Clock },
                          { key: 'Confirmed', label: 'Confirmed', icon: Check },
                          { key: 'Processing', label: 'Processing', icon: Package },
                          { key: 'Shipped', label: 'Shipped', icon: Truck },
                          { key: 'Out for Delivery', label: 'Out for Delivery', icon: Truck },
                          { key: 'Delivered', label: 'Delivered', icon: PackageCheck },
                        ];

                        const statusHierarchy: Record<string, number> = {
                          'Pending': 0,
                          'Confirmed': 1,
                          'Processing': 2,
                          'Shipped': 3,
                          'Out for Delivery': 4,
                          'Out_For_Delivery': 4,
                          'Delivered': 5,
                        };

                        const currentLevel = statusHierarchy[currentSt] !== undefined ? statusHierarchy[currentSt] : 2;

                        return (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
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
                            {normalSteps.map((step, idx) => {
                              const isDone = idx <= currentLevel;
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
                        );
                      })()}
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
                    <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1.5fr 1fr', gap: '20px', marginBottom: '28px' }}>
                      {/* Card 1: Shipping & Billing Address */}
                      <div
                        style={{
                          background: 'rgba(18, 14, 11, 0.95)',
                          border: '1px solid rgba(201, 168, 76, 0.25)',
                          borderRadius: '14px',
                          padding: '22px',
                          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                        }}
                      >
                        <h4 style={{ color: '#f5efe6', margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 700 }}>Shipping & Billing Address</h4>
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

                      {/* Card 2: Order Summary */}
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
                          {(selectedOrder.tax || 0) > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255, 255, 255, 0.7)' }}>
                              <span>Tax (GST)</span>
                              <span style={{ color: '#f5efe6', fontWeight: 600 }}>
                                ₹{(selectedOrder.tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}
                          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '10px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-baseline' }}>
                            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f5efe6' }}>Total</span>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#c9a84c' }}>
                                ₹{selectedOrder.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span style={{ display: 'block', fontSize: '0.75rem', color: '#2ecc71', fontWeight: 700 }}>
                                Payment: {selectedOrder.payment_status || 'Paid'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Row */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', flexWrap: 'wrap' }}>
                      {selectedOrder.status === 'Processing' && (
                        <button
                          type="button"
                          disabled={cancellingOrderId === selectedOrder.id}
                          onClick={() => handleCancelOrder(selectedOrder.id)}
                          style={{
                            padding: '11px 22px',
                            borderRadius: '8px',
                            background: 'rgba(231, 76, 60, 0.1)',
                            border: '1px solid rgba(231, 76, 60, 0.5)',
                            color: '#e74c3c',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            cursor: cancellingOrderId === selectedOrder.id ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <X size={16} /> {cancellingOrderId === selectedOrder.id ? 'Cancelling...' : 'Cancel Order'}
                        </button>
                      )}
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
                              <div><strong>Payment Status:</strong> <span style={{ color: '#2ecc71', fontWeight: 700 }}>{selectedOrder.payment_status || 'Paid'}</span></div>
                              <div><strong>Order Status:</strong> {selectedOrder.status}</div>
                            </div>
                          </div>
                        </div>

                        {/* Bill To & Ship To Box */}
                        <div style={{ marginBottom: '28px', background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e5dccb' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#c9a84c', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '6px' }}>BILL & SHIP TO</span>
                          <div style={{ fontSize: '0.85rem', color: '#333', lineHeight: 1.5 }}>
                            <strong>{selectedOrder.shippingAddress?.name || user.name}</strong>
                            <div>{user.email}</div>
                            <div>{selectedOrder.shippingAddress?.street || '12-34, MG Road, Block A'}</div>
                            <div>{selectedOrder.shippingAddress?.city || 'Hyderabad'}, {selectedOrder.shippingAddress?.state || 'Telangana'} - {selectedOrder.shippingAddress?.zip || '500001'}</div>
                            <div>India</div>
                            <div>{selectedOrder.shippingAddress?.phone || '9876543210'}</div>
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
                            {(selectedOrder.coupon_discount || 0) > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e74c3c' }}>
                                <span>Coupon Discount</span>
                                <span>-₹{(selectedOrder.coupon_discount || 0).toFixed(2)}</span>
                              </div>
                            )}
                            {(selectedOrder.coin_discount || 0) > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e74c3c' }}>
                                <span>Coin Discount</span>
                                <span>-₹{(selectedOrder.coin_discount || 0).toFixed(2)}</span>
                              </div>
                            )}
                            {((selectedOrder.discount || 0) > 0 && !(selectedOrder.coupon_discount || 0) && !(selectedOrder.coin_discount || 0)) && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e74c3c' }}>
                                <span>Promo Discount</span>
                                <span>-₹{(selectedOrder.discount || 0).toFixed(2)}</span>
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                              <span>Shipping</span>
                              <span>₹{(selectedOrder.shipping || 0).toFixed(2)}</span>
                            </div>
                            {(selectedOrder.tax || 0) > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#555' }}>
                                <span>Tax (GST)</span>
                                <span>₹{(selectedOrder.tax || 0).toFixed(2)}</span>
                              </div>
                            )}
                            <div style={{ borderTop: '2px solid #1a0d00', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800 }}>
                              <span>Grand Total</span>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ color: '#1a0d00' }}>₹{selectedOrder.total.toFixed(2)}</span>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: '#2ecc71', fontWeight: 700 }}>
                                  Payment: {selectedOrder.payment_status || 'Paid'}
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

                          {selectedOrder.status === 'Processing' && (
                            <button
                              type="button"
                              disabled={cancellingOrderId === selectedOrder.id}
                              onClick={() => handleCancelOrder(selectedOrder.id)}
                              style={{
                                width: '100%',
                                padding: '12px 18px',
                                borderRadius: '8px',
                                background: 'rgba(231, 76, 60, 0.1)',
                                border: '1px solid rgba(231, 76, 60, 0.5)',
                                color: '#e74c3c',
                                fontSize: '0.92rem',
                                fontWeight: 700,
                                cursor: cancellingOrderId === selectedOrder.id ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                marginTop: '4px',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              {cancellingOrderId === selectedOrder.id ? 'Cancelling...' : 'Cancel Order'}
                            </button>
                          )}

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
                        {['All Orders', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'].map((statusOption) => {
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
                                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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
                                              ord.status === 'Delivered'
                                                ? 'rgba(46, 204, 113, 0.18)'
                                                : ord.status === 'Confirmed'
                                                ? 'rgba(52, 152, 219, 0.18)'
                                                : ord.status === 'Cancelled'
                                                ? 'rgba(231, 76, 60, 0.18)'
                                                : ord.status === 'Returned'
                                                ? 'rgba(155, 89, 182, 0.18)'
                                                : 'rgba(241, 196, 15, 0.18)',
                                            color:
                                              ord.status === 'Delivered'
                                                ? '#2ecc71'
                                                : ord.status === 'Confirmed'
                                                ? '#3498db'
                                                : ord.status === 'Cancelled'
                                                ? '#e74c3c'
                                                : ord.status === 'Returned'
                                                ? '#9b59b6'
                                                : '#f1c40f',
                                            border:
                                              ord.status === 'Delivered'
                                                ? '1px solid rgba(46, 204, 113, 0.4)'
                                                : ord.status === 'Confirmed'
                                                ? '1px solid rgba(52, 152, 219, 0.4)'
                                                : ord.status === 'Cancelled'
                                                ? '1px solid rgba(231, 76, 60, 0.4)'
                                                : ord.status === 'Returned'
                                                ? '1px solid rgba(155, 89, 182, 0.4)'
                                                : '1px solid rgba(241, 196, 15, 0.4)',
                                          }}
                                        >
                                          {ord.status}
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
                                              (ord.payment_status || 'Paid').toUpperCase() === 'PAID'
                                                ? 'rgba(46, 204, 113, 0.18)'
                                                : (ord.payment_status || '').toUpperCase() === 'FAILED'
                                                ? 'rgba(231, 76, 60, 0.18)'
                                                : (ord.payment_status || '').toUpperCase().includes('REFUND')
                                                ? 'rgba(155, 89, 182, 0.18)'
                                                : 'rgba(241, 196, 15, 0.18)',
                                            color:
                                              (ord.payment_status || 'Paid').toUpperCase() === 'PAID'
                                                ? '#2ecc71'
                                                : (ord.payment_status || '').toUpperCase() === 'FAILED'
                                                ? '#e74c3c'
                                                : (ord.payment_status || '').toUpperCase().includes('REFUND')
                                                ? '#9b59b6'
                                                : '#f1c40f',
                                            border:
                                              (ord.payment_status || 'Paid').toUpperCase() === 'PAID'
                                                ? '1px solid rgba(46, 204, 113, 0.4)'
                                                : (ord.payment_status || '').toUpperCase() === 'FAILED'
                                                ? '1px solid rgba(231, 76, 60, 0.4)'
                                                : (ord.payment_status || '').toUpperCase().includes('REFUND')
                                                ? '1px solid rgba(155, 89, 182, 0.4)'
                                                : '1px solid rgba(241, 196, 15, 0.4)',
                                          }}
                                        >
                                          Payment: {ord.payment_status || 'Paid'}
                                        </span>
                                      </div>
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
                                    {(ord.coupon_discount || 0) > 0 && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '220px' }}>
                                        <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Coupon Discount</span>
                                        <span style={{ color: '#2ecc71' }}>- ₹{(ord.coupon_discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                      </div>
                                    )}
                                    {(ord.coin_discount || 0) > 0 && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '220px' }}>
                                        <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Coin Discount</span>
                                        <span style={{ color: '#2ecc71' }}>- ₹{(ord.coin_discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                      </div>
                                    )}
                                    {((ord.discount || 0) > 0 && !(ord.coupon_discount || 0) && !(ord.coin_discount || 0)) && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '220px' }}>
                                        <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Promo Discount</span>
                                        <span style={{ color: '#2ecc71' }}>- ₹{(ord.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                      </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '220px' }}>
                                      <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Shipping</span>
                                      <span style={{ color: '#f5efe6' }}>₹{(ord.shipping || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    {(ord.tax || 0) > 0 && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '220px' }}>
                                        <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Tax (GST)</span>
                                        <span style={{ color: '#f5efe6' }}>₹{(ord.tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Right: Total & Action Buttons */}
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMobileGrid ? 'flex-start' : 'flex-end', gap: '12px' }}>
                                    <div style={{ textAlign: isMobileGrid ? 'left' : 'right' }}>
                                      <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.5)', display: 'block' }}>Total</span>
                                      <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#c9a84c' }}>
                                        ₹{ord.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                      <span style={{ fontSize: '0.78rem', color: '#2ecc71', fontWeight: 700, display: 'block', marginTop: '2px' }}>
                                        Payment: {ord.payment_status || 'Paid'}
                                      </span>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: isMobileGrid ? 'flex-start' : 'flex-end', marginTop: '4px' }}>
                                      {(ord.status === 'Pending' || ord.status === 'Confirmed' || ord.status === 'Processing') && (
                                        <button
                                          type="button"
                                          disabled={cancellingOrderId === ord.id}
                                          onClick={() => handleCancelOrder(ord.id)}
                                          style={{
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            background: 'rgba(231, 76, 60, 0.1)',
                                            border: '1px solid rgba(231, 76, 60, 0.5)',
                                            color: '#e74c3c',
                                            fontSize: '0.82rem',
                                            fontWeight: 700,
                                            cursor: cancellingOrderId === ord.id ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s ease',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                          }}
                                        >
                                          {cancellingOrderId === ord.id ? 'Cancelling...' : 'Cancel Order'}
                                        </button>
                                      )}
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
                    {showAddAddressForm ? 'Cancel' : 'Add New Address'}
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
                {/* Page Title & Subtitle + Tab Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: '#f5efe6', margin: '0 0 6px 0', fontWeight: 700 }}>
                      Chovique Reward Coins &amp; Wallet
                    </h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem', margin: 0 }}>
                      Track your coin balance, redemption history, and reward rules.
                    </p>
                  </div>

                  {/* Two Buttons / Tabs */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Button
                      variant="gold"
                      glow={rewardsTab === 'balance'}
                      onClick={() => setRewardsTab('balance')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        fontWeight: 600,
                        ...(rewardsTab === 'balance' ? {} : {
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: 'var(--cream)',
                        }),
                      }}
                    >
                      <Coins size={18} />
                      Reward Balance
                    </Button>
                    <Button
                      variant="gold"
                      glow={rewardsTab === 'rules'}
                      onClick={() => setRewardsTab('rules')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        fontWeight: 600,
                        ...(rewardsTab === 'rules' ? {} : {
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: 'var(--cream)',
                        }),
                      }}
                    >
                      <FileText size={18} />
                      Reward Rules
                    </Button>
                  </div>
                </div>

                {/* 1. REWARD BALANCE TAB (Default) */}
                {rewardsTab === 'balance' && (
                  <div>
                    {/* AVAILABLE REWARD BALANCE CARD */}
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
                        Equivalent value: ₹{(wallet?.rupee_value !== undefined ? wallet.rupee_value : ((wallet?.coin_balance ?? 0) / (wallet?.settings?.coins_per_rupee || 10))).toFixed(2)}
                      </div>
                    </div>

                    {/* TRANSACTION LEDGER & AUDIT HISTORY */}
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

                      {/* Date Filters Row */}
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

                {/* 2. REWARD RULES TAB */}
                {rewardsTab === 'rules' && (
                  <div
                    style={{
                      background: 'rgba(18, 14, 11, 0.96)',
                      border: '1px solid rgba(201, 168, 76, 0.35)',
                      borderRadius: '14px',
                      padding: '28px',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                    }}
                  >
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: '#c9a84c', margin: '0 0 16px 0', fontWeight: 700 }}>
                      Chovique Reward Rules
                    </h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.6 }}>
                      Every purchase at Chovique earns you reward coins that can be redeemed for direct discounts on your future orders.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1fr 1fr 1fr', gap: '20px' }}>
                      <div
                        style={{
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(201, 168, 76, 0.25)',
                          borderRadius: '10px',
                          padding: '20px',
                        }}
                      >
                        <div style={{ fontSize: '0.8rem', color: '#c9a84c', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>
                          Earn Rule
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f5efe6', marginBottom: '6px' }}>
                          ₹{wallet?.settings?.spend_per_coin ?? 10} spent = 1 Coin
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.55)', margin: 0 }}>
                          Earn coins automatically whenever an order is successfully completed.
                        </p>
                      </div>

                      <div
                        style={{
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(201, 168, 76, 0.25)',
                          borderRadius: '10px',
                          padding: '20px',
                        }}
                      >
                        <div style={{ fontSize: '0.8rem', color: '#c9a84c', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>
                          Redeem Rule
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f5efe6', marginBottom: '6px' }}>
                          {wallet?.settings?.coins_per_rupee ?? 10} Coins = ₹1 Discount
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.55)', margin: 0 }}>
                          Redeem your collected coins directly at checkout for instant savings.
                        </p>
                      </div>

                      <div
                        style={{
                          background: 'rgba(0, 0, 0, 0.4)',
                          border: '1px solid rgba(201, 168, 76, 0.25)',
                          borderRadius: '10px',
                          padding: '20px',
                        }}
                      >
                        <div style={{ fontSize: '0.8rem', color: '#c9a84c', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>
                          Max Usage
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f5efe6', marginBottom: '6px' }}>
                          Up to {wallet?.settings?.max_redemption_percentage ?? 20}% per order
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.55)', margin: 0 }}>
                          Apply coin discounts up to 20% of your total order amount.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* COUPONS PANEL */}
            {activeTab === 'coupons' && (
              <div>
                {/* SECTION 1: AVAILABLE COUPONS */}
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: '#f5efe6', margin: '0 0 6px 0', fontWeight: 700 }}>
                      My Available Coupons
                    </h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem', margin: 0 }}>
                      Exclusive promotional discounts and rewards available for your next order.
                    </p>
                  </div>

                  {isCouponsLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255, 255, 255, 0.7)', padding: '36px 0', justifyContent: 'center' }}>
                      <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: '#c9a84c' }} />
                      <span style={{ fontSize: '0.95rem' }}>Loading your coupons...</span>
                    </div>
                  ) : couponsError ? (
                    <div style={{ padding: '16px 20px', background: 'rgba(231, 76, 60, 0.12)', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'center' }}>
                      {couponsError}
                    </div>
                  ) : (() => {
                      const seenCodes = new Set<string>();
                      const uniqueCoupons = coupons.filter((c) => {
                        const key = (c.code || '').trim().toUpperCase();
                        if (!key || seenCodes.has(key)) return false;
                        seenCodes.add(key);
                        return true;
                      });

                      if (uniqueCoupons.length === 0) {
                        return (
                          <div style={{ padding: '36px 24px', background: 'rgba(18, 14, 11, 0.6)', border: '1px dashed rgba(201, 168, 76, 0.3)', borderRadius: '12px', textAlign: 'center' }}>
                            <Tag size={32} style={{ color: '#c9a84c', marginBottom: '10px' }} />
                            <h3 style={{ color: '#f5efe6', margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: 700 }}>
                              No Available Coupons
                            </h3>
                            <p style={{ color: 'rgba(255, 255, 255, 0.6)', margin: 0, fontSize: '0.88rem' }}>
                              Check back later for exclusive Chovique offers.
                            </p>
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

                            const rawExpiry = c.expires_at || c.expiryDate || c.expiry_date || c.expiresAt || c.end_date || c.endDate;
                            const expiryStr = formatCouponExpiry(rawExpiry) || 'No Expiry';
                            const titleText = (c.name || couponItem.title || c.code || 'SPECIAL DISCOUNT').toUpperCase();
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
                                  border: '1px solid rgba(201, 168, 76, 0.4)',
                                  borderRadius: '14px',
                                  padding: '24px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between',
                                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7)',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 700, color: '#f5efe6', margin: 0 }}>
                                    {titleText}
                                  </h3>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase', background: 'rgba(46, 204, 113, 0.15)', color: '#2ecc71', border: '1px solid #2ecc71' }}>
                                    ● Available
                                  </span>
                                </div>

                                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#c9a84c', margin: '4px 0 14px 0', fontFamily: 'var(--font-display)' }}>
                                  {discountStr}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 0, 0, 0.4)', border: '1px dashed rgba(201, 168, 76, 0.35)', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px' }}>
                                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f5efe6' }}>
                                    Code: <span style={{ color: '#c9a84c' }}>{c.code}</span>
                                  </span>
                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyCouponCode(c.code)}
                                      style={{
                                        padding: '6px 10px',
                                        borderRadius: '6px',
                                        background: isCopied ? 'rgba(46, 204, 113, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                                        color: isCopied ? '#2ecc71' : '#f5efe6',
                                        border: isCopied ? '1px solid #2ecc71' : '1px solid rgba(255, 255, 255, 0.2)',
                                        fontSize: '0.78rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {isCopied ? '✓ COPIED' : 'COPY'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const formatted = c.code.trim().toUpperCase();
                                        sessionStorage.setItem(
                                          'chovique_checkout_coupon',
                                          JSON.stringify({
                                            code: formatted,
                                            discount_amount: 0,
                                            auto_apply: true,
                                          })
                                        );
                                        navigate('/cart');
                                      }}
                                      style={{
                                        padding: '6px 14px',
                                        borderRadius: '6px',
                                        background: 'linear-gradient(135deg, #c9a84c 0%, #e5c875 100%)',
                                        color: '#0f0c0a',
                                        border: 'none',
                                        fontSize: '0.8rem',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 10px rgba(201, 168, 76, 0.3)',
                                      }}
                                    >
                                      USE COUPON
                                    </button>
                                  </div>
                                </div>

                                <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.86rem', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                                  {descText}
                                </p>

                                <div style={{ borderTop: '1px solid rgba(201, 168, 76, 0.15)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.55)' }}>
                                  <span>Minimum order: <strong style={{ color: '#f5efe6' }}>{minOrderStr}</strong></span>
                                  <span>Expires: <strong style={{ color: '#f5efe6' }}>{expiryStr}</strong></span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                  })()}
                </div>

                {/* SECTION 2: USED COUPONS HISTORY */}
                <div style={{ marginTop: '40px', paddingTop: '32px', borderTop: '1px solid rgba(201, 168, 76, 0.2)' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: '#f5efe6', margin: '0 0 6px 0', fontWeight: 700 }}>
                      Used Coupons
                    </h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.88rem', margin: 0 }}>
                      History of redeemed coupons and savings on your past orders.
                    </p>
                  </div>

                  {usedCoupons.length === 0 ? (
                    <div style={{ padding: '30px 20px', background: 'rgba(18, 14, 11, 0.4)', border: '1px dashed rgba(255, 255, 255, 0.15)', borderRadius: '10px', color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.88rem' }}>
                      No coupon history recorded yet. Apply an available coupon on your next order to receive instant savings!
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {usedCoupons.map((uc: any) => (
                        <div
                          key={uc.id || uc.code + uc.order_id}
                          style={{
                            background: 'rgba(18, 14, 11, 0.85)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '10px',
                            padding: '16px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '12px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(201, 168, 76, 0.12)', border: '1px solid rgba(201, 168, 76, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Tag size={20} style={{ color: '#c9a84c' }} />
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ color: '#c9a84c', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '0.5px' }}>
                                  {uc.code}
                                </span>
                                <span style={{ color: '#2ecc71', fontWeight: 700, fontSize: '0.88rem' }}>
                                  — {uc.discount_str || `₹${uc.discount_received} OFF`}
                                </span>
                              </div>
                              <div style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.84rem', marginTop: '3px' }}>
                                Used on Order <strong style={{ color: '#f5efe6' }}>#{uc.order_id}</strong> • Date: <strong style={{ color: '#f5efe6' }}>{uc.used_at}</strong>
                              </div>
                            </div>
                          </div>

                          <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '4px 10px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.7)', border: '1px solid rgba(255, 255, 255, 0.2)', textTransform: 'uppercase' }}>
                            ● Used
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* NOTIFICATIONS PANEL */}
            {activeTab === 'notifications' && (() => {
              const unreadTotal = notifications.filter((n) => !n.read && !n.is_read).length;

              const filteredNotifications = notifications.filter((notif) => {
                // Category tab filter
                if (notifCategory !== 'all') {
                  if (notifCategory === 'orders' && notif.type !== 'order') return false;
                  if (notifCategory === 'coupons' && notif.type !== 'coupon') return false;
                  if (notifCategory === 'rewards' && notif.type !== 'reward') return false;
                  if (notifCategory === 'support' && notif.type !== 'support') return false;
                  if (notifCategory === 'system' && notif.type !== 'system' && notif.type !== 'general') return false;
                }

                // Read / Unread status filter
                const isUnread = notif.is_read === false || notif.read === false;
                if (notifReadFilter === 'unread' && !isUnread) return false;
                if (notifReadFilter === 'read' && isUnread) return false;

                return true;
              });

              const handleRefreshNotifs = async () => {
                setIsNotifLoading(true);
                try {
                  await refreshNotifications();
                  setNotifActionSuccess('Notifications refreshed');
                  setTimeout(() => setNotifActionSuccess(null), 2500);
                } catch (err) {
                  console.error('Failed to refresh notifications:', err);
                } finally {
                  setIsNotifLoading(false);
                }
              };

              const handleMarkAll = async () => {
                try {
                  await markAllNotificationsAsRead();
                  setNotifActionSuccess('All notifications marked as read');
                  setTimeout(() => setNotifActionSuccess(null), 2500);
                } catch (err) {
                  console.error('Failed to mark all as read:', err);
                }
              };

              const handleMarkSingleRead = async (id: string) => {
                try {
                  await markNotificationAsRead(id);
                  setNotifActionSuccess('Notification marked as read');
                  setTimeout(() => setNotifActionSuccess(null), 2500);
                } catch (err) {
                  console.error('Failed to mark notification read:', err);
                }
              };

              const handleViewRelatedEntity = (notif: SupportNotification) => {
                if (!notif.is_read && !notif.read) {
                  markNotificationAsRead(notif.id);
                }
                const targetType = notif.type;
                if (targetType === 'order') {
                  setActiveTab('orders');
                } else if (targetType === 'coupon') {
                  setActiveTab('coupons');
                } else if (targetType === 'reward') {
                  setActiveTab('rewards');
                } else if (targetType === 'support') {
                  setActiveTab('help');
                }
              };

              const getCustomerTypeBadge = (type: string) => {
                const labels: Record<string, { label: string; bg: string; color: string }> = {
                  order: { label: 'Order', bg: 'rgba(46, 204, 113, 0.15)', color: '#2ecc71' },
                  coupon: { label: 'Coupon', bg: 'rgba(155, 89, 182, 0.15)', color: '#9b59b6' },
                  reward: { label: 'Rewards', bg: 'rgba(201, 168, 76, 0.15)', color: '#c9a84c' },
                  support: { label: 'Support', bg: 'rgba(230, 126, 34, 0.15)', color: '#e67e22' },
                  system: { label: 'System', bg: 'rgba(52, 152, 219, 0.15)', color: '#3498db' },
                  general: { label: 'System', bg: 'rgba(52, 152, 219, 0.15)', color: '#3498db' },
                };

                const style = labels[type] || { label: type ? type.replace('_', ' ').toUpperCase() : 'General', bg: 'rgba(201, 168, 76, 0.12)', color: '#c9a84c' };
                return (
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: style.bg,
                      color: style.color,
                      border: `1px solid ${style.color}40`,
                    }}
                  >
                    {style.label}
                  </span>
                );
              };

              const categoryTabs: { id: 'all' | 'orders' | 'coupons' | 'rewards' | 'support' | 'system'; label: string }[] = [
                { id: 'all', label: 'All Notifications' },
                { id: 'orders', label: 'Orders' },
                { id: 'coupons', label: 'Coupons' },
                { id: 'rewards', label: 'Rewards' },
                { id: 'support', label: 'Support' },
                { id: 'system', label: 'System' },
              ];

              return (
                <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', paddingBottom: '48px', color: '#f5efe6' }}>
                  {/* Header Row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                    <div>
                      <span style={{ color: 'rgba(201, 168, 76, 0.85)', fontSize: '0.78rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                        — CUSTOMER CENTER
                      </span>
                      <h1 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '2.4rem', color: '#f5efe6', fontWeight: 700, margin: 0 }}>
                        Notifications
                      </h1>
                    </div>

                    {/* Global Action Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button
                        onClick={handleRefreshNotifs}
                        disabled={isNotifLoading}
                        style={{
                          padding: '10px 16px',
                          background: 'rgba(20, 16, 13, 0.85)',
                          border: '1px solid rgba(201, 168, 76, 0.3)',
                          borderRadius: '8px',
                          color: '#c9a84c',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <RefreshCw size={15} className={isNotifLoading ? 'animate-spin' : ''} /> Refresh
                      </button>

                      {unreadTotal > 0 && (
                        <button
                          onClick={handleMarkAll}
                          style={{
                            padding: '10px 18px',
                            background: 'linear-gradient(135deg, #c9a84c 0%, #e5c875 50%, #c9a84c 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#0f0c0a',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 14px rgba(201, 168, 76, 0.25)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <CheckCheck size={16} /> Mark all as read ({unreadTotal})
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Action Success Toast Banner */}
                  {notifActionSuccess && (
                    <div
                      style={{
                        marginBottom: '20px',
                        padding: '12px 18px',
                        background: 'rgba(46, 204, 113, 0.12)',
                        border: '1px solid rgba(46, 204, 113, 0.3)',
                        borderRadius: '8px',
                        color: '#2ecc71',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Check size={16} /> {notifActionSuccess}
                    </div>
                  )}

                  {/* Category Tabs & Filter Toolbar */}
                  <div
                    style={{
                      background: 'rgba(20, 16, 13, 0.85)',
                      border: '1px solid rgba(201, 168, 76, 0.2)',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      marginBottom: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '16px',
                    }}
                  >
                    {/* Categories */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {categoryTabs.map((tab) => {
                        const isActive = notifCategory === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setNotifCategory(tab.id)}
                            style={{
                              padding: '8px 16px',
                              borderRadius: '6px',
                              border: isActive ? '1px solid #c9a84c' : '1px solid transparent',
                              background: isActive ? 'rgba(201, 168, 76, 0.15)' : 'transparent',
                              color: isActive ? '#f5efe6' : 'rgba(255,255,255,0.6)',
                              fontWeight: isActive ? 700 : 500,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Read / Unread Status Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Filter size={14} /> Status:
                      </span>
                      <select
                        value={notifReadFilter}
                        onChange={(e) => setNotifReadFilter(e.target.value as any)}
                        style={{
                          padding: '6px 12px',
                          background: 'rgba(10, 8, 6, 0.8)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '6px',
                          color: '#f5efe6',
                          fontSize: '0.82rem',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="all">All Status</option>
                        <option value="unread">Unread Only</option>
                        <option value="read">Read Only</option>
                      </select>
                    </div>
                  </div>

                  {/* Main List / Table Container */}
                  <div
                    style={{
                      background: 'rgba(20, 16, 13, 0.85)',
                      border: '1px solid rgba(201, 168, 76, 0.2)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                    }}
                  >
                    {isNotifLoading ? (
                      <div style={{ padding: '60px', textAlign: 'center', color: '#c9a84c' }}>
                        <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>Loading notifications...</p>
                      </div>
                    ) : filteredNotifications.length === 0 ? (
                      <div style={{ padding: '60px 20px' }}>
                        <EmptyState
                          title="No Notifications Found"
                          description="You have no notifications matching the selected filter."
                          icon={<Bell size={48} color="#c9a84c" />}
                        />
                      </div>
                    ) : (
                      <div style={{ width: '100%', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                          <thead>
                            <tr style={{ background: 'rgba(10, 8, 6, 0.9)', borderBottom: '1px solid rgba(201, 168, 76, 0.2)', color: '#c9a84c' }}>
                              <th style={{ padding: '16px 20px', fontWeight: 700 }}>NOTIFICATION</th>
                              <th style={{ padding: '16px 20px', fontWeight: 700 }}>TYPE</th>
                              <th style={{ padding: '16px 20px', fontWeight: 700 }}>DATE &amp; TIME</th>
                              <th style={{ padding: '16px 20px', fontWeight: 700 }}>STATUS</th>
                              <th style={{ padding: '16px 20px', fontWeight: 700, textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredNotifications.map((notif) => {
                              const isUnread = notif.is_read === false || notif.read === false;
                              const notifTitle = notif.title || (notif.type ? notif.type.replace('_', ' ').toUpperCase() : 'Notification');
                              const notifMsg = notif.message || notif.text || '';

                              let dateDisplay = '';
                              if (notif.created_at) {
                                const dt = new Date(notif.created_at);
                                if (!isNaN(dt.getTime())) {
                                  dateDisplay = dt.toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  });
                                }
                              }
                              if (!dateDisplay && notif.date) {
                                dateDisplay = notif.date;
                              }

                              return (
                                <tr
                                  key={notif.id}
                                  style={{
                                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                                    background: isUnread ? 'rgba(201, 168, 76, 0.04)' : 'transparent',
                                    transition: 'background 0.2s ease',
                                  }}
                                >
                                  {/* Title & Message */}
                                  <td style={{ padding: '16px 20px', maxWidth: '400px' }}>
                                    <div style={{ fontWeight: isUnread ? 700 : 600, color: '#f5efe6', marginBottom: '4px' }}>
                                      {notifTitle}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>
                                      {notifMsg}
                                    </div>
                                  </td>

                                  {/* Type Badge */}
                                  <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                                    {getCustomerTypeBadge(notif.type)}
                                  </td>

                                  {/* Date & Time */}
                                  <td style={{ padding: '16px 20px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                                    {dateDisplay}
                                  </td>

                                  {/* Status */}
                                  <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                                    {!isUnread ? (
                                      <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <Check size={14} color="rgba(255,255,255,0.3)" /> Read
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: '0.78rem', color: '#c9a84c', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c9a84c' }} /> Unread
                                      </span>
                                    )}
                                  </td>

                                  {/* Actions */}
                                  <td style={{ padding: '16px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                      {isUnread && (
                                        <button
                                          onClick={() => handleMarkSingleRead(notif.id)}
                                          style={{
                                            padding: '6px 12px',
                                            background: 'rgba(201, 168, 76, 0.12)',
                                            border: '1px solid rgba(201, 168, 76, 0.3)',
                                            borderRadius: '6px',
                                            color: '#c9a84c',
                                            fontSize: '0.78rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                          }}
                                        >
                                          Mark as read
                                        </button>
                                      )}

                                      <button
                                        onClick={() => handleViewRelatedEntity(notif)}
                                        style={{
                                          padding: '6px 12px',
                                          background: 'rgba(255, 255, 255, 0.08)',
                                          border: '1px solid rgba(255, 255, 255, 0.15)',
                                          borderRadius: '6px',
                                          color: '#f5efe6',
                                          fontSize: '0.78rem',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          transition: 'all 0.2s ease',
                                        }}
                                      >
                                        View Related <ExternalLink size={12} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

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

                  {/* Personal Demographics removed — Date of Birth and Gender are now in My Profile */}

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
                          setShowUpdatePasswordForm(!showUpdatePasswordForm);
                          setUpdatePasswordStep(1);
                          setUpdatePasswordError('');
                          setUpdatePasswordMessage('');
                          setUpdatePasswordOTP('');
                          setUpdatePasswordNew('');
                          setUpdatePasswordConfirm('');
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
                        {showUpdatePasswordForm ? 'Cancel' : 'Change Password'}
                      </button>
                    </div>

                    {/* Change Password Form */}
                    {showUpdatePasswordForm && (
                      <div
                        style={{
                          marginTop: '24px',
                          paddingTop: '22px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '16px',
                        }}
                      >
                        {/* Step 1: Send OTP */}
                        {updatePasswordStep === 1 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <p style={{ margin: 0, fontSize: '0.88rem', color: '#f5efe6' }}>
                              To change your password, we need to verify your identity.
                            </p>
                            <div>
                              <button
                                type="button"
                                onClick={handleSendUpdatePasswordOTP}
                                disabled={isUpdatingPassword}
                                style={{
                                  padding: '10px 24px',
                                  borderRadius: '8px',
                                  background: 'linear-gradient(135deg, #c9a84c 0%, #e5c875 100%)',
                                  color: '#0f0c0a',
                                  border: 'none',
                                  fontSize: '0.9rem',
                                  fontWeight: 700,
                                  cursor: isUpdatingPassword ? 'not-allowed' : 'pointer',
                                  opacity: isUpdatingPassword ? 0.7 : 1,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                }}
                              >
                                {isUpdatingPassword ? (
                                  <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Sending OTP...</>
                                ) : (
                                  'Send OTP to Email'
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Step 2: Verify OTP */}
                        {updatePasswordStep === 2 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.88rem', color: '#f5efe6', fontWeight: 600, marginBottom: '8px' }}>
                                Enter 6-Digit OTP <span style={{ color: '#e74c3c' }}>*</span>
                              </label>
                              <div style={{ display: 'flex', gap: '12px' }}>
                                <input
                                  type="text"
                                  maxLength={6}
                                  placeholder="000000"
                                  value={updatePasswordOTP}
                                  onChange={(e) => setUpdatePasswordOTP(e.target.value.replace(/\D/g, ''))}
                                  style={{
                                    flex: 1,
                                    padding: '11px 14px',
                                    borderRadius: '8px',
                                    background: 'rgba(0, 0, 0, 0.35)',
                                    border: `1px solid ${updatePasswordOTP.length === 6 ? 'rgba(46, 204, 113, 0.5)' : 'rgba(201, 168, 76, 0.3)'}`,
                                    color: '#f5efe6',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    letterSpacing: '2px',
                                    transition: 'border-color 0.2s ease',
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={handleVerifyUpdatePasswordOTP}
                                  disabled={isUpdatingPassword || updatePasswordOTP.length !== 6}
                                  style={{
                                    padding: '0 24px',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #c9a84c 0%, #e5c875 100%)',
                                    color: '#0f0c0a',
                                    border: 'none',
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    cursor: isUpdatingPassword || updatePasswordOTP.length !== 6 ? 'not-allowed' : 'pointer',
                                    opacity: isUpdatingPassword || updatePasswordOTP.length !== 6 ? 0.7 : 1,
                                  }}
                                >
                                  {isUpdatingPassword ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : 'Verify'}
                                </button>
                              </div>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                              {updatePasswordTimer > 0 ? (
                                `Resend OTP in ${updatePasswordTimer}s`
                              ) : (
                                <button
                                  type="button"
                                  onClick={handleSendUpdatePasswordOTP}
                                  style={{ background: 'none', border: 'none', color: '#c9a84c', cursor: 'pointer', padding: 0, fontWeight: 600 }}
                                >
                                  Resend OTP
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Step 3: New Password */}
                        {updatePasswordStep === 3 && (
                          <form onSubmit={handleUpdatePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.88rem', color: '#f5efe6', fontWeight: 600, marginBottom: '8px' }}>
                                New Password <span style={{ color: '#e74c3c' }}>*</span>
                              </label>
                              <div style={{ position: 'relative' }}>
                                <input
                                  type={showNewPassword ? "text" : "password"}
                                  placeholder="Enter new password (min 8 characters)"
                                  value={updatePasswordNew}
                                  onChange={(e) => setUpdatePasswordNew(e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '11px 40px 11px 14px',
                                    borderRadius: '8px',
                                    background: 'rgba(0, 0, 0, 0.35)',
                                    border: `1px solid ${
                                      updatePasswordNew.length === 0
                                        ? 'rgba(201, 168, 76, 0.3)'
                                        : updatePasswordNew.length >= 8
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
                                <button
                                  type="button"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                  style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    cursor: 'pointer',
                                    padding: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                              </div>
                              {updatePasswordNew.length > 0 && updatePasswordNew.length < 8 && (
                                <p style={{ margin: '5px 0 0 2px', fontSize: '0.75rem', color: '#e74c3c', fontWeight: 600 }}>
                                  Password must be at least 8 characters ({updatePasswordNew.length}/8)
                                </p>
                              )}
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.88rem', color: '#f5efe6', fontWeight: 600, marginBottom: '8px' }}>
                                Confirm New Password <span style={{ color: '#e74c3c' }}>*</span>
                              </label>
                              <div style={{ position: 'relative' }}>
                                <input
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="Confirm new password"
                                  value={updatePasswordConfirm}
                                  onChange={(e) => setUpdatePasswordConfirm(e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '11px 40px 11px 14px',
                                    borderRadius: '8px',
                                    background: 'rgba(0, 0, 0, 0.35)',
                                    border: `1px solid ${
                                      updatePasswordConfirm.length === 0
                                        ? 'rgba(201, 168, 76, 0.3)'
                                        : updatePasswordNew === updatePasswordConfirm
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
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    cursor: 'pointer',
                                    padding: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                              </div>
                              {updatePasswordConfirm.length > 0 && (
                                <p style={{
                                  margin: '5px 0 0 2px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  color: updatePasswordNew === updatePasswordConfirm ? '#2ecc71' : '#e74c3c',
                                }}>
                                  {updatePasswordNew === updatePasswordConfirm
                                    ? '✓ Passwords match'
                                    : '✗ Passwords do not match'}
                                </p>
                              )}
                            </div>

                            <div>
                              <button
                                type="submit"
                                disabled={isUpdatingPassword}
                                style={{
                                  padding: '10px 24px',
                                  borderRadius: '8px',
                                  background: 'linear-gradient(135deg, #c9a84c 0%, #e5c875 100%)',
                                  color: '#0f0c0a',
                                  border: 'none',
                                  fontSize: '0.9rem',
                                  fontWeight: 700,
                                  cursor: isUpdatingPassword ? 'not-allowed' : 'pointer',
                                  opacity: isUpdatingPassword ? 0.7 : 1,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                }}
                              >
                                {isUpdatingPassword ? (
                                  <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Updating...</>
                                ) : (
                                  'Update Password'
                                )}
                              </button>
                            </div>
                          </form>
                        )}

                        {updatePasswordError && (
                          <div style={{ padding: '12px 14px', background: 'rgba(231, 76, 60, 0.12)', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                            {updatePasswordError}
                          </div>
                        )}

                        {updatePasswordMessage && (
                          <div style={{ padding: '12px 14px', background: 'rgba(46, 204, 113, 0.1)', border: '1px solid #2ecc71', color: '#2ecc71', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                            <CheckCircle size={15} /> {updatePasswordMessage}
                          </div>
                        )}
                      </div>
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

                 </form>
              </div>
            )}


            {/* HELP & COMPLAINTS PANEL */}
            {activeTab === 'help' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--cream)', margin: '0 0 6px 0' }}>
                      Help & Support Center
                    </h2>
                    <p style={{ color: 'var(--beige)', fontSize: '0.85rem', margin: 0 }}>
                      Our Atelier support desk will inspect and resolve your issue within 24-48 business hours.
                    </p>
                  </div>
                  {!showSupportForm && (
                    <Button
                      variant="gold"
                      glow
                      onClick={() => setShowSupportForm(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontWeight: 600 }}
                    >
                      <Plus size={18} />
                      Help & Support
                    </Button>
                  )}
                </div>

                {/* Raise Complaint Form */}
                {showSupportForm && (
                  <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--gold)', margin: 0 }}>
                        Submit a New Support Complaint
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowSupportForm(false)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--beige)',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0.7,
                        }}
                        title="Close form"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <p style={{ color: 'var(--beige)', fontSize: '0.85rem', marginBottom: '20px' }}>
                      Our Atelier support desk will inspect and resolve your issue within 24-48 business hours.
                    </p>

                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const cat = (form.elements.namedItem('category') as HTMLSelectElement).value as any;
                      const desc = (form.elements.namedItem('description') as HTMLTextAreaElement).value;
                      const orderIdVal = (form.elements.namedItem('order_id') as HTMLSelectElement)?.value || undefined;
                      if (!desc.trim()) return;
                      try {
                        await addSupportTicket(cat, desc, orderIdVal);
                        form.reset();
                        setShowSupportForm(false);
                        alert('Support complaint raised successfully. You can view its status and related order details in your history log.');
                      } catch (err: any) {
                        alert(err?.detail || err?.message || 'Failed to submit support complaint.');
                      }
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
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
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

                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--grey-light)', marginBottom: '6px', fontWeight: 600 }}>
                          Select Related Order (Optional)
                        </label>
                        <select
                          name="order_id"
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '4px',
                            color: 'var(--cream)',
                            fontSize: '0.9rem',
                            outline: 'none',
                          }}
                        >
                          <option value="">-- General / No Specific Order --</option>
                          {orders.map((ord: any) => (
                            <option key={ord.id} value={ord.id}>
                              Order #{ord.id} ({ord.date || (ord.created_at ? new Date(ord.created_at).toLocaleDateString() : '')}) — ₹{ord.total?.toLocaleString('en-IN') || 0}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--grey-light)', marginBottom: '6px', fontWeight: 600 }}>
                          Describe the Problem
                        </label>
                        <textarea
                          name="description"
                          required
                          placeholder="Please provide details about the issue..."
                          rows={4}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '4px',
                            color: 'var(--cream)',
                            fontSize: '0.9rem',
                            outline: 'none',
                            resize: 'none',
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <Button variant="gold" type="submit" glow>
                          Submit Support Ticket
                        </Button>
                        <Button
                          variant="secondary"
                          type="button"
                          onClick={() => setShowSupportForm(false)}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'var(--cream)',
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Complaint Logs History - directly displayed on the page */}
                <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--cream)', marginBottom: '15px' }}>
                    Your Support History
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {tickets.filter(t => t.customerId === user.id).length === 0 ? (
                      <p style={{ color: 'var(--grey-light)', fontStyle: 'italic', fontSize: '0.85rem', margin: 0 }}>
                        You have no support complaints raised.
                      </p>
                    ) : (
                      tickets.filter(t => t.customerId === user.id).map(ticket => {
                        const isResolved = ticket.status === 'Resolved';
                        const relatedOrderId = ticket.orderId || ticket.order_id;
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
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--grey-light)' }}>
                                Category: <strong style={{ color: 'var(--cream)' }}>{ticket.category}</strong> · Opened: {ticket.date}
                              </span>
                              {relatedOrderId ? (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const relOrd = await orderService.getOrder(relatedOrderId);
                                      setSelectedOrder(relOrd);
                                      setOrderSubView('details');
                                      setActiveTab('orders');
                                    } catch (err: any) {
                                      alert(err?.detail || err?.message || 'Failed to load related order.');
                                    }
                                  }}
                                  style={{
                                    padding: '3px 10px',
                                    fontSize: '0.75rem',
                                    background: 'rgba(201, 168, 76, 0.15)',
                                    color: 'var(--gold)',
                                    border: '1px solid rgba(201, 168, 76, 0.35)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  View Related Order (#{relatedOrderId})
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.72rem', color: 'var(--grey-light)', fontStyle: 'italic' }}>
                                  No related order
                                </span>
                              )}
                            </div>
                            
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
            )}
          </main>
        </div>

        {/* Unsaved Changes Confirmation Modal */}
        <ConfirmationModal
          isOpen={showUnsavedModal}
          title="Unsaved Changes"
          message="You have unsaved changes in your profile. Are you sure you want to discard them and leave?"
          confirmText="Discard & Leave"
          cancelText="Cancel"
          variant="warning"
          onConfirm={handleConfirmDiscard}
          onCancel={handleCancelDiscard}
        />

        {/* Logout Confirmation Modal */}
        <ConfirmationModal
          isOpen={showLogoutModal}
          title="Confirm Logout"
          message="Are you sure you want to log out of your account?"
          confirmText={isLoggingOut ? 'Logging out...' : 'Log Out'}
          cancelText="Cancel"
          isConfirming={isLoggingOut}
          variant="danger"
          onConfirm={handleConfirmLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
    </motion.div>
  );
};
export default CustomerDashboard;
