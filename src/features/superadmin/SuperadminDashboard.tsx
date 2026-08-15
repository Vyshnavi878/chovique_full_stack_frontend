import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  TrendingUp,
  Users,
  Palette,
  FileClock,
  Settings,
  Plus,
  Trash2,
  Lock,
  Globe,
  Store,
  DollarSign,
  UploadCloud,
  Image,
  Check,
  X,
  SlidersHorizontal,
  ChevronDown,
  ShoppingBag,
  Info,
  Layers,
  ArrowRight,
  UserCheck,
  UserX,
  Activity,
  AlertTriangle,
  Key,
  Home,
  Download,
  Calendar,
  Search,
  Filter,
  UserPlus,
  Edit3,
  Power,
  Eye,
  EyeOff,
  RotateCcw,
  Bell
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useApp } from '../../app/providers';
import { Sidebar } from '../../components/Sidebar';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ToastContainer, ToastMessage } from '../../components/ui/Toast';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { DashboardKpiSkeleton, DashboardCardSkeleton } from '../../components/ui/DashboardSkeleton';
import { NotificationHeaderDropdown } from '../../components/NotificationHeaderDropdown';
import { AdminUserDropdown } from '../../components/AdminUserDropdown';
import { AuditLogDetailModal } from '../../components/AuditLogDetailModal';
import { AdminProfileView } from '../admin/AdminProfileView';
import { ChangePasswordView } from '../admin/ChangePasswordView';

const formatActionLabel = (action?: string | null): string => {
  if (!action) return 'Activity Event';
  const act = action.trim().toUpperCase();
  const MAPPING: Record<string, string> = {
    'LOGGED_IN': 'Logged In',
    'LOGIN': 'Logged In',
    'LOGGED_OUT': 'Logged Out',
    'LOGOUT': 'Logged Out',
    'LOGIN_FAILED': 'Login Failed',
    'CREATE_PRODUCT': 'Product Created',
    'CREATED PRODUCT': 'Product Created',
    'UPDATE_PRODUCT': 'Product Updated',
    'UPDATED PRODUCT': 'Product Updated',
    'DELETE_PRODUCT': 'Product Deleted',
    'DELETED PRODUCT': 'Product Deleted',
    'CREATE_COUPON': 'Coupon Created',
    'CREATED COUPON': 'Coupon Created',
    'UPDATE_COUPON': 'Coupon Updated',
    'UPDATED COUPON': 'Coupon Updated',
    'DELETE_COUPON': 'Coupon Deleted',
    'DELETED COUPON': 'Coupon Deleted',
    'CREATE_ADMIN': 'Admin Created',
    'UPDATE_ADMIN': 'Admin Updated',
    'DISABLE_ADMIN': 'Admin Disabled',
    'UPDATE_ORDER': 'Order Updated',
    'UPDATED ORDER STATUS': 'Order Status Updated',
    'PLACE_ORDER': 'Order Placed',
    'UPDATE_CUSTOMER': 'Customer Updated',
    'UPDATE_SETTINGS': 'Settings Updated',
    'PLATFORM_SETTINGS_UPDATED': 'Platform Settings Updated',
    'MAINTENANCE_MODE_ENABLED': 'Maintenance Mode Enabled',
    'MAINTENANCE_MODE_DISABLED': 'Maintenance Mode Disabled',
    'UPDATE_ADMIN_PROFILE': 'Admin Profile Updated',
    'UPDATED_PROFILE': 'Admin Profile Updated',
    'CHANGE_ADMIN_PASSWORD': 'Admin Password Changed',
    'CHANGED_PASSWORD': 'Admin Password Changed',
    'OFFLINE SALE RECORDED': 'Offline Sale Recorded',
  };
  if (MAPPING[act]) return MAPPING[act];
  return act.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};
import {
  adminService,
  type DashboardStats,
  type AuditLogEntry,
  type SuperadminOverviewResponse,
  type SuperadminRevenueResponse,
  type ProductSalesPerformanceResponse,
  type OnlineLedgerResponse,
  type OfflineLedgerResponse,
  type AdminUserRecord,
  type AdminListResponse,
  type SuperadminAuditLogRecord,
  type SuperadminAuditLogListResponse,
  type SuperadminThemeRecord,
  type SuperadminThemeListResponse,
  type ThemeCreatePayload,
  type ThemeUpdatePayload
} from '../../services/adminService';
import { homeService } from '../../services/homeService';
import { getImageUrl } from '../../utils/imageUrl';
import type { SystemUser, Order, InstagramReel, Testimonial } from '../../types';
import { ReportsAnalyticsView } from '../admin/ReportsAnalyticsView';
import {
  trimValue,
  isValidEmail,
  isValidPhone,
  isNonEmpty,
  isValidNumber,
  isDuplicate
} from '../../utils/adminFormValidation';


// Theme Presets interface
interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    darkChocolate: string;
    gold: string;
    roseGold: string;
    black: string;
  };
}

const builtInPresets: ThemePreset[] = [
  {
    id: 'classic',
    name: 'Chovique Classic',
    description: 'The signature chocolate & gold luxury palette',
    colors: {
      primary: '#3B1E08',
      darkChocolate: '#1A0D00',
      gold: '#C9A84C',
      roseGold: '#B76E79',
      black: '#0A0A0A',
    },
  },
  {
    id: 'slate-noir',
    name: 'Slate Noir (Black to Gray)',
    description: 'Sophisticated gradient from dark slate to charcoal gray',
    colors: {
      primary: '#797B87',
      darkChocolate: '#1E1F24',
      gold: '#C9A84C',
      roseGold: '#B76E79',
      black: '#0C0D0F',
    },
  },
  {
    id: 'dark-elegance',
    name: 'Dark Elegance',
    description: 'Black-to-gray gradient with warm gold accents',
    colors: {
      primary: '#1a1a2e',
      darkChocolate: '#0f0f0f',
      gold: '#e2b04a',
      roseGold: '#c77dba',
      black: '#0a0a0a',
    },
  },
  {
    id: 'midnight-premium',
    name: 'Midnight Premium',
    description: 'Deep navy with silver tones — sophisticated & cool',
    colors: {
      primary: '#0d1b2a',
      darkChocolate: '#050a12',
      gold: '#a8a9ad',
      roseGold: '#7b8fa1',
      black: '#020408',
    },
  },
];



export const SuperadminDashboard: React.FC = () => {
  const { user, theme, updateThemeColors, offlineSales, orders, banners, updateBanner, products, setProducts, addBanner, deleteBannerState, refreshBanners, logout } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('enterprise');
  const [isMobileGrid, setIsMobileGrid] = useState(window.innerWidth <= 768);

  // --- Logout Modal State ---
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await adminService.adminLogout();
    } catch (err) {
      console.error('Failed to log out from server:', err);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirmModal(false);
      logout();
    }
  };

  const handleTabNavigation = (tab: string, entityId?: string) => {
    if (tab === 'logout') {
      setShowLogoutConfirmModal(true);
    } else {
      setActiveTab(tab);
      if (tab === 'notifications' && entityId) {
        (adminService as any).getSuperadminNotificationById(entityId)
          .then((notif: any) => {
            if (notif) setSelectedNotif(notif);
          })
          .catch((err: any) => console.error('Failed to fetch notification detail:', err));
      }
    }
  };

  // --- Enterprise Overview Default Fallback ---
  const defaultOverviewData: SuperadminOverviewResponse = {
    total_revenue: { current_value: 76986, previous_value: 68432, percentage_change: 12.5, comparison_label: 'vs last 7 days' },
    total_orders: { current_value: 124, previous_value: 114, percentage_change: 8.2, comparison_label: 'vs last 7 days' },
    total_customers: { current_value: 248, previous_value: 232, percentage_change: 6.7, comparison_label: 'vs last 7 days' },
    active_admins: { current_value: 3, previous_value: 3, percentage_change: 0.0, comparison_label: 'vs last 7 days' },
    revenue_trend: [
      { date: '1 Aug', revenue: 6000 },
      { date: '6 Aug', revenue: 12000 },
      { date: '11 Aug', revenue: 28000 },
      { date: '16 Aug', revenue: 22000 },
      { date: '21 Aug', revenue: 40000 },
      { date: '26 Aug', revenue: 32000 },
      { date: '31 Aug', revenue: 54000 },
    ],
    sales_source: {
      online_revenue: 54326,
      online_percentage: 70.6,
      offline_revenue: 22660,
      offline_percentage: 29.4,
    },
    top_selling_products: [],
    recent_activities: [
      { id: 'act-1', action: 'NEW_ORDER', description: 'New order #ORD1245', timestamp: '12 Aug 2026, 10:45 AM', user_name: 'Customer' },
      { id: 'act-2', action: 'PRODUCT_UPDATE', description: 'Admin Vaishnavi updated product', timestamp: '12 Aug 2026, 09:15 AM', user_name: 'Admin Vaishnavi' },
      { id: 'act-3', action: 'OFFLINE_SALE', description: 'Offline sale recorded', timestamp: '12 Aug 2026, 08:20 AM', user_name: 'System' },
    ],
  };

  // --- Enterprise Overview State ---
  const [overviewData, setOverviewData] = useState<SuperadminOverviewResponse | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [overviewTimeframe, setOverviewTimeframe] = useState<string>('7days');
  const [overviewStartDate, setOverviewStartDate] = useState<string>('');
  const [overviewEndDate, setOverviewEndDate] = useState<string>('');
  const [overviewDateError, setOverviewDateError] = useState<string | null>(null);

  const fetchOverview = async (
    tf = overviewTimeframe,
    startD = overviewStartDate,
    endD = overviewEndDate
  ) => {
    if (tf === 'custom') {
      if (!startD || !endD) return;
      if (startD > endD) {
        setOverviewDateError('Start date cannot be after end date.');
        return;
      }
    }
    setOverviewDateError(null);
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const data = await adminService.getSuperadminOverview(
        tf,
        tf === 'custom' ? startD : undefined,
        tf === 'custom' ? endD : undefined
      );
      if (data) {
        setOverviewData(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch Superadmin Overview:', err);
      setOverviewError(err?.detail || err?.message || 'Failed to load enterprise overview. Please check backend connection.');
    } finally {
      setOverviewLoading(false);
    }
  };

  const handleSelectOverviewTimeframe = (tfId: string) => {
    setOverviewTimeframe(tfId);
    if (tfId === 'custom') {
      let s = overviewStartDate;
      let e = overviewEndDate;
      if (!s || !e) {
        const today = new Date();
        const past = new Date();
        past.setFullYear(today.getFullYear() - 1);
        e = today.toISOString().split('T')[0];
        s = past.toISOString().split('T')[0];
        setOverviewStartDate(s);
        setOverviewEndDate(e);
      }
      if (s && e && s <= e) {
        setOverviewDateError(null);
        fetchOverview('custom', s, e);
      } else if (s && e && s > e) {
        setOverviewDateError('Start date cannot be after end date.');
      }
    } else {
      setOverviewDateError(null);
      fetchOverview(tfId);
    }
  };

  useEffect(() => {
    if (activeTab === 'enterprise') {
      if (overviewTimeframe === 'custom') {
        if (overviewStartDate && overviewEndDate) {
          if (overviewStartDate > overviewEndDate) {
            setOverviewDateError('Start date cannot be after end date.');
          } else {
            setOverviewDateError(null);
            fetchOverview('custom', overviewStartDate, overviewEndDate);
          }
        }
      } else {
        setOverviewDateError(null);
        fetchOverview(overviewTimeframe);
      }
    }
  }, [activeTab, overviewTimeframe]);

  const displayOverview = overviewData || defaultOverviewData;

  // --- Revenue Analytics Default Fallback ---
  const defaultRevenueData: SuperadminRevenueResponse = {
    preset: 'month',
    date_from: '2026-08-01',
    date_to: '2026-08-31',
    display_range: '01 Aug 2026 - 31 Aug 2026',
    total_income: { current_value: 76986, previous_value: 68432, percentage_change: 12.5, comparison_label: 'vs last month' },
    online_revenue: { current_value: 54326, previous_value: 47320, percentage_change: 14.8, comparison_label: 'vs last month' },
    offline_revenue: { current_value: 22660, previous_value: 22192, percentage_change: 2.1, comparison_label: 'vs last month' },
    avg_order_value: { current_value: 621, previous_value: 602, percentage_change: 3.1, comparison_label: 'vs last month' },
    revenue_trend: [
      { date: '1 Aug', online_revenue: 4200, offline_revenue: 1800, total_revenue: 6000 },
      { date: '6 Aug', online_revenue: 8500, offline_revenue: 3500, total_revenue: 12000 },
      { date: '11 Aug', online_revenue: 19500, offline_revenue: 8500, total_revenue: 28000 },
      { date: '16 Aug', online_revenue: 15000, offline_revenue: 7000, total_revenue: 22000 },
      { date: '21 Aug', online_revenue: 28000, offline_revenue: 12000, total_revenue: 40000 },
      { date: '26 Aug', online_revenue: 22000, offline_revenue: 10000, total_revenue: 32000 },
      { date: '31 Aug', online_revenue: 38000, offline_revenue: 16000, total_revenue: 54000 },
    ],
    revenue_by_source: {
      online_revenue: 54326,
      online_percentage: 70.6,
      offline_revenue: 22660,
      offline_percentage: 29.4,
    },
    revenue_by_payment_method: [
      { method: 'UPI', amount: 32450, percentage: 42.1 },
      { method: 'Credit / Debit Card', amount: 26180, percentage: 34.0 },
      { method: 'Cash on Delivery', amount: 18356, percentage: 23.9 },
    ],
    summary_rows: [
      { date: '2026-08-31', online_orders: 14, online_revenue: 8200, offline_sales: 6, offline_revenue: 3200, total_revenue: 11400, avg_order_value: 570 },
      { date: '2026-08-30', online_orders: 12, online_revenue: 7500, offline_sales: 5, offline_revenue: 2800, total_revenue: 10300, avg_order_value: 605 },
      { date: '2026-08-29', online_orders: 10, online_revenue: 6200, offline_sales: 4, offline_revenue: 2100, total_revenue: 8300, avg_order_value: 592 },
      { date: '2026-08-28', online_orders: 15, online_revenue: 9400, offline_sales: 7, offline_revenue: 3900, total_revenue: 13300, avg_order_value: 604 },
    ],
  };

  // --- Revenue Analytics State ---
  const [revenueData, setRevenueData] = useState<SuperadminRevenueResponse | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState<string | null>(null);
  const [revenuePreset, setRevenuePreset] = useState<string>('month');
  const [revenueDateFrom, setRevenueDateFrom] = useState<string>('');
  const [revenueDateTo, setRevenueDateTo] = useState<string>('');
  const [revenueExporting, setRevenueExporting] = useState(false);
  const [summaryPage, setSummaryPage] = useState(1);
  const summaryRowsPerPage = 5;

  const fetchRevenueAnalytics = async (
    preset = revenuePreset,
    dateFrom = revenueDateFrom,
    dateTo = revenueDateTo
  ) => {
    setRevenueLoading(true);
    setRevenueError(null);
    try {
      const data = await adminService.getRevenueAnalytics(
        preset,
        preset === 'custom' ? dateFrom : undefined,
        preset === 'custom' ? dateTo : undefined
      );
      if (data) {
        setRevenueData(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch Revenue Analytics:', err);
      setRevenueError(
        err?.detail || err?.message || 'Failed to load revenue analytics metrics.'
      );
    } finally {
      setRevenueLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'revenue') {
      fetchRevenueAnalytics(revenuePreset, revenueDateFrom, revenueDateTo);
    }
  }, [activeTab, revenuePreset, revenueDateFrom, revenueDateTo]);

  const handleExportRevenueCsv = async () => {
    setRevenueExporting(true);
    try {
      await adminService.exportRevenueAnalyticsCsv(
        revenuePreset,
        revenuePreset === 'custom' ? revenueDateFrom : undefined,
        revenuePreset === 'custom' ? revenueDateTo : undefined
      );
      addToast('success', 'Revenue report CSV exported successfully!', 'Report Exported');
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to export CSV report.', 'Export Error');
    } finally {
      setRevenueExporting(false);
    }
  };

  const displayRevenue = revenueData || defaultRevenueData;

  // --- Sales Analytics & Ledger Default Fallbacks ---
  const defaultSalesProducts: ProductSalesPerformanceResponse = {
    kpis: {
      total_units_sold: 248,
      total_units_prev: 225,
      units_pct_change: 10.2,
      total_revenue: 76986,
      total_revenue_prev: 68432,
      revenue_pct_change: 12.5,
      online_revenue: 54326,
      online_revenue_prev: 47320,
      online_pct_change: 14.8,
      offline_revenue: 22660,
      offline_revenue_prev: 22192,
      offline_pct_change: 2.1,
      top_selling_chocolate: 'Belgian Dark Truffle Bar',
      comparison_label: 'vs last month',
    },
    products: [
      { id: 'p1', name: 'Belgian Dark Truffle Bar', category_name: 'Dark Chocolate', image_url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=150&q=80', price: 175, online_units: 45, offline_units: 18, total_units: 63, total_revenue: 10125, stock_available: 37 },
      { id: 'p2', name: 'Salted Caramel Bonbons', category_name: 'Bonbons', image_url: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=150&q=80', price: 159, online_units: 38, offline_units: 12, total_units: 50, total_revenue: 7950, stock_available: 20 },
      { id: 'p3', name: 'Gold Leaf Pralines', category_name: 'Luxury Boxes', image_url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=150&q=80', price: 160, online_units: 28, offline_units: 10, total_units: 38, total_revenue: 6080, stock_available: 42 },
      { id: 'p4', name: 'Milk Chocolate Almonds', category_name: 'Milk Chocolate', image_url: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?auto=format&fit=crop&w=150&q=80', price: 150, online_units: 25, offline_units: 8, total_units: 33, total_revenue: 4950, stock_available: 26 },
      { id: 'p5', name: 'Ruby Cocoa Delight', category_name: 'Ruby Chocolate', image_url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=150&q=80', price: 160, online_units: 20, offline_units: 6, total_units: 26, total_revenue: 4160, stock_available: 35 },
    ],
    total: 24,
    page: 1,
    limit: 5,
  };

  const defaultOnlineLedger: OnlineLedgerResponse = {
    items: [
      { id: 'ord-1', order_id: 'ORD-1245', created_at: '12 Aug 2026, 10:45 AM', customer_name: 'Aarav Sharma', customer_email: 'aarav@example.com', product_summary: 'Belgian Dark Truffle Bar (x2)', quantity: 2, payment_method: 'UPI', amount: 350, order_status: 'Paid' },
      { id: 'ord-2', order_id: 'ORD-1244', created_at: '12 Aug 2026, 09:30 AM', customer_name: 'Priya Patel', customer_email: 'priya@example.com', product_summary: 'Salted Caramel Bonbons (x1)', quantity: 1, payment_method: 'Card', amount: 159, order_status: 'Shipped' },
      { id: 'ord-3', order_id: 'ORD-1243', created_at: '11 Aug 2026, 04:15 PM', customer_name: 'Rohan Mehta', customer_email: 'rohan@example.com', product_summary: 'Gold Leaf Pralines (x3)', quantity: 3, payment_method: 'UPI', amount: 480, order_status: 'Delivered' },
    ],
    total: 3,
    page: 1,
    limit: 10,
  };

  const defaultOfflineLedger: OfflineLedgerResponse = {
    items: [
      { id: 'pos-1', receipt_id: 'POS-8821', created_at: '12 Aug 2026, 11:20 AM', product_name: 'Belgian Dark Truffle Bar', quantity: 3, payment_method: 'Cash', amount: 525 },
      { id: 'pos-2', receipt_id: 'POS-8820', created_at: '12 Aug 2026, 10:15 AM', product_name: 'Ruby Cocoa Delight', quantity: 2, payment_method: 'UPI', amount: 320 },
      { id: 'pos-3', receipt_id: 'POS-8819', created_at: '11 Aug 2026, 06:40 PM', product_name: 'Milk Chocolate Almonds', quantity: 4, payment_method: 'Card', amount: 600 },
    ],
    total: 3,
    page: 1,
    limit: 10,
  };

  // --- Sales Analytics State ---
  const [salesSubTab, setSalesSubTab] = useState<'products' | 'online' | 'offline'>('products');
  
  // Data states
  const [salesProductsData, setSalesProductsData] = useState<ProductSalesPerformanceResponse | null>(null);
  const [onlineLedgerData, setOnlineLedgerData] = useState<OnlineLedgerResponse | null>(null);
  const [offlineLedgerData, setOfflineLedgerData] = useState<OfflineLedgerResponse | null>(null);
  
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesError, setSalesError] = useState<string | null>(null);
  const [salesExporting, setSalesExporting] = useState(false);

  // Search & Filter states
  const [salesSearch, setSalesSearch] = useState('');
  const [salesDateFrom, setSalesDateFrom] = useState('');
  const [salesDateTo, setSalesDateTo] = useState('');
  const [salesOnlineStatus, setSalesOnlineStatus] = useState('ALL');
  const [salesPaymentMethod, setSalesPaymentMethod] = useState('ALL');
  
  // Pagination states
  const [salesProductsPage, setSalesProductsPage] = useState(1);
  const [onlineLedgerPage, setOnlineLedgerPage] = useState(1);
  const [offlineLedgerPage, setOfflineLedgerPage] = useState(1);
  const salesPageLimit = 5;

  const fetchSalesData = async () => {
    setSalesLoading(true);
    setSalesError(null);
    try {
      if (salesSubTab === 'products') {
        const res = await adminService.getSalesAnalytics({
          search: salesSearch || undefined,
          date_from: salesDateFrom || undefined,
          date_to: salesDateTo || undefined,
          page: salesProductsPage,
          limit: salesPageLimit,
        });
        if (res) setSalesProductsData(res);
      } else if (salesSubTab === 'online') {
        const res = await adminService.getOnlineSalesLedger({
          search: salesSearch || undefined,
          status: salesOnlineStatus !== 'ALL' ? salesOnlineStatus : undefined,
          payment_method: salesPaymentMethod !== 'ALL' ? salesPaymentMethod : undefined,
          date_from: salesDateFrom || undefined,
          date_to: salesDateTo || undefined,
          page: onlineLedgerPage,
          limit: salesPageLimit,
        });
        if (res) setOnlineLedgerData(res);
      } else if (salesSubTab === 'offline') {
        const res = await adminService.getOfflineSalesLedger({
          search: salesSearch || undefined,
          payment_method: salesPaymentMethod !== 'ALL' ? salesPaymentMethod : undefined,
          date_from: salesDateFrom || undefined,
          date_to: salesDateTo || undefined,
          page: offlineLedgerPage,
          limit: salesPageLimit,
        });
        if (res) setOfflineLedgerData(res);
      }
    } catch (err: any) {
      console.error('Failed to fetch Sales Analytics / Ledger data:', err);
      setSalesError(err?.detail || err?.message || 'Failed to load sales data.');
    } finally {
      setSalesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sales-comparison') {
      fetchSalesData();
    }
  }, [
    activeTab,
    salesSubTab,
    salesSearch,
    salesDateFrom,
    salesDateTo,
    salesOnlineStatus,
    salesPaymentMethod,
    salesProductsPage,
    onlineLedgerPage,
    offlineLedgerPage,
  ]);

  const handleExportSalesCsv = async () => {
    setSalesExporting(true);
    try {
      await adminService.exportSalesAnalyticsCsv(
        salesSubTab,
        salesSearch || undefined,
        salesDateFrom || undefined,
        salesDateTo || undefined
      );
      addToast('success', `Exported ${salesSubTab} sales data as CSV successfully!`, 'CSV Exported');
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to export sales CSV.', 'Export Error');
    } finally {
      setSalesExporting(false);
    }
  };

  const displaySalesProducts = salesProductsData || defaultSalesProducts;
  const displayOnlineLedger = onlineLedgerData || defaultOnlineLedger;
  const displayOfflineLedger = offlineLedgerData || defaultOfflineLedger;

  // --- Admin Management Fallback ---
  const defaultAdminsList: AdminListResponse = {
    items: [],
    total: 0,
    page: 1,
    limit: 10,
  };

  // --- Admin Management State ---
  const [adminsData, setAdminsData] = useState<AdminListResponse | null>(null);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [adminsError, setAdminsError] = useState<string | null>(null);
  
  const [adminsSearch, setAdminsSearch] = useState('');
  const [adminsRoleFilter, setAdminsRoleFilter] = useState('ALL');
  const [adminsStatusFilter, setAdminsStatusFilter] = useState('ALL');
  const [adminsPage, setAdminsPage] = useState(1);
  const adminsLimit = 10;

  // Register Modal state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState('admin');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regStatus, setRegStatus] = useState('active');
  const [regFormError, setRegFormError] = useState<string | null>(null);
  const [regSubmitting, setRegSubmitting] = useState(false);

  // Edit Modal state
  const [editingAdmin, setEditingAdmin] = useState<AdminUserRecord | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('admin');
  const [editStatus, setEditStatus] = useState('active');
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchAdmins = async () => {
    setAdminsLoading(true);
    setAdminsError(null);
    try {
      const res = await adminService.getSuperadminAdmins({
        search: adminsSearch || undefined,
        role: adminsRoleFilter !== 'ALL' ? adminsRoleFilter : undefined,
        status: adminsStatusFilter !== 'ALL' ? adminsStatusFilter : undefined,
        page: adminsPage,
        limit: adminsLimit,
      });
      if (res) setAdminsData(res);
    } catch (err: any) {
      console.error('Failed to fetch admins list:', err);
      setAdminsError(err?.detail || err?.message || 'Failed to load administrators.');
    } finally {
      setAdminsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'admin-mgmt') {
      fetchAdmins();
    }
  }, [activeTab, adminsSearch, adminsRoleFilter, adminsStatusFilter, adminsPage]);

  // Handlers for Admin Management Actions
  const handleRegisterAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegFormError(null);

    // Form validations
    if (!isNonEmpty(regFullName)) {
      setRegFormError('Full Name is required.');
      return;
    }
    if (!isValidEmail(regEmail)) {
      setRegFormError('Please enter a valid email address.');
      return;
    }
    if (!regPhone || !isValidPhone(regPhone)) {
      setRegFormError('Please enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9.');
      return;
    }
    if (regPassword.length < 8) {
      setRegFormError('Password must be at least 8 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegFormError('Password confirmation does not match.');
      return;
    }

    setRegSubmitting(true);
    try {
      await adminService.createSuperadminAdmin({
        full_name: regFullName,
        email: regEmail,
        phone: regPhone,
        role: regRole,
        password: regPassword,
        confirm_password: regConfirmPassword,
        status: regStatus,
      });
      addToast('success', `Administrator '${regFullName}' registered successfully!`, 'Admin Registered');
      setIsRegisterOpen(false);
      // Reset form
      setRegFullName('');
      setRegEmail('');
      setRegPhone('');
      setRegRole('admin');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegStatus('active');
      fetchAdmins();
    } catch (err: any) {
      setRegFormError(err?.detail || err?.message || 'Failed to register administrator.');
    } finally {
      setRegSubmitting(false);
    }
  };

  const handleEditAdminOpen = (adm: AdminUserRecord) => {
    setEditingAdmin(adm);
    setEditFullName(adm.full_name);
    setEditEmail(adm.email);
    setEditPhone(adm.phone || '');
    setEditRole(adm.role);
    setEditStatus(adm.status);
    setEditFormError(null);
  };

  const handleEditAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;
    setEditFormError(null);

    if (!isNonEmpty(editFullName)) {
      setEditFormError('Full Name is required.');
      return;
    }
    if (!isValidEmail(editEmail)) {
      setEditFormError('Please enter a valid email address.');
      return;
    }
    if (editPhone && !isValidPhone(editPhone)) {
      setEditFormError('Please enter a valid 10-digit Indian phone number.');
      return;
    }

    setEditSubmitting(true);
    try {
      await adminService.updateSuperadminAdmin(editingAdmin.id, {
        full_name: editFullName,
        email: editEmail,
        phone: editPhone || undefined,
        role: editRole,
        status: editStatus,
      });
      addToast('success', `Administrator '${editFullName}' updated successfully!`, 'Admin Updated');
      setEditingAdmin(null);
      fetchAdmins();
    } catch (err: any) {
      setEditFormError(err?.detail || err?.message || 'Failed to update administrator.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleToggleAdminStatus = (adm: AdminUserRecord) => {
    const nextStatus = adm.is_active ? 'inactive' : 'active';
    const actionLabel = adm.is_active ? 'Deactivate' : 'Activate';

    setConfirmModal({
      isOpen: true,
      title: `${actionLabel} Administrator?`,
      message: `Are you sure you want to ${actionLabel.toLowerCase()} '${adm.full_name}' (${adm.email})?`,
      confirmText: actionLabel,
      onConfirm: async () => {
        try {
          await adminService.updateSuperadminAdminStatus(adm.id, nextStatus as 'active' | 'inactive');
          addToast('success', `Administrator '${adm.full_name}' ${actionLabel.toLowerCase()}d successfully.`, 'Status Updated');
          fetchAdmins();
        } catch (err: any) {
          addToast('error', err?.detail || err?.message || 'Failed to update admin status.', 'Error');
        }
      },
    });
  };



  const handleDeleteAdmin = (adm: AdminUserRecord) => {
    if (user?.email === adm.email || user?.id === adm.id) {
      addToast('error', 'Security Guardrail: Super Admin cannot delete their own active account.', 'Action Blocked');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: `Delete Administrator Account?`,
      message: `Are you sure you want to permanently delete '${adm.full_name}' (${adm.email})? This action cannot be undone.`,
      confirmText: 'Delete Account',
      onConfirm: async () => {
        try {
          await adminService.deleteSuperadminAdmin(adm.id);
          addToast('success', `Administrator '${adm.full_name}' deleted successfully.`, 'Admin Deleted');
          fetchAdmins();
        } catch (err: any) {
          addToast('error', err?.detail || err?.message || 'Failed to delete administrator.', 'Delete Failed');
        }
      },
    });
  };

  const displayAdmins = adminsData || defaultAdminsList;

  // --- Audit Logs Fallback ---
  const defaultAuditLogsList: SuperadminAuditLogListResponse = {
    items: [],
    total: 0,
    page: 1,
    limit: 10,
  };

  // --- Audit Logs State ---
  const [auditLogsData, setAuditLogsData] = useState<SuperadminAuditLogListResponse | null>(null);
  const [auditLogsLoading, setAuditLogsLoading] = useState(true);
  const [auditLogsError, setAuditLogsError] = useState<string | null>(null);

  const [auditDateFrom, setAuditDateFrom] = useState('');
  const [auditDateTo, setAuditDateTo] = useState('');
  const [auditUserId, setAuditUserId] = useState('ALL');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [auditModuleFilter, setAuditModuleFilter] = useState('ALL');
  const [auditStatusFilter, setAuditStatusFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const auditLimit = 10;

  const [selectedAuditLog, setSelectedAuditLog] = useState<SuperadminAuditLogRecord | null>(null);
  const [auditExporting, setAuditExporting] = useState(false);

  const fetchAuditLogs = async () => {
    setAuditLogsLoading(true);
    setAuditLogsError(null);
    try {
      const res = await adminService.getSuperadminAuditLogs({
        date_from: auditDateFrom || undefined,
        date_to: auditDateTo || undefined,
        user_id: auditUserId !== 'ALL' ? auditUserId : undefined,
        action: auditActionFilter !== 'ALL' ? auditActionFilter : undefined,
        module: auditModuleFilter !== 'ALL' ? auditModuleFilter : undefined,
        status: auditStatusFilter !== 'ALL' ? auditStatusFilter : undefined,
        search: auditSearch || undefined,
        page: auditPage,
        limit: auditLimit,
      });
      if (res) setAuditLogsData(res);
    } catch (err: any) {
      console.error('Failed to fetch audit logs:', err);
      setAuditLogsError(err?.detail || err?.message || 'Failed to load audit logs.');
    } finally {
      setAuditLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'audit-logs') {
      fetchAuditLogs();
    }
  }, [activeTab, auditDateFrom, auditDateTo, auditUserId, auditActionFilter, auditModuleFilter, auditStatusFilter, auditSearch, auditPage]);

  const handleClearAuditFilters = () => {
    setAuditDateFrom('');
    setAuditDateTo('');
    setAuditUserId('ALL');
    setAuditActionFilter('ALL');
    setAuditModuleFilter('ALL');
    setAuditStatusFilter('ALL');
    setAuditSearch('');
    setAuditPage(1);
  };

  const handleExportAuditLogsCsv = async () => {
    setAuditExporting(true);
    try {
      await adminService.exportSuperadminAuditLogsCsv({
        date_from: auditDateFrom || undefined,
        date_to: auditDateTo || undefined,
        user_id: auditUserId !== 'ALL' ? auditUserId : undefined,
        action: auditActionFilter !== 'ALL' ? auditActionFilter : undefined,
        module: auditModuleFilter !== 'ALL' ? auditModuleFilter : undefined,
        status: auditStatusFilter !== 'ALL' ? auditStatusFilter : undefined,
        search: auditSearch || undefined,
      });
      addToast('success', 'Exported audit logs as CSV successfully!', 'CSV Exported');
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to export audit logs CSV.', 'Export Error');
    } finally {
      setAuditExporting(false);
    }
  };

  const displayAuditLogs = auditLogsData || defaultAuditLogsList;

  // --- Theme Builder Default Preset Fallback ---
  const defaultPresetThemes: SuperadminThemeListResponse = {
    items: [
      {
        id: 'preset-chovique-classic',
        name: 'Chovique Classic',
        description: 'Signature chocolate & gold luxury palette',
        primary_brand_color: '#5A3825',
        background_color: '#0D090A',
        luxury_gold_color: '#D4AF37',
        secondary_accent_color: '#B76E79',
        text_color: '#F7F7F7',
        surface_color: '#1A1716',
        is_active: true,
        is_preset: true,
        created_at: '2026-08-12',
        updated_at: '2026-08-12',
      },
      {
        id: 'preset-slate-noir',
        name: 'Slate Noir',
        description: 'Sophisticated gradient from dark slate to charcoal gray',
        primary_brand_color: '#2C3E50',
        background_color: '#1A252F',
        luxury_gold_color: '#BDC3C7',
        secondary_accent_color: '#7F8C8D',
        text_color: '#ECF0F1',
        surface_color: '#2C3E50',
        is_active: false,
        is_preset: true,
        created_at: '2026-08-12',
        updated_at: '2026-08-12',
      },
      {
        id: 'preset-dark-elegance',
        name: 'Dark Elegance',
        description: 'Black-to-gray gradient with warm gold accents',
        primary_brand_color: '#111111',
        background_color: '#050505',
        luxury_gold_color: '#E6C687',
        secondary_accent_color: '#8A734C',
        text_color: '#F0E6D2',
        surface_color: '#1A1A1A',
        is_active: false,
        is_preset: true,
        created_at: '2026-08-12',
        updated_at: '2026-08-12',
      },
      {
        id: 'preset-midnight-premium',
        name: 'Midnight Premium',
        description: 'Deep navy with silver tones — sophisticated & cool',
        primary_brand_color: '#0F172A',
        background_color: '#020617',
        luxury_gold_color: '#94A3B8',
        secondary_accent_color: '#38BDF8',
        text_color: '#F8FAFC',
        surface_color: '#1E293B',
        is_active: false,
        is_preset: true,
        created_at: '2026-08-12',
        updated_at: '2026-08-12',
      },
    ],
    active_theme_id: 'preset-chovique-classic',
  };

  // --- Theme Builder State ---
  const [themesData, setThemesData] = useState<SuperadminThemeListResponse | null>(null);
  const [themesLoading, setThemesLoading] = useState(true);
  const [themesError, setThemesError] = useState<string | null>(null);

  const [selectedThemeId, setSelectedThemeId] = useState<string>('preset-chovique-classic');
  const [activeThemeId, setActiveThemeId] = useState<string>('preset-chovique-classic');

  const [customColors, setCustomColors] = useState({
    primary_brand_color: '#5A3825',
    background_color: '#0D090A',
    luxury_gold_color: '#D4AF37',
    secondary_accent_color: '#B76E79',
    text_color: '#F7F7F7',
    surface_color: '#1A1716',
  });

  const [isApplyingTheme, setIsApplyingTheme] = useState(false);
  const [isResettingTheme, setIsResettingTheme] = useState(false);
  const [isSavingCustomTheme, setIsSavingCustomTheme] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [customThemeForm, setCustomThemeForm] = useState({ name: '', description: '' });

  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  const isValidHex = (val: string) => hexRegex.test(val.trim());

  const isFormValid =
    isValidHex(customColors.primary_brand_color) &&
    isValidHex(customColors.background_color) &&
    isValidHex(customColors.luxury_gold_color) &&
    isValidHex(customColors.secondary_accent_color) &&
    isValidHex(customColors.text_color) &&
    isValidHex(customColors.surface_color);

  const fetchThemes = async () => {
    setThemesLoading(true);
    setThemesError(null);
    try {
      const res = await adminService.getSuperadminThemes();
      if (res && res.items.length > 0) {
        setThemesData(res);
        const act = res.items.find((t) => t.is_active) || res.items[0];
        setActiveThemeId(act.id);
        setSelectedThemeId(act.id);
        setCustomColors({
          primary_brand_color: act.primary_brand_color,
          background_color: act.background_color,
          luxury_gold_color: act.luxury_gold_color,
          secondary_accent_color: act.secondary_accent_color,
          text_color: act.text_color,
          surface_color: act.surface_color,
        });
      }
    } catch (err: any) {
      console.error('Failed to load themes:', err);
      setThemesError(err?.detail || err?.message || 'Failed to load theme configuration.');
    } finally {
      setThemesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'theme-builder') {
      fetchThemes();
    }
  }, [activeTab]);

  const displayThemes = themesData || defaultPresetThemes;

  const handleSelectPreset = (theme: SuperadminThemeRecord) => {
    setSelectedThemeId(theme.id);
    setCustomColors({
      primary_brand_color: theme.primary_brand_color,
      background_color: theme.background_color,
      luxury_gold_color: theme.luxury_gold_color,
      secondary_accent_color: theme.secondary_accent_color,
      text_color: theme.text_color,
      surface_color: theme.surface_color,
    });
  };

  const handleApplyTheme = async () => {
    if (!isFormValid) {
      addToast('error', 'Please correct invalid HEX colors before applying.', 'Validation Error');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Apply Theme Globally?',
      message: 'Are you sure you want to apply this theme palette across all pages live?',
      confirmText: 'Apply Theme',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setIsApplyingTheme(true);
        try {
          const targetPreset = displayThemes.items.find((t) => t.id === selectedThemeId);
          if (targetPreset) {
            await adminService.applySuperadminTheme(targetPreset.id);
            setActiveThemeId(targetPreset.id);
            addToast('success', `Theme '${targetPreset.name}' applied live globally!`, 'Theme Applied');
          } else {
            addToast('success', 'Custom theme palette applied live!', 'Theme Applied');
          }
          fetchThemes();
        } catch (err: any) {
          addToast('error', err?.detail || err?.message || 'Failed to apply theme live.', 'Apply Failed');
        } finally {
          setIsApplyingTheme(false);
        }
      },
    });
  };

  const handleResetDefaults = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Theme to Default?',
      message: 'Are you sure you want to restore the signature Chovique Classic theme palette?',
      confirmText: 'Reset Defaults',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setIsResettingTheme(true);
        try {
          const res = await adminService.resetSuperadminTheme();
          if (res) {
            setActiveThemeId(res.id);
            setSelectedThemeId(res.id);
            setCustomColors({
              primary_brand_color: res.primary_brand_color,
              background_color: res.background_color,
              luxury_gold_color: res.luxury_gold_color,
              secondary_accent_color: res.secondary_accent_color,
              text_color: res.text_color,
              surface_color: res.surface_color,
            });
            addToast('success', 'Restored signature Chovique Classic theme palette!', 'Theme Reset');
            fetchThemes();
          }
        } catch (err: any) {
          addToast('error', err?.detail || err?.message || 'Failed to reset theme.', 'Reset Failed');
        } finally {
          setIsResettingTheme(false);
        }
      },
    });
  };

  const handleSaveCustomThemeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customThemeForm.name.trim()) {
      addToast('error', 'Theme name is required.', 'Validation Error');
      return;
    }
    if (!isFormValid) {
      addToast('error', 'All color fields must contain valid HEX values.', 'Validation Error');
      return;
    }

    setIsSavingCustomTheme(true);
    try {
      const res = await adminService.createSuperadminTheme({
        name: customThemeForm.name.trim(),
        description: customThemeForm.description.trim() || undefined,
        primary_brand_color: customColors.primary_brand_color,
        background_color: customColors.background_color,
        luxury_gold_color: customColors.luxury_gold_color,
        secondary_accent_color: customColors.secondary_accent_color,
        text_color: customColors.text_color,
        surface_color: customColors.surface_color,
      });
      if (res) {
        addToast('success', `Custom theme '${res.name}' created successfully!`, 'Theme Saved');
        setShowSaveModal(false);
        setCustomThemeForm({ name: '', description: '' });
        fetchThemes();
      }
    } catch (err: any) {
      addToast('error', err?.detail || err?.message || 'Failed to save custom theme.', 'Save Error');
    } finally {
      setIsSavingCustomTheme(false);
    }
  };

  // --- Toast Notifications State ---
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (type: 'success' | 'error' | 'info', message: string, title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, title }]);
  };
  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // --- Confirmation Modal State ---
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
    isConfirming?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Delete',
    onConfirm: () => {},
    isConfirming: false,
  });

  const openConfirmation = (title: string, message: string, onConfirm: () => void | Promise<void>, confirmText = 'Delete') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isConfirming: true }));
        try {
          await onConfirm();
        } finally {
          setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {}, isConfirming: false });
        }
      },
      isConfirming: false,
    });
  };

  const [adminFormErrors, setAdminFormErrors] = useState<Record<string, string>>({});
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'total' | 'online' | 'offline'>('total');

  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    adminService.getStats()
      .then(stats => setDashboardStats(stats))
      .catch(err => console.error('Failed to load dashboard stats:', err));
  }, []);

  // --- Theme Builder Colors State ---
  const [themeInput, setThemeInput] = useState({
    primary: theme?.primary || '#1C0D02',
    darkChocolate: theme?.darkChocolate || '#0F0701',
    gold: theme?.gold || '#C9A84C',
    roseGold: theme?.roseGold || '#E0A96D',
    black: theme?.black || '#0A0A0A',
  });

  // --- Theme Presets State ---
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [customThemes, setCustomThemes] = useState<ThemePreset[]>([]);

  useEffect(() => {
    adminService.getThemes()
      .then(themes => {
        if (Array.isArray(themes)) {
          const mapped = themes.map((t: any) => ({
            id: t.id,
            name: t.name,
            description: 'Custom theme',
            colors: JSON.parse(t.properties_json)
          }));
          setCustomThemes(mapped);
          
          const activeTheme = themes.find((t: any) => t.is_active);
          if (activeTheme) {
            setActivePresetId(activeTheme.id);
            const activeColors = JSON.parse(activeTheme.properties_json);
            setThemeInput(activeColors);
            updateThemeColors(activeColors);
          }
        }
      })
      .catch(err => console.error('Failed to fetch themes', err));
  }, []);
  const [showAddThemeForm, setShowAddThemeForm] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemeDesc, setNewThemeDesc] = useState('');
  const [newThemeColors, setNewThemeColors] = useState({
    primary: '#2d2d3f',
    darkChocolate: '#111118',
    gold: '#d4af37',
    roseGold: '#b76e79',
    black: '#0f0f15',
  });

  // --- Banner/Carousel State ---
  const [selectedSlideIdx, setSelectedSlideIdx] = useState(0);
  const selectedBanner = banners && banners.length > 0 ? (banners[selectedSlideIdx] || banners[0]) : null;
  const bannerFileRef = useRef<HTMLInputElement>(null);

  const [showAddBannerModal, setShowAddBannerModal] = useState(false);
  const [newBannerData, setNewBannerData] = useState({
    title: '',
    subtitle: '',
    tag: '',
    buttonText: 'Explore Collection',
    link: '/products',
    image_url: '',
  });
  const [newBannerImageFile, setNewBannerImageFile] = useState<File | null>(null);
  const [isCreatingBanner, setIsCreatingBanner] = useState(false);
  const [bannerCreateError, setBannerCreateError] = useState('');
  const newBannerFileInputRef = useRef<HTMLInputElement>(null);

  // --- Admin Accounts Management State ---
  const [showAddAdminForm, setShowAddAdminForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [adminCreateError, setAdminCreateError] = useState('');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  // --- Password Reset Modal State ---
  const [resetAdminUser, setResetAdminUser] = useState<SystemUser | null>(null);
  const [resetAdminPassword, setResetAdminPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState('');

  // --- Edit Admin Modal State ---
  const [editAdminUser, setEditAdminUser] = useState<SystemUser | null>(null);
  const [editAdminForm, setEditAdminForm] = useState({ name: '', email: '' });
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);
  const [editAdminError, setEditAdminError] = useState('');

  // --- Roles & Permissions User List State ---
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);

  useEffect(() => {
    adminService.getUsers()
      .then((users) => {
        if (Array.isArray(users)) setSystemUsers(users);
      })
      .catch((err) => console.error('Failed to fetch system users:', err));
  }, []);


  // --- CMS Site Stats State & Handlers ---
  const [siteStats, setSiteStats] = useState({
    happy_customers: 50000,
    unique_flavors: 120,
    countries_shipped: 15,
    five_star_reviews_percent: 98,
  });
  const [isSavingStats, setIsSavingStats] = useState(false);
  const [statsSavedSuccess, setStatsSavedSuccess] = useState(false);

  useEffect(() => {
    homeService.getStats()
      .then((data) => {
        if (data) {
          setSiteStats({
            happy_customers: data.happy_customers || 50000,
            unique_flavors: data.unique_flavors || 120,
            countries_shipped: data.countries_shipped || 15,
            five_star_reviews_percent: data.five_star_reviews_percent || 98,
          });
        }
      })
      .catch((err) => console.error('Failed to load site stats:', err));
  }, []);

  const handleSaveSiteStatsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingStats(true);
    try {
      await adminService.updateSiteStats(siteStats);
      setStatsSavedSuccess(true);
      setTimeout(() => setStatsSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err?.detail || err?.message || 'Failed to save site stats.');
    } finally {
      setIsSavingStats(false);
    }
  };

  // --- CMS Instagram Reels State & Handlers ---
  const [cmsReels, setCmsReels] = useState<InstagramReel[]>([]);
  const [showAddReelModal, setShowAddReelModal] = useState(false);
  const [newReelData, setNewReelData] = useState({ title: '', likes: '14.2K', comments: '348', views: '124K views', video_url: '' });
  const [newReelVideoFile, setNewReelVideoFile] = useState<File | null>(null);
  const [isCreatingReel, setIsCreatingReel] = useState(false);

  const fetchCmsReels = () => {
    homeService.getReels()
      .then((data) => {
        if (Array.isArray(data)) setCmsReels(data);
      })
      .catch((err) => console.error('Failed to load reels:', err));
  };

  useEffect(() => {
    fetchCmsReels();
  }, []);

  const handleCreateReelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReelData.title) return;
    setIsCreatingReel(true);
    const formData = new FormData();
    formData.append('title', newReelData.title);
    formData.append('likes', newReelData.likes);
    formData.append('comments', newReelData.comments);
    formData.append('views', newReelData.views);
    if (newReelData.video_url) formData.append('video_url', newReelData.video_url);
    if (newReelVideoFile) formData.append('video', newReelVideoFile);

    try {
      await adminService.createReel(formData);
      fetchCmsReels();
      setNewReelData({ title: '', likes: '14.2K', comments: '348', views: '124K views', video_url: '' });
      setNewReelVideoFile(null);
      setShowAddReelModal(false);
    } catch (err: any) {
      alert(err?.detail || err?.message || 'Failed to create reel entry.');
    } finally {
      setIsCreatingReel(false);
    }
  };

  const handleDeleteReelSubmit = async (reelId: string, reelTitle: string) => {
    if (!window.confirm(`Delete Instagram reel "${reelTitle}"?`)) return;
    try {
      await adminService.deleteReel(reelId);
      fetchCmsReels();
    } catch (err: any) {
      alert(err?.detail || err?.message || 'Failed to delete reel.');
    }
  };

  // --- CMS Testimonials State & Handlers ---
  const [cmsTestimonials, setCmsTestimonials] = useState<Testimonial[]>([]);
  const [showAddTestimonialModal, setShowAddTestimonialModal] = useState(false);
  const [newTestimonialData, setNewTestimonialData] = useState({ author: '', title: '', text: '', rating: 5, initials: '', avatar_url: '' });
  const [newTestimonialAvatarFile, setNewTestimonialAvatarFile] = useState<File | null>(null);
  const [isCreatingTestimonial, setIsCreatingTestimonial] = useState(false);

  const fetchCmsTestimonials = () => {
    homeService.getTestimonials()
      .then((data) => {
        if (Array.isArray(data)) setCmsTestimonials(data);
      })
      .catch((err) => console.error('Failed to load testimonials:', err));
  };

  useEffect(() => {
    fetchCmsTestimonials();
  }, []);

  const handleCreateTestimonialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestimonialData.author || !newTestimonialData.text) return;
    setIsCreatingTestimonial(true);
    const formData = new FormData();
    formData.append('author', newTestimonialData.author);
    formData.append('title', newTestimonialData.title || 'Chocolate Connoisseur');
    formData.append('text', newTestimonialData.text);
    formData.append('rating', String(newTestimonialData.rating));
    formData.append('initials', newTestimonialData.initials || newTestimonialData.author.substring(0, 2).toUpperCase());
    if (newTestimonialData.avatar_url) formData.append('avatar_url', newTestimonialData.avatar_url);
    if (newTestimonialAvatarFile) formData.append('avatar', newTestimonialAvatarFile);

    try {
      await adminService.createTestimonial(formData);
      fetchCmsTestimonials();
      setNewTestimonialData({ author: '', title: '', text: '', rating: 5, initials: '', avatar_url: '' });
      setNewTestimonialAvatarFile(null);
      setShowAddTestimonialModal(false);
    } catch (err: any) {
      alert(err?.detail || err?.message || 'Failed to create testimonial.');
    } finally {
      setIsCreatingTestimonial(false);
    }
  };

  const handleDeleteTestimonialSubmit = async (tId: string, authorName: string) => {
    if (!window.confirm(`Delete testimonial by "${authorName}"?`)) return;
    try {
      await adminService.deleteTestimonial(tId);
      fetchCmsTestimonials();
    } catch (err: any) {
      alert(err?.detail || err?.message || 'Failed to delete testimonial.');
    }
  };


  // --- Orders State with live modifications ---
  const [superOrders, setSuperOrders] = useState<Order[]>(orders);

  useEffect(() => {
    adminService.getAllOrders()
      .then((fetchedOrders) => {
        if (Array.isArray(fetchedOrders)) setSuperOrders(fetchedOrders);
      })
      .catch((err) => console.error('Failed to fetch superadmin orders:', err));
  }, []);


  // ─── Platform Settings State & Handlers ────────────────────────────────────
  type PsSettingsTab = 'payment' | 'customer-order' | 'system';

  const [psActiveTab, setPsActiveTab] = useState<PsSettingsTab>('payment');
  const [psLoading, setPsLoading] = useState(false);
  const [psSaving, setPsSaving] = useState(false);
  const [psHasChanges, setPsHasChanges] = useState(false);
  const [psShowMaintenanceConfirm, setPsShowMaintenanceConfirm] = useState(false);
  const [psPendingMaintenanceMode, setPsPendingMaintenanceMode] = useState<boolean | null>(null);

  const defaultPs = {
    store_front_name: 'Chovique Luxury Chocolates',
    support_email: 'support@chovique.com',
    support_phone: '+91 98765 43210',
    store_address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    base_currency: 'INR',
    timezone: 'Asia/Kolkata',
    business_status: 'active',
    cod_enabled: true,
    gst_rate: 18,
    platform_fee: 0,
    standard_shipping_charge: 50,
    free_shipping_min_order: 500,
    maximum_cod_order_value: 5000,
    customer_registration_enabled: true,
    guest_checkout_enabled: true,
    minimum_order_value: 100,
    order_cancellation_enabled: true,
    cancellation_time_limit: 24,
    return_refund_enabled: true,
    maintenance_mode: false,
    admin_session_timeout: 60,
    max_login_attempts: 5,
    account_lockout_duration: 30,
  };

  const [psForm, setPsForm] = useState({ ...defaultPs });
  const [psErrors, setPsErrors] = useState<Record<string, string>>({});

  // Load settings from backend on mount / when platform-settings tab is active
  useEffect(() => {
    if (activeTab !== 'platform-settings') return;
    setPsLoading(true);
    (adminService as any).getPlatformSettings()
      .then((data: any) => {
        if (data) {
          setPsForm((prev) => ({
            ...prev,
            store_front_name: data.store_front_name ?? prev.store_front_name,
            support_email: data.support_email ?? prev.support_email,
            support_phone: data.support_phone ?? prev.support_phone,
            store_address: data.store_address ?? prev.store_address,
            city: data.city ?? prev.city,
            state: data.state ?? prev.state,
            country: data.country ?? prev.country,
            pincode: data.pincode ?? prev.pincode,
            base_currency: data.base_currency ?? prev.base_currency,
            timezone: data.timezone ?? prev.timezone,
            business_status: data.business_status ?? prev.business_status,
            cod_enabled: data.cod_enabled ?? prev.cod_enabled,
            gst_rate: data.gst_rate ?? prev.gst_rate,
            platform_fee: data.platform_fee ?? prev.platform_fee,
            standard_shipping_charge: data.standard_shipping_charge ?? prev.standard_shipping_charge,
            free_shipping_min_order: data.free_shipping_min_order ?? prev.free_shipping_min_order,
            maximum_cod_order_value: data.maximum_cod_order_value ?? prev.maximum_cod_order_value,
            customer_registration_enabled: data.customer_registration_enabled ?? prev.customer_registration_enabled,
            guest_checkout_enabled: data.guest_checkout_enabled ?? prev.guest_checkout_enabled,
            minimum_order_value: data.minimum_order_value ?? prev.minimum_order_value,
            order_cancellation_enabled: data.order_cancellation_enabled ?? prev.order_cancellation_enabled,
            cancellation_time_limit: data.cancellation_time_limit ?? prev.cancellation_time_limit,
            return_refund_enabled: data.return_refund_enabled ?? prev.return_refund_enabled,
            maintenance_mode: data.maintenance_mode ?? prev.maintenance_mode,
            admin_session_timeout: data.admin_session_timeout ?? prev.admin_session_timeout,
            max_login_attempts: data.max_login_attempts ?? prev.max_login_attempts,
            account_lockout_duration: data.account_lockout_duration ?? prev.account_lockout_duration,
          }));
        }
        setPsHasChanges(false);
      })
      .catch((err: any) => {
        addToast('error', 'Failed to load platform settings from server.', 'Load Error');
        console.error('Platform settings load error', err);
      })
      .finally(() => setPsLoading(false));
  }, [activeTab]);

  const updatePsField = (field: string, value: any) => {
    setPsForm((prev) => ({ ...prev, [field]: value }));
    setPsErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    setPsHasChanges(true);
  };

  const validatePs = (): boolean => {
    const errs: Record<string, string> = {};
    if (psForm.gst_rate < 0 || psForm.gst_rate > 100) errs.gst_rate = 'GST must be between 0 and 100.';
    if (psForm.platform_fee < 0) errs.platform_fee = 'Platform fee cannot be negative.';
    if (psForm.standard_shipping_charge < 0) errs.standard_shipping_charge = 'Shipping charge cannot be negative.';
    if (psForm.free_shipping_min_order < 0) errs.free_shipping_min_order = 'Free shipping threshold cannot be negative.';
    if (psForm.maximum_cod_order_value < 0) errs.maximum_cod_order_value = 'Max COD value cannot be negative.';
    if (psForm.minimum_order_value < 0) errs.minimum_order_value = 'Minimum order value cannot be negative.';
    if (psForm.order_cancellation_enabled && psForm.cancellation_time_limit < 1)
      errs.cancellation_time_limit = 'Cancellation time limit must be at least 1 hour.';
    if (psForm.admin_session_timeout < 5) errs.admin_session_timeout = 'Session timeout must be at least 5 minutes.';
    if (psForm.max_login_attempts < 1) errs.max_login_attempts = 'Must allow at least 1 login attempt.';
    if (psForm.account_lockout_duration < 1) errs.account_lockout_duration = 'Lockout duration must be at least 1 minute.';
    setPsErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSavePlatformSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validatePs()) {
      addToast('error', 'Please fix validation errors before saving.', 'Validation Failed');
      return;
    }
    setPsSaving(true);
    try {
      await (adminService as any).updatePlatformSettings(psForm);
      addToast('success', 'Platform settings saved successfully.', 'Settings Saved');
      setPsHasChanges(false);
    } catch (err: any) {
      addToast('error', err?.detail || err?.message || 'Failed to save platform settings.', 'Save Error');
    } finally {
      setPsSaving(false);
    }
  };

  const handlePsDiscard = () => {
    setPsForm({ ...defaultPs });
    setPsErrors({});
    setPsHasChanges(false);
    // Reload from backend
    (adminService as any).getPlatformSettings()
      .then((data: any) => { if (data) setPsForm((prev) => ({ ...prev, ...data })); })
      .catch(() => {});
  };

  const handleMaintenanceModeToggle = (val: boolean) => {
    if (val) {
      setPsPendingMaintenanceMode(true);
      setPsShowMaintenanceConfirm(true);
    } else {
      updatePsField('maintenance_mode', false);
    }
  };

  const confirmMaintenanceMode = async () => {
    setPsShowMaintenanceConfirm(false);
    try {
      await (adminService as any).toggleMaintenanceMode(true);
      updatePsField('maintenance_mode', true);
      addToast('info', 'Maintenance mode is now ENABLED. The storefront is offline for customers.', 'Maintenance Mode ON');
    } catch (err: any) {
      addToast('error', err?.detail || 'Failed to enable maintenance mode.', 'Error');
    }
  };

  const [backendAuditLogs, setBackendAuditLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    adminService.getAuditLogs()
      .then((logs) => setBackendAuditLogs(logs))
      .catch((err) => console.error('Failed to fetch audit logs:', err));
  }, []);

  // ─── Superadmin Notifications State & Handlers ─────────────────────────────
  const [notifItems, setNotifItems] = useState<any[]>([]);
  const [notifTotal, setNotifTotal] = useState<number>(0);
  const [notifPage, setNotifPage] = useState<number>(1);
  const [notifLimit] = useState<number>(10);
  const [notifTotalPages, setNotifTotalPages] = useState<number>(1);
  const [notifUnreadCount, setNotifUnreadCount] = useState<number>(0);
  const [notifLoading, setNotifLoading] = useState<boolean>(false);

  const [notifCategoryTab, setNotifCategoryTab] = useState<string>('ALL'); // ALL | SECURITY | ADMIN_MANAGEMENT | PLATFORM_SYSTEM | BUSINESS
  const [notifReadFilter, setNotifReadFilter] = useState<string>('ALL'); // ALL | UNREAD | READ
  const [notifDateFrom, setNotifDateFrom] = useState<string>('');
  const [notifDateTo, setNotifDateTo] = useState<string>('');
  const [notifSearch, setNotifSearch] = useState<string>('');

  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);
  const [notifToDelete, setNotifToDelete] = useState<any | null>(null);
  const [isDeletingNotif, setIsDeletingNotif] = useState<boolean>(false);

  const fetchSuperadminNotifications = async () => {
    setNotifLoading(true);
    try {
      const isReadVal = notifReadFilter === 'UNREAD' ? false : notifReadFilter === 'READ' ? true : undefined;
      const categoryVal = notifCategoryTab !== 'ALL' ? notifCategoryTab : undefined;

      const res = await (adminService as any).getSuperadminNotifications({
        page: notifPage,
        limit: notifLimit,
        category: categoryVal,
        is_read: isReadVal,
        date_from: notifDateFrom || undefined,
        date_to: notifDateTo || undefined,
        search: notifSearch || undefined,
      });

      setNotifItems(res.items || []);
      setNotifTotal(res.total || 0);
      setNotifTotalPages(res.total_pages || 1);
      setNotifUnreadCount(res.unread_count || 0);
    } catch (err: any) {
      console.error('Failed to fetch superadmin notifications:', err);
      addToast('error', err?.detail || 'Failed to load notifications.', 'Error');
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchSuperadminNotifications();
    }
    const handleUpdate = () => {
      if (activeTab === 'notifications') {
        fetchSuperadminNotifications();
      }
    };
    window.addEventListener('notification_updated', handleUpdate);
    return () => {
      window.removeEventListener('notification_updated', handleUpdate);
    };
  }, [activeTab, notifPage, notifCategoryTab, notifReadFilter, notifDateFrom, notifDateTo, notifSearch]);

  const handleMarkNotifAsRead = async (notif: any) => {
    if (notif.is_read) return;
    try {
      await (adminService as any).markSuperadminNotificationAsRead(notif.id);
      setNotifItems((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
      setNotifUnreadCount((prev) => Math.max(0, prev - 1));
      if (selectedNotif && selectedNotif.id === notif.id) {
        setSelectedNotif((prev: any) => prev ? { ...prev, is_read: true } : null);
      }
      window.dispatchEvent(new CustomEvent('notification_updated'));
      addToast('success', 'Notification marked as read.', 'Success');
    } catch (err: any) {
      addToast('error', err?.detail || 'Failed to mark notification as read.', 'Error');
    }
  };

  const handleMarkAllNotifsAsRead = async () => {
    try {
      await (adminService as any).markAllSuperadminNotificationsAsRead();
      setNotifItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setNotifUnreadCount(0);
      window.dispatchEvent(new CustomEvent('notification_updated'));
      addToast('success', 'All notifications marked as read.', 'Success');
    } catch (err: any) {
      addToast('error', err?.detail || 'Failed to mark all as read.', 'Error');
    }
  };

  const handleDeleteNotifConfirm = async () => {
    if (!notifToDelete) return;
    setIsDeletingNotif(true);
    try {
      await (adminService as any).deleteSuperadminNotification(notifToDelete.id);
      window.dispatchEvent(new CustomEvent('notification_updated'));
      addToast('success', 'Notification deleted successfully.', 'Deleted');
      setNotifToDelete(null);
      if (selectedNotif && selectedNotif.id === notifToDelete.id) {
        setSelectedNotif(null);
      }
      fetchSuperadminNotifications();
    } catch (err: any) {
      addToast('error', err?.detail || 'Failed to delete notification.', 'Error');
    } finally {
      setIsDeletingNotif(false);
    }
  };


  // --- Stock adjustment fields ---
  const [adjustingStockId, setAdjustingStockId] = useState<string | null>(null);
  const [adjustStockVal, setAdjustStockVal] = useState<number>(0);

  // --- Customer detail modal inspection ---
  const [inspectedCustomer, setInspectedCustomer] = useState<SystemUser | null>(null);

  const addLogEntry = (action: string, type: 'order' | 'product' | 'security' | 'setting' = 'setting') => {
    // Audit logs are now fetched from the backend.
    // If we want to instantly reflect a change locally, we can optionally pre-pend it,
    // but the best approach is to re-fetch the logs from the backend.
    adminService.getAuditLogs()
      .then((logs) => setBackendAuditLogs(logs))
      .catch((err) => console.error('Failed to fetch audit logs after action:', err));
  };

  // Preset operations
  const allPresets = [...builtInPresets, ...customThemes];

  const handleApplyPreset = async (preset: ThemePreset) => {
    setActivePresetId(preset.id);
    setThemeInput(preset.colors);
    try {
      await updateThemeColors(preset.colors);
      addLogEntry(`Applied Theme Preset: "${preset.name}"`, 'setting');
      
      const isBuiltIn = builtInPresets.find(p => p.id === preset.id);
      if (!isBuiltIn) {
        await adminService.setActiveTheme(preset.id);
      }
    } catch (err: any) {
      console.error('Failed to set active theme on backend', err);
      alert('Failed to save theme setting to database: ' + (err?.message || 'Network error'));
    }
  };

  const handleLegacyApplyCustomThemeColors = async () => {
    setActivePresetId(null);
    const customColors = {
      primary: themeInput.primary,
      darkChocolate: themeInput.darkChocolate,
      gold: themeInput.gold,
      roseGold: themeInput.roseGold,
      black: themeInput.black,
    };
    try {
      await updateThemeColors(customColors);
      addLogEntry('Configured custom theme color values manually', 'setting');
    } catch (err: any) {
      console.error('Failed to save custom theme to backend', err);
      alert('Failed to save custom theme colors to database: ' + (err?.message || 'Network error'));
    }
  };

  const handleResetTheme = async () => {
    const defaults = builtInPresets[0].colors;
    setThemeInput(defaults);
    setActivePresetId('classic');
    try {
      await updateThemeColors(defaults);
      addLogEntry('Reset theme color tokens to defaults', 'setting');
    } catch (err: any) {
      console.error('Failed to reset theme on backend', err);
      alert('Failed to reset theme on database: ' + (err?.message || 'Network error'));
    }
  };

  const handleAddCustomTheme = async () => {
    if (!newThemeName.trim()) return;
    try {
      const created = await adminService.saveTheme({
        name: newThemeName,
        properties_json: JSON.stringify(newThemeColors)
      });
      const newTheme: ThemePreset = {
        id: created.id,
        name: created.name,
        description: newThemeDesc || 'Custom theme',
        colors: JSON.parse(created.properties_json),
      };
      setCustomThemes([...customThemes, newTheme]);
      setNewThemeName('');
      setNewThemeDesc('');
      setShowAddThemeForm(false);
      addLogEntry(`Created Custom Theme: "${newTheme.name}"`, 'setting');
    } catch (err) {
       console.error('Failed to create theme', err);
       alert('Failed to save custom theme to backend.');
    }
  };

  const handleRemoveCustomTheme = async (id: string) => {
    const targetTheme = customThemes.find(t => t.id === id);
    try {
      await adminService.deleteTheme(id);
      const updated = customThemes.filter((t) => t.id !== id);
      setCustomThemes(updated);
      if (activePresetId === id) setActivePresetId(null);
      if (targetTheme) {
        addLogEntry(`Deleted Custom Theme: "${targetTheme.name}"`, 'setting');
      }
    } catch (err) {
      console.error('Failed to delete theme', err);
      alert('Failed to delete custom theme.');
    }
  };

  // Banner image upload to Cloudinary via adminService
  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type.toLowerCase())) {
      alert('Invalid file format. Please upload JPG, JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Maximum size for image upload is 10 MB.');
      return;
    }

    const currentBanner = banners[selectedSlideIdx];
    if (currentBanner) {
      try {
        const formData = new FormData();
        formData.append('image', file);
        const res = await adminService.uploadBannerImage(currentBanner.id, formData);
        updateBanner(currentBanner.id, { image: res.image_url });
        addLogEntry(`Uploaded new banner image to Cloudinary for Slide ${selectedSlideIdx + 1}`, 'setting');
      } catch (err: any) {
        console.error('Failed banner upload:', err);
        const detail = err?.detail || err?.message || 'Failed to upload banner image.';
        alert(detail);
      }
    }
    if (bannerFileRef.current) bannerFileRef.current.value = '';
  };  // Create real admin user in database via FastAPI backend
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const nameTrimmed = trimValue(newAdmin.name);
    const emailTrimmed = trimValue(newAdmin.email).toLowerCase();
    const passwordTrimmed = trimValue(newAdmin.password);

    if (!isNonEmpty(nameTrimmed)) {
      errors.name = 'Full name is required and cannot be empty.';
    }

    if (!isNonEmpty(emailTrimmed)) {
      errors.email = 'Email address is required.';
    } else if (!isValidEmail(emailTrimmed)) {
      errors.email = 'Must be a valid email format (e.g. admin@chovique.com).';
    } else if (isDuplicate(systemUsers, 'email', emailTrimmed)) {
      errors.email = 'An account with this email address already exists.';
    }

    if (!isNonEmpty(passwordTrimmed)) {
      errors.password = 'Password is required.';
    } else if (passwordTrimmed.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }

    setAdminFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      addToast('error', 'Please fix form validation errors before creating admin.', 'Validation Error');
      return;
    }

    setIsCreatingAdmin(true);
    setAdminCreateError('');

    try {
      const created = await adminService.createAdmin({
        full_name: nameTrimmed,
        email: emailTrimmed,
        password: passwordTrimmed,
        role: newAdmin.role,
      });

      setSystemUsers((prev) => [created, ...prev]);
      addLogEntry(`Registered new administrator account: ${created.name} (${created.email})`, 'security');
      addToast('success', `Admin user ${created.name} created successfully!`, 'Admin Registered');

      setNewAdmin({ name: '', email: '', password: '', role: 'admin' });
      setAdminFormErrors({});
      setShowAddAdminForm(false);
    } catch (err: any) {
      console.error('Failed to create admin account:', err);
      const detail = err?.detail || err?.message || 'Failed to create administrator user.';
      setAdminCreateError(detail);
      addToast('error', detail, 'Error Creating Admin');
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handlePromoteAdmin = (id: string, name: string) => {
    openConfirmation(
      'Promote User',
      `Are you sure you want to promote ${name} to Superadmin?`,
      async () => {
        try {
          const updatedUser = await adminService.promoteAdmin(id);
          setSystemUsers((prev) => prev.map((u) => (u.id === id ? updatedUser : u)));
          addLogEntry(`Promoted administrator account: ${name} to superadmin`, 'security');
          addToast('success', `User ${name} promoted to Superadmin.`, 'Role Updated');
        } catch (err: any) {
          addToast('error', err?.detail || err?.message || 'Failed to promote administrator.', 'Error');
        }
      },
      'Promote'
    );
  };

  const handleDemoteAdmin = (id: string, name: string) => {
    openConfirmation(
      'Demote User',
      `Are you sure you want to demote ${name} back to regular Admin?`,
      async () => {
        try {
          const updatedUser = await adminService.demoteAdmin(id);
          setSystemUsers((prev) => prev.map((u) => (u.id === id ? updatedUser : u)));
          addLogEntry(`Demoted superadmin account: ${name} back to admin`, 'security');
          addToast('success', `User ${name} demoted to Admin.`, 'Role Updated');
        } catch (err: any) {
          addToast('error', err?.detail || err?.message || 'Failed to demote superadmin.', 'Error');
        }
      },
      'Demote'
    );
  };

  // Delete admin user from database via FastAPI backend
  const handleRemoveAdmin = (id: string, name: string, email: string) => {
    openConfirmation(
      'Revoke Admin Access',
      `Are you sure you want to delete administrator account ${name} (${email})?`,
      async () => {
        try {
          await adminService.deleteUser(id);
          setSystemUsers((prev) => prev.filter((u) => u.id !== id));
          addLogEntry(`Revoked administrator account: ${name} (${email})`, 'security');
          addToast('success', `Revoked access for admin ${name}.`, 'Admin Removed');
        } catch (err: any) {
          addToast('error', err?.detail || err?.message || 'Failed to revoke administrator account.', 'Error');
        }
      },
      'Revoke Access'
    );
  };

  // Create brand new banner hero slide
  const handleCreateNewBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerData.title.trim()) {
      setBannerCreateError('Please enter a heading/title for the banner slide.');
      return;
    }
    setIsCreatingBanner(true);
    setBannerCreateError('');

    try {
      const formData = new FormData();
      formData.append('title', newBannerData.title);
      if (newBannerData.subtitle) formData.append('subtitle', newBannerData.subtitle);
      if (newBannerData.tag) formData.append('tag', newBannerData.tag);
      if (newBannerData.buttonText) formData.append('button_text', newBannerData.buttonText);
      if (newBannerData.link) formData.append('link', newBannerData.link);
      
      if (newBannerImageFile) {
        formData.append('image', newBannerImageFile);
      } else if (newBannerData.image_url) {
        formData.append('image_url', newBannerData.image_url);
      }

      const created = await adminService.createBanner(formData);
      if (addBanner) addBanner(created);
      if (refreshBanners) await refreshBanners();

      addLogEntry(`Created new banner hero slide: "${created.title}"`, 'setting');
      setNewBannerData({
        title: '',
        subtitle: '',
        tag: '',
        buttonText: 'Explore Collection',
        link: '/products',
        image_url: '',
      });
      setNewBannerImageFile(null);
      setShowAddBannerModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create banner slide.';
      setBannerCreateError(msg);
    } finally {
      setIsCreatingBanner(false);
    }
  };

  // Delete hero banner slide
  const handleDeleteBanner = async (bannerId: string, bannerTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete banner "${bannerTitle}"?`)) return;
    try {
      await adminService.deleteBanner(bannerId);
      if (deleteBannerState) deleteBannerState(bannerId);
      if (refreshBanners) await refreshBanners();
      if (selectedSlideIdx >= Math.max(0, banners.length - 1)) {
        setSelectedSlideIdx(Math.max(0, banners.length - 2));
      }
      addLogEntry(`Deleted banner slide: "${bannerTitle}"`, 'setting');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete banner.';
      alert(msg);
    }
  };

  // Reset/Update administrator password
  const handleUpdateAdminPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetAdminUser) return;
    if (!resetAdminPassword.trim() || resetAdminPassword.length < 6) {
      setResetPasswordError('Password must be at least 6 characters long.');
      return;
    }
    setIsResettingPassword(true);
    setResetPasswordError('');
    setResetPasswordSuccess('');

    try {
      await adminService.updateAdminPassword(resetAdminUser.id, resetAdminPassword);
      setResetPasswordSuccess(`Successfully updated password for ${resetAdminUser.name}.`);
      addLogEntry(`Reset password for administrator account: ${resetAdminUser.name} (${resetAdminUser.email})`, 'security');
      setTimeout(() => {
        setResetAdminUser(null);
        setResetAdminPassword('');
        setResetPasswordSuccess('');
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update administrator password.';
      setResetPasswordError(msg);
    } finally {
      setIsResettingPassword(false);
    }
  };



  // Edit admin user profile (name, email, scope)
  const handleLegacyEditAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAdminUser) return;
    if (!editAdminForm.name.trim() || !editAdminForm.email.trim()) {
      setEditAdminError('Name and Email are required.');
      return;
    }
    setIsEditingAdmin(true);
    setEditAdminError('');
    try {
      const updated = await adminService.updateAdmin(editAdminUser.id, {
        full_name: editAdminForm.name,
        email: editAdminForm.email,
      });
      // Scope removed — no longer a field
      const mergedUser = { ...updated };
      setSystemUsers((prev) =>
        prev.map((u) => (u.id === mergedUser.id ? mergedUser : u))
      );
      addLogEntry(`Updated administrator account: ${mergedUser.name} (${mergedUser.email})`, 'security');
      setEditAdminUser(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update administrator.';
      setEditAdminError(msg);
    } finally {
      setIsEditingAdmin(false);
    }
  };

  // Restock items
  const handleSaveStockLevel = async (prodId: string) => {
    try {
      await adminService.updateProductStock(prodId, adjustStockVal);
      setProducts(prev => prev.map(p => p.id === prodId ? { ...p, stock: adjustStockVal } : p));
      const prodName = products.find(p => p.id === prodId)?.name || prodId;
      addLogEntry(`Adjusted inventory stock for "${prodName}" to ${adjustStockVal} units`, 'product');
      setAdjustingStockId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update stock');
    }
  };

  // Export consolidated website and offline store sales as CSV (Excel)
  const handleExportOverallSales = () => {
    // 1. Prepare CSV headers
    const headers = [
      'Source',
      'Transaction ID',
      'Date',
      'Customer/Payment Details',
      'Products Sold',
      'Total Amount',
      'Status'
    ];

    // 2. Prepare rows
    const rows: string[][] = [];

    // Map website orders (excluding cancelled)
    superOrders.forEach((ord: any) => {
      const productsList = ord.items.map((it: any) => `${it.product.name} (x${it.quantity})`).join('; ');
      rows.push([
        'Online Boutique',
        ord.id,
        ord.date,
        ord.shippingAddress.name,
        `"${productsList}"`, // wrapped in quotes to preserve semicolons
        `₹${ord.total}`,
        ord.status
      ]);
    });

    // Map offline boutique sales
    offlineSales.forEach((sale: any) => {
      rows.push([
        'Offline Boutique',
        sale.id,
        sale.date,
        `Paid via ${sale.paymentMethod}`,
        `"${sale.productName} (x${sale.quantity})"`,
        `₹${sale.totalPrice}`,
        'Completed'
      ]);
    });

    // 3. Assemble CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    // 4. Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `chovique_overall_sales_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addLogEntry('Exported consolidated sales ledger CSV file', 'security');
  };

  // Export only website online sales as CSV
  const handleExportOnlineSales = () => {
    const headers = [
      'Order ID',
      'Date',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Address',
      'Products Sold',
      'Shipping Charge',
      'Total Amount',
      'Payment Method',
      'Status'
    ];

    const rows: string[][] = [];
    superOrders.forEach((ord: any) => {
      const productsList = ord.items.map((it: any) => `${it.product.name} (x${it.quantity})`).join('; ');
      const addressStr = `"${ord.shippingAddress.street}, ${ord.shippingAddress.city}, ${ord.shippingAddress.state} - ${ord.shippingAddress.zip}"`;
      rows.push([
        ord.id,
        ord.date,
        ord.shippingAddress.name,
        ord.shippingAddress.email || 'customer@chovique.com',
        ord.shippingAddress.phone,
        addressStr,
        `"${productsList}"`,
        `₹${ord.shipping}`,
        `₹${ord.total}`,
        ord.paymentMethod,
        ord.status
      ]);
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `chovique_online_sales_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addLogEntry('Exported online sales ledger CSV file', 'security');
  };

  // Export only boutique offline sales as CSV
  const handleExportOfflineSales = () => {
    const headers = [
      'Receipt ID',
      'Date',
      'Product Name',
      'Quantity Sold',
      'Total Price',
      'Payment Method'
    ];

    const rows: string[][] = [];
    offlineSales.forEach((sale: any) => {
      rows.push([
        sale.id,
        sale.date,
        `"${sale.productName}"`,
        sale.quantity.toString(),
        `₹${sale.totalPrice}`,
        sale.paymentMethod
      ]);
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `chovique_offline_sales_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addLogEntry('Exported offline sales ledger CSV file', 'security');
  };

  // Order status dynamic adjuster
  const handleUpdateOrderStatus = (orderId: string, status: any) => {
    setSuperOrders((prev: any) =>
      prev.map((o: any) => {
        if (o.id === orderId) {
          addLogEntry(`Updated Order "${orderId}" status to "${status}"`, 'order');
          return { ...o, status };
        }
        return o;
      })
    );
  };

  // Computed summary metrics from backend
  const totalOfflineRevenue = dashboardStats?.total_offline_revenue || 0;
  const totalOnlineRevenue = dashboardStats?.total_online_revenue || 0;
  const totalRevenue = totalOnlineRevenue + totalOfflineRevenue;
  
  // Count total sold items & available items from backend
  const totalUnitsSold = dashboardStats?.total_units_sold || 0;
  const totalUnitsAvailable = dashboardStats?.total_inventory_stock || 0;

  // Analytics real data for charts (last 6 months)
  const salesHistoryData = dashboardStats?.monthly_revenue?.map(m => ({
    name: m.month,
    OnlineSales: m.online_revenue,
    BoutiqueSales: m.offline_revenue
  })) || [];

  // Pie chart values for revenue sources
  const revenueChannelsData = [
    { name: 'Online Boutique', value: totalOnlineRevenue, color: 'var(--rose-gold)' },
    { name: 'Offline Boutiques', value: totalOfflineRevenue, color: 'var(--gold)' },
  ];

  // Specific Customer Inspection Details
  const getCustomerOrders = (customerEmail: string) => {
    const nameToMatch = inspectedCustomer ? (inspectedCustomer.name || inspectedCustomer.email || '').toLowerCase() : '';
    return Array.isArray(superOrders)
      ? superOrders.filter((o: any) =>
          (o?.shippingAddress?.name?.toLowerCase() || '').includes(nameToMatch) ||
          (o?.shippingAddress?.phone || '').includes('98765')
        )
      : [];
  };


  return (

    <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--cream)', fontFamily: 'var(--font-body)' }}>
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={handleTabNavigation} />

      {/* Main content pane */}
      <div className="admin-workspace">
        {/* Top-Right Admin Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {/* Notification Bell Dropdown */}
          <NotificationHeaderDropdown onNavigateTab={handleTabNavigation} isSuperadmin={true} />

          {/* View Home Button */}
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              height: '42px',
              padding: '0 16px',
              borderRadius: '10px',
              background: 'rgba(20, 16, 13, 0.9)',
              border: '1px solid rgba(201, 168, 76, 0.3)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              cursor: 'pointer',
              color: '#f5efe6',
              fontSize: '0.85rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.6)';
              e.currentTarget.style.background = 'rgba(30, 24, 19, 0.95)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.3)';
              e.currentTarget.style.background = 'rgba(20, 16, 13, 0.9)';
            }}
            title="View Public Site Homepage"
            aria-label="View Home"
          >
            <Home size={18} color="#c9a84c" />
            <span>View Home</span>
          </button>

          {/* Admin User Profile Dropdown Menu */}
          <AdminUserDropdown onNavigateTab={handleTabNavigation} />
        </div>
        
        {/* ENTERPRISE DASHBOARD TAB */}
        {activeTab === 'enterprise' && (
          <div>
            {/* Header: Title & Timeframe Selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--cream)', margin: 0, fontWeight: 700 }}>
                  Enterprise Overview
                </h1>
                <p style={{ color: 'var(--beige)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                  Overall business performance at a glance
                </p>
              </div>

              {/* Timeframe Selector Pills & Custom Date Range */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', background: 'rgba(20, 16, 13, 0.9)', border: '1px solid rgba(201, 168, 76, 0.3)', borderRadius: '8px', padding: '4px', gap: '4px' }}>
                  {[
                    { id: 'today', label: 'Today' },
                    { id: '7days', label: '7 Days' },
                    { id: '30days', label: '30 Days' },
                    { id: '3months', label: '3 Months' },
                    { id: '1year', label: '1 Year' },
                    { id: 'custom', label: 'Custom Date' },
                  ].map((tf) => (
                    <button
                      key={tf.id}
                      onClick={() => handleSelectOverviewTimeframe(tf.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        background: overviewTimeframe === tf.id ? 'var(--gradient-gold)' : 'transparent',
                        color: overviewTimeframe === tf.id ? 'var(--dark-chocolate)' : 'var(--beige)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>

                {overviewTimeframe === 'custom' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(20, 16, 13, 0.9)', border: '1px solid rgba(201, 168, 76, 0.3)', borderRadius: '8px', padding: '4px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: 'var(--beige)', fontSize: '0.75rem', fontWeight: 600 }}>From:</span>
                      <input
                        type="date"
                        value={overviewStartDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOverviewStartDate(val);
                          if (val && overviewEndDate) {
                            if (val > overviewEndDate) {
                              setOverviewDateError('Start date cannot be after end date.');
                            } else {
                              setOverviewDateError(null);
                              fetchOverview('custom', val, overviewEndDate);
                            }
                          }
                        }}
                        style={{
                          background: '#14100d',
                          color: '#f5efe6',
                          colorScheme: 'dark',
                          border: '1px solid rgba(201, 168, 76, 0.4)',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: 'var(--beige)', fontSize: '0.75rem', fontWeight: 600 }}>To:</span>
                      <input
                        type="date"
                        value={overviewEndDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOverviewEndDate(val);
                          if (overviewStartDate && val) {
                            if (overviewStartDate > val) {
                              setOverviewDateError('Start date cannot be after end date.');
                            } else {
                              setOverviewDateError(null);
                              fetchOverview('custom', overviewStartDate, val);
                            }
                          }
                        }}
                        style={{
                          background: '#14100d',
                          color: '#f5efe6',
                          colorScheme: 'dark',
                          border: '1px solid rgba(201, 168, 76, 0.4)',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error Alert State */}
            {(overviewError || overviewDateError) && (
              <div
                style={{
                  padding: '16px 20px',
                  background: 'rgba(231, 76, 60, 0.1)',
                  border: '1px solid rgba(231, 76, 60, 0.3)',
                  borderRadius: '10px',
                  color: '#e74c3c',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={20} color="#e74c3c" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{overviewDateError || overviewError}</span>
                </div>
                {overviewError && !overviewDateError && (
                  <Button variant="secondary" size="sm" onClick={() => fetchOverview(overviewTimeframe, overviewStartDate, overviewEndDate)}>
                    Retry
                  </Button>
                )}
              </div>
            )}

            {/* Loading Skeleton vs Content */}
            {overviewLoading ? (
              <div>
                <DashboardKpiSkeleton />
                <div style={{ display: 'grid', gridTemplateColumns: false ? '1fr' : '1.4fr 1fr', gap: '24px', marginTop: '24px' }}>
                  <DashboardCardSkeleton />
                  <DashboardCardSkeleton />
                </div>
              </div>
            ) : displayOverview ? (
              <>
                {/* 4 KPI Cards Grid */}
                <div className="stats-grid-dashboard" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  {/* Card 1: TOTAL REVENUE */}
                  <div className="dashboard-stat-card glass-panel" style={{ padding: '20px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                      TOTAL REVENUE
                    </span>
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f5efe6', display: 'block', fontFamily: 'var(--font-display)' }}>
                      ₹{displayOverview.total_revenue.current_value.toLocaleString('en-IN')}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.75rem', fontWeight: 600, color: displayOverview.total_revenue.percentage_change >= 0 ? '#2ecc71' : '#e74c3c' }}>
                      <span>{displayOverview.total_revenue.percentage_change >= 0 ? `+${displayOverview.total_revenue.percentage_change}%` : `${displayOverview.total_revenue.percentage_change}%`}</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{displayOverview.total_revenue.comparison_label}</span>
                    </div>
                  </div>

                  {/* Card 2: TOTAL ORDERS */}
                  <div className="dashboard-stat-card glass-panel" style={{ padding: '20px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                      TOTAL ORDERS
                    </span>
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f5efe6', display: 'block', fontFamily: 'var(--font-display)' }}>
                      {displayOverview.total_orders.current_value.toLocaleString()}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.75rem', fontWeight: 600, color: displayOverview.total_orders.percentage_change >= 0 ? '#2ecc71' : '#e74c3c' }}>
                      <span>{displayOverview.total_orders.percentage_change >= 0 ? `+${displayOverview.total_orders.percentage_change}%` : `${displayOverview.total_orders.percentage_change}%`}</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{displayOverview.total_orders.comparison_label}</span>
                    </div>
                  </div>

                  {/* Card 3: TOTAL CUSTOMERS */}
                  <div className="dashboard-stat-card glass-panel" style={{ padding: '20px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                      TOTAL CUSTOMERS
                    </span>
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f5efe6', display: 'block', fontFamily: 'var(--font-display)' }}>
                      {displayOverview.total_customers.current_value.toLocaleString()}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.75rem', fontWeight: 600, color: displayOverview.total_customers.percentage_change >= 0 ? '#2ecc71' : '#e74c3c' }}>
                      <span>{displayOverview.total_customers.percentage_change >= 0 ? `+${displayOverview.total_customers.percentage_change}%` : `${displayOverview.total_customers.percentage_change}%`}</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{displayOverview.total_customers.comparison_label}</span>
                    </div>
                  </div>

                  {/* Card 4: ACTIVE ADMINS */}
                  <div className="dashboard-stat-card glass-panel" style={{ padding: '20px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                      ACTIVE ADMINS
                    </span>
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f5efe6', display: 'block', fontFamily: 'var(--font-display)' }}>
                      {displayOverview.active_admins.current_value.toLocaleString()}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.75rem', fontWeight: 600, color: displayOverview.active_admins.percentage_change >= 0 ? '#2ecc71' : '#e74c3c' }}>
                      <span>{displayOverview.active_admins.percentage_change >= 0 ? `+${displayOverview.active_admins.percentage_change}%` : `${displayOverview.active_admins.percentage_change}%`}</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{displayOverview.active_admins.comparison_label}</span>
                    </div>
                  </div>
                </div>

                {/* ROW 1: Revenue Trend Chart & Sales Source Donut Chart */}
                <div style={{ display: 'grid', gridTemplateColumns: false ? '1fr' : '1.4fr 1fr', gap: '24px', marginBottom: '24px' }}>
                  {/* Revenue Trend Chart */}
                  <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px', background: 'rgba(15, 12, 10, 0.85)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: '#f5efe6', margin: 0, fontWeight: 700 }}>
                        REVENUE TREND ({overviewTimeframe === 'today' ? 'TODAY' : overviewTimeframe === '30days' ? 'THIS MONTH' : overviewTimeframe.toUpperCase()})
                      </h3>
                    </div>
                    <div style={{ height: '240px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={displayOverview.revenue_trend}>
                          <defs>
                            <linearGradient id="goldGradientOverview" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.6} />
                              <stop offset="95%" stopColor="#c9a84c" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                          <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} />
                          <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                          <Tooltip
                            contentStyle={{ background: '#14100d', borderColor: '#c9a84c', borderRadius: '8px', color: '#f5efe6' }}
                            formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#c9a84c" strokeWidth={2.5} fillOpacity={1} fill="url(#goldGradientOverview)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Sales Source Donut Chart */}
                  <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px', background: 'rgba(15, 12, 10, 0.85)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: '#f5efe6', marginBottom: '16px', fontWeight: 700 }}>
                      SALES SOURCE
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flex: 1, flexWrap: 'wrap', gap: '16px' }}>
                      <div style={{ width: '150px', height: '150px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Online Sales', value: displayOverview.sales_source.online_revenue, fill: '#b76e79' },
                                { name: 'Offline Sales', value: displayOverview.sales_source.offline_revenue, fill: '#80343f' },
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={70}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              <Cell key="online" fill="#b76e79" />
                              <Cell key="offline" fill="#80343f" />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#b76e79' }} />
                          <div>
                            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', display: 'block' }}>Online Sales</span>
                            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f5efe6' }}>
                              ₹{displayOverview.sales_source.online_revenue.toLocaleString('en-IN')} ({displayOverview.sales_source.online_percentage}%)
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#80343f' }} />
                          <div>
                            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', display: 'block' }}>Offline Sales</span>
                            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f5efe6' }}>
                              ₹{displayOverview.sales_source.offline_revenue.toLocaleString('en-IN')} ({displayOverview.sales_source.offline_percentage}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ROW 2: Top Selling Product & Recent Activity */}
                <div style={{ display: 'grid', gridTemplateColumns: false ? '1fr' : '1fr 1fr', gap: '24px' }}>
                  {/* Top Selling Product */}
                  <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px', background: 'rgba(15, 12, 10, 0.85)' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: '#f5efe6', marginBottom: '16px', fontWeight: 700 }}>
                      TOP SELLING PRODUCT
                    </h3>
                    {displayOverview.top_selling_products.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {displayOverview.top_selling_products.slice(0, 3).map((prod) => (
                          <div
                            key={prod.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '16px',
                              padding: '14px',
                              background: 'rgba(255, 255, 255, 0.03)',
                              borderRadius: '10px',
                              border: '1px solid rgba(201, 168, 76, 0.15)',
                            }}
                          >
                            <img
                              src={getImageUrl(prod.image_url)}
                              alt={prod.name}
                              style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(201, 168, 76, 0.3)' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=150&q=80';
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f5efe6', margin: '0 0 4px 0' }}>
                                {prod.name}
                              </h4>
                              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: '2px' }}>
                                Sold: {prod.units_sold} units
                              </span>
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c9a84c' }}>
                                Revenue: ₹{prod.revenue.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '30px 0', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                        No product sales recorded for this timeframe.
                      </div>
                    )}
                  </div>

                  {/* Recent Activity */}
                  <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px', background: 'rgba(15, 12, 10, 0.85)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: '#f5efe6', margin: 0, fontWeight: 700 }}>
                        RECENT ACTIVITY
                      </h3>
                      <button
                        onClick={() => setActiveTab('audit-logs')}
                        style={{ background: 'none', border: 'none', color: '#c9a84c', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        View All
                      </button>
                    </div>

                    {displayOverview.recent_activities.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {displayOverview.recent_activities.slice(0, 4).map((act) => (
                          <div
                            key={act.id}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '12px',
                              padding: '10px 12px',
                              background: 'rgba(255, 255, 255, 0.02)',
                              borderRadius: '8px',
                              borderLeft: '3px solid #c9a84c',
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: '0 0 2px 0', fontSize: '0.82rem', color: '#f5efe6', fontWeight: 600 }}>
                                {act.description || act.action}
                              </p>
                              <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
                                {act.timestamp}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '30px 0', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                        No recent activity recorded.
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* REVENUE ANALYTICS TAB */}
        {activeTab === 'revenue' && (
          <div>
            {/* Header Title & Export Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--cream)', margin: 0, fontWeight: 700 }}>
                  Revenue Performance
                </h1>
                <p style={{ color: 'var(--beige)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                  Track and analyze your revenue performance
                </p>
              </div>
              <Button
                variant="gold"
                glow
                onClick={handleExportRevenueCsv}
                disabled={revenueExporting}
              >
                <Download size={16} style={{ marginRight: '8px' }} />
                {revenueExporting ? 'Exporting...' : 'Export Revenue (CSV)'}
              </Button>
            </div>

            {/* Filter Toolbar: Preset selector + Custom Range */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                marginBottom: '24px',
                flexWrap: 'wrap',
                background: 'rgba(20, 16, 13, 0.85)',
                padding: '12px 18px',
                borderRadius: '10px',
                border: '1px solid rgba(201, 168, 76, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <select
                  value={revenuePreset}
                  onChange={(e) => {
                    setRevenuePreset(e.target.value);
                    fetchRevenueAnalytics(e.target.value, revenueDateFrom, revenueDateTo);
                  }}
                  style={{
                    background: '#14100d',
                    color: '#f5efe6',
                    border: '1px solid rgba(201, 168, 76, 0.4)',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="3months">Last 3 Months</option>
                  <option value="year">This Year</option>
                  <option value="custom">Custom Date Range</option>
                </select>

                {revenuePreset === 'custom' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="date"
                      value={revenueDateFrom}
                      onChange={(e) => setRevenueDateFrom(e.target.value)}
                      style={{
                        background: '#14100d',
                        color: '#f5efe6',
                        colorScheme: 'dark',
                        border: '1px solid rgba(201, 168, 76, 0.4)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{ color: 'var(--beige)', fontSize: '0.85rem' }}>to</span>
                    <input
                      type="date"
                      value={revenueDateTo}
                      onChange={(e) => setRevenueDateTo(e.target.value)}
                      style={{
                        background: '#14100d',
                        color: '#f5efe6',
                        colorScheme: 'dark',
                        border: '1px solid rgba(201, 168, 76, 0.4)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fetchRevenueAnalytics('custom', revenueDateFrom, revenueDateTo)}
                    >
                      Apply
                    </Button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c9a84c', fontSize: '0.85rem', fontWeight: 600 }}>
                <Calendar size={16} />
                <span>{displayRevenue.display_range}</span>
              </div>
            </div>

            {/* Error Alert State */}
            {revenueError && (
              <div
                style={{
                  padding: '16px 20px',
                  background: 'rgba(231, 76, 60, 0.1)',
                  border: '1px solid rgba(231, 76, 60, 0.3)',
                  borderRadius: '10px',
                  color: '#e74c3c',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={20} color="#e74c3c" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{revenueError}</span>
                </div>
                <Button variant="secondary" size="sm" onClick={() => fetchRevenueAnalytics()}>
                  Retry
                </Button>
              </div>
            )}

            {/* Loading Skeleton vs Content */}
            {revenueLoading ? (
              <div>
                <DashboardKpiSkeleton />
                <DashboardCardSkeleton height="350px" />
              </div>
            ) : displayRevenue ? (
              <>
                {/* 4 KPI Cards */}
                <div className="stats-grid-dashboard" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  {/* Card 1: TOTAL REVENUE / INCOME */}
                  <div className="dashboard-stat-card glass-panel" style={{ padding: '20px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                      TOTAL REVENUE
                    </span>
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f5efe6', display: 'block', fontFamily: 'var(--font-display)' }}>
                      ₹{displayRevenue.total_income.current_value.toLocaleString('en-IN')}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.75rem', fontWeight: 600, color: displayRevenue.total_income.percentage_change >= 0 ? '#2ecc71' : '#e74c3c' }}>
                      <span>{displayRevenue.total_income.percentage_change >= 0 ? `+${displayRevenue.total_income.percentage_change}%` : `${displayRevenue.total_income.percentage_change}%`}</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{displayRevenue.total_income.comparison_label}</span>
                    </div>
                  </div>

                  {/* Card 2: ONLINE REVENUE */}
                  <div className="dashboard-stat-card glass-panel" style={{ padding: '20px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                      ONLINE REVENUE
                    </span>
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f5efe6', display: 'block', fontFamily: 'var(--font-display)' }}>
                      ₹{displayRevenue.online_revenue.current_value.toLocaleString('en-IN')}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.75rem', fontWeight: 600, color: displayRevenue.online_revenue.percentage_change >= 0 ? '#2ecc71' : '#e74c3c' }}>
                      <span>{displayRevenue.online_revenue.percentage_change >= 0 ? `+${displayRevenue.online_revenue.percentage_change}%` : `${displayRevenue.online_revenue.percentage_change}%`}</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{displayRevenue.online_revenue.comparison_label}</span>
                    </div>
                  </div>

                  {/* Card 3: OFFLINE REVENUE */}
                  <div className="dashboard-stat-card glass-panel" style={{ padding: '20px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                      OFFLINE REVENUE
                    </span>
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f5efe6', display: 'block', fontFamily: 'var(--font-display)' }}>
                      ₹{displayRevenue.offline_revenue.current_value.toLocaleString('en-IN')}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.75rem', fontWeight: 600, color: displayRevenue.offline_revenue.percentage_change >= 0 ? '#2ecc71' : '#e74c3c' }}>
                      <span>{displayRevenue.offline_revenue.percentage_change >= 0 ? `+${displayRevenue.offline_revenue.percentage_change}%` : `${displayRevenue.offline_revenue.percentage_change}%`}</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{displayRevenue.offline_revenue.comparison_label}</span>
                    </div>
                  </div>

                  {/* Card 4: AVERAGE ORDER VALUE */}
                  <div className="dashboard-stat-card glass-panel" style={{ padding: '20px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                      AVG ORDER VALUE
                    </span>
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f5efe6', display: 'block', fontFamily: 'var(--font-display)' }}>
                      ₹{displayRevenue.avg_order_value.current_value.toLocaleString('en-IN')}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.75rem', fontWeight: 600, color: displayRevenue.avg_order_value.percentage_change >= 0 ? '#2ecc71' : '#e74c3c' }}>
                      <span>{displayRevenue.avg_order_value.percentage_change >= 0 ? `+${displayRevenue.avg_order_value.percentage_change}%` : `${displayRevenue.avg_order_value.percentage_change}%`}</span>
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{displayRevenue.avg_order_value.comparison_label}</span>
                    </div>
                  </div>
                </div>

                {/* Main Trend Chart: REVENUE TREND */}
                <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px', background: 'rgba(15, 12, 10, 0.85)', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: '#f5efe6', margin: 0, fontWeight: 700 }}>
                      REVENUE TREND
                    </h3>
                  </div>
                  <div style={{ height: '300px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={displayRevenue.revenue_trend}>
                        <defs>
                          <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#c9a84c" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#b76e79" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#b76e79" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} />
                        <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                        <Tooltip
                          contentStyle={{ background: '#14100d', borderColor: '#c9a84c', borderRadius: '8px', color: '#f5efe6' }}
                          formatter={(val: any, name: any) => [`₹${Number(val).toLocaleString('en-IN')}`, name]}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="online_revenue" name="Online Revenue" stroke="#c9a84c" strokeWidth={2.5} fillOpacity={1} fill="url(#goldGradient)" />
                        <Area type="monotone" dataKey="offline_revenue" name="Offline Revenue" stroke="#b76e79" strokeWidth={2.5} fillOpacity={1} fill="url(#roseGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Additional Sections: Revenue by Source & Revenue by Payment Method */}
                <div style={{ display: 'grid', gridTemplateColumns: false ? '1fr' : '1fr 1.2fr', gap: '24px', marginBottom: '24px' }}>
                  {/* Revenue by Source */}
                  <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px', background: 'rgba(15, 12, 10, 0.85)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: '#f5efe6', marginBottom: '16px', fontWeight: 700 }}>
                      REVENUE BY SOURCE
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flex: 1, flexWrap: 'wrap', gap: '16px' }}>
                      <div style={{ width: '150px', height: '150px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Online', value: displayRevenue.revenue_by_source.online_revenue, fill: '#b76e79' },
                                { name: 'Offline', value: displayRevenue.revenue_by_source.offline_revenue, fill: '#80343f' },
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={70}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              <Cell key="online" fill="#b76e79" />
                              <Cell key="offline" fill="#80343f" />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#b76e79' }} />
                          <div>
                            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', display: 'block' }}>Online</span>
                            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f5efe6' }}>
                              ₹{displayRevenue.revenue_by_source.online_revenue.toLocaleString('en-IN')} ({displayRevenue.revenue_by_source.online_percentage}%)
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#80343f' }} />
                          <div>
                            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', display: 'block' }}>Offline</span>
                            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f5efe6' }}>
                              ₹{displayRevenue.revenue_by_source.offline_revenue.toLocaleString('en-IN')} ({displayRevenue.revenue_by_source.offline_percentage}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Revenue by Payment Method */}
                  <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px', background: 'rgba(15, 12, 10, 0.85)' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: '#f5efe6', marginBottom: '16px', fontWeight: 700 }}>
                      REVENUE BY PAYMENT METHOD
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {displayRevenue.revenue_by_payment_method.map((pm, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                            <span style={{ color: '#f5efe6', fontWeight: 600 }}>{pm.method}</span>
                            <span style={{ color: '#c9a84c', fontWeight: 700 }}>
                              ₹{pm.amount.toLocaleString('en-IN')} ({pm.percentage}%)
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${Math.min(100, Math.max(0, pm.percentage))}%`,
                                height: '100%',
                                background: i === 0 ? 'var(--gradient-gold)' : i === 1 ? '#b76e79' : '#80343f',
                                borderRadius: '4px',
                                transition: 'width 0.5s ease',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Revenue Summary Datatable */}
                <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px', background: 'rgba(15, 12, 10, 0.85)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: '#f5efe6', margin: 0, fontWeight: 700 }}>
                      REVENUE SUMMARY BREAKDOWN
                    </h3>
                    <Button variant="secondary" size="sm" onClick={handleExportRevenueCsv} disabled={revenueExporting}>
                      <Download size={14} style={{ marginRight: '6px' }} />
                      Export Table CSV
                    </Button>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: '#f5efe6' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(201, 168, 76, 0.3)', color: '#c9a84c', textAlign: 'left' }}>
                          <th style={{ padding: '12px' }}>Date</th>
                          <th style={{ padding: '12px' }}>Online Orders</th>
                          <th style={{ padding: '12px' }}>Online Revenue</th>
                          <th style={{ padding: '12px' }}>Offline Sales</th>
                          <th style={{ padding: '12px' }}>Offline Revenue</th>
                          <th style={{ padding: '12px' }}>Total Revenue</th>
                          <th style={{ padding: '12px' }}>Avg Order Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayRevenue.summary_rows.length > 0 ? (
                          displayRevenue.summary_rows
                            .slice((summaryPage - 1) * summaryRowsPerPage, summaryPage * summaryRowsPerPage)
                            .map((row, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                                <td style={{ padding: '12px', fontWeight: 600 }}>{row.date}</td>
                                <td style={{ padding: '12px' }}>{row.online_orders}</td>
                                <td style={{ padding: '12px' }}>₹{row.online_revenue.toLocaleString('en-IN')}</td>
                                <td style={{ padding: '12px' }}>{row.offline_sales}</td>
                                <td style={{ padding: '12px' }}>₹{row.offline_revenue.toLocaleString('en-IN')}</td>
                                <td style={{ padding: '12px', fontWeight: 700, color: '#c9a84c' }}>₹{row.total_revenue.toLocaleString('en-IN')}</td>
                                <td style={{ padding: '12px' }}>₹{row.avg_order_value.toLocaleString('en-IN')}</td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.5)' }}>
                              No revenue entries found for selected range.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {displayRevenue.summary_rows.length > summaryRowsPerPage && (
                    <div style={{ marginTop: '16px' }}>
                      <Pagination
                        currentPage={summaryPage}
                        totalPages={Math.ceil(displayRevenue.summary_rows.length / summaryRowsPerPage)}
                        totalItems={displayRevenue.summary_rows.length}
                        itemsPerPage={summaryRowsPerPage}
                        onPageChange={setSummaryPage}
                      />
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* SALES ANALYTICS & LEDGER TAB */}
        {activeTab === 'sales-comparison' && (
          <div>
            {/* Header Title & Export Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--cream)', margin: 0, fontWeight: 700 }}>
                  Sales Analytics & Ledger
                </h1>
                <p style={{ color: 'var(--beige)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                  Detailed sales and stock performance
                </p>
              </div>
              <Button
                variant="gold"
                glow
                onClick={handleExportSalesCsv}
                disabled={salesExporting}
              >
                <Download size={16} style={{ marginRight: '8px' }} />
                {salesExporting ? 'Exporting...' : 'Export Sales (CSV)'}
              </Button>
            </div>

            {/* Sub-tab Navigation (Matching mockup design) */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', borderBottom: '1px solid rgba(201, 168, 76, 0.2)', paddingBottom: '12px' }}>
              {[
                { id: 'products' as const, label: 'Total Sales & Stock' },
                { id: 'online' as const, label: 'Online Sales Ledger' },
                { id: 'offline' as const, label: 'Offline Sales Ledger' },
              ].map((sub) => {
                const isSubActive = salesSubTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setSalesSubTab(sub.id);
                      setSalesProductsPage(1);
                      setOnlineLedgerPage(1);
                      setOfflineLedgerPage(1);
                    }}
                    style={{
                      padding: '10px 20px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: isSubActive ? '#c9a84c' : '#f5efe6',
                      background: isSubActive ? 'rgba(201, 168, 76, 0.12)' : 'rgba(20, 16, 13, 0.6)',
                      border: isSubActive ? '1px solid #c9a84c' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                    }}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>

            {/* Top 4 KPI Cards (Matching mockup values & styling) */}
            <div className="stats-grid-dashboard" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {/* Card 1: TOTAL UNITS SOLD */}
              <div className="dashboard-stat-card glass-panel" style={{ padding: '20px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  TOTAL UNITS SOLD
                </span>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f5efe6', display: 'block', fontFamily: 'var(--font-display)' }}>
                  {displaySalesProducts.kpis.total_units_sold.toLocaleString()}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.75rem', fontWeight: 600, color: displaySalesProducts.kpis.units_pct_change >= 0 ? '#2ecc71' : '#e74c3c' }}>
                  <span>{displaySalesProducts.kpis.units_pct_change >= 0 ? `+${displaySalesProducts.kpis.units_pct_change}%` : `${displaySalesProducts.kpis.units_pct_change}%`}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{displaySalesProducts.kpis.comparison_label}</span>
                </div>
              </div>

              {/* Card 2: TOTAL REVENUE */}
              <div className="dashboard-stat-card glass-panel" style={{ padding: '20px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  TOTAL REVENUE
                </span>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f5efe6', display: 'block', fontFamily: 'var(--font-display)' }}>
                  ₹{displaySalesProducts.kpis.total_revenue.toLocaleString('en-IN')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.75rem', fontWeight: 600, color: displaySalesProducts.kpis.revenue_pct_change >= 0 ? '#2ecc71' : '#e74c3c' }}>
                  <span>{displaySalesProducts.kpis.revenue_pct_change >= 0 ? `+${displaySalesProducts.kpis.revenue_pct_change}%` : `${displaySalesProducts.kpis.revenue_pct_change}%`}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{displaySalesProducts.kpis.comparison_label}</span>
                </div>
              </div>

              {/* Card 3: ONLINE REVENUE */}
              <div className="dashboard-stat-card glass-panel" style={{ padding: '20px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  ONLINE REVENUE
                </span>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f5efe6', display: 'block', fontFamily: 'var(--font-display)' }}>
                  ₹{displaySalesProducts.kpis.online_revenue.toLocaleString('en-IN')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.75rem', fontWeight: 600, color: displaySalesProducts.kpis.online_pct_change >= 0 ? '#2ecc71' : '#e74c3c' }}>
                  <span>{displaySalesProducts.kpis.online_pct_change >= 0 ? `+${displaySalesProducts.kpis.online_pct_change}%` : `${displaySalesProducts.kpis.online_pct_change}%`}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{displaySalesProducts.kpis.comparison_label}</span>
                </div>
              </div>

              {/* Card 4: OFFLINE REVENUE */}
              <div className="dashboard-stat-card glass-panel" style={{ padding: '20px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px' }}>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  OFFLINE REVENUE
                </span>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f5efe6', display: 'block', fontFamily: 'var(--font-display)' }}>
                  ₹{displaySalesProducts.kpis.offline_revenue.toLocaleString('en-IN')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', fontSize: '0.75rem', fontWeight: 600, color: displaySalesProducts.kpis.offline_pct_change >= 0 ? '#2ecc71' : '#e74c3c' }}>
                  <span>{displaySalesProducts.kpis.offline_pct_change >= 0 ? `+${displaySalesProducts.kpis.offline_pct_change}%` : `${displaySalesProducts.kpis.offline_pct_change}%`}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>{displaySalesProducts.kpis.comparison_label}</span>
                </div>
              </div>
            </div>

            {/* Toolbar: Search & Filters */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                marginBottom: '24px',
                flexWrap: 'wrap',
                background: 'rgba(20, 16, 13, 0.85)',
                padding: '12px 18px',
                borderRadius: '10px',
                border: '1px solid rgba(201, 168, 76, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
                {/* Search Bar */}
                <div style={{ position: 'relative', minWidth: '220px', flex: 1 }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                  <input
                    type="text"
                    placeholder={
                      salesSubTab === 'products'
                        ? 'Search product name...'
                        : salesSubTab === 'online'
                        ? 'Search order ID, customer name or email...'
                        : 'Search receipt ID or product name...'
                    }
                    value={salesSearch}
                    onChange={(e) => {
                      setSalesSearch(e.target.value);
                      setSalesProductsPage(1);
                      setOnlineLedgerPage(1);
                      setOfflineLedgerPage(1);
                    }}
                    style={{
                      width: '100%',
                      background: '#14100d',
                      color: '#f5efe6',
                      border: '1px solid rgba(201, 168, 76, 0.4)',
                      borderRadius: '8px',
                      padding: '8px 12px 8px 36px',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Sub-tab 2 Filters (Online Status & Payment Method) */}
                {salesSubTab === 'online' && (
                  <>
                    <select
                      value={salesOnlineStatus}
                      onChange={(e) => setSalesOnlineStatus(e.target.value)}
                      style={{
                        background: '#14100d',
                        color: '#f5efe6',
                        border: '1px solid rgba(201, 168, 76, 0.4)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="Paid">Paid</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Processing">Processing</option>
                    </select>

                    <select
                      value={salesPaymentMethod}
                      onChange={(e) => setSalesPaymentMethod(e.target.value)}
                      style={{
                        background: '#14100d',
                        color: '#f5efe6',
                        border: '1px solid rgba(201, 168, 76, 0.4)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    >
                      <option value="ALL">All Payment Methods</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                      <option value="COD">Cash on Delivery</option>
                    </select>
                  </>
                )}

                {/* Sub-tab 3 Filter (Offline Payment Method) */}
                {salesSubTab === 'offline' && (
                  <select
                    value={salesPaymentMethod}
                    onChange={(e) => setSalesPaymentMethod(e.target.value)}
                    style={{
                      background: '#14100d',
                      color: '#f5efe6',
                      border: '1px solid rgba(201, 168, 76, 0.4)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    <option value="ALL">All Payment Methods</option>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                  </select>
                )}
              </div>

              {/* Date Filters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="date"
                  value={salesDateFrom}
                  onChange={(e) => setSalesDateFrom(e.target.value)}
                  style={{
                    background: '#14100d',
                    color: '#f5efe6',
                    colorScheme: 'dark',
                    border: '1px solid rgba(201, 168, 76, 0.4)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                />
                <span style={{ color: 'var(--beige)', fontSize: '0.85rem' }}>to</span>
                <input
                  type="date"
                  value={salesDateTo}
                  onChange={(e) => setSalesDateTo(e.target.value)}
                  style={{
                    background: '#14100d',
                    color: '#f5efe6',
                    colorScheme: 'dark',
                    border: '1px solid rgba(201, 168, 76, 0.4)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                />
              </div>
            </div>

            {/* Error Alert State */}
            {salesError && (
              <div
                style={{
                  padding: '16px 20px',
                  background: 'rgba(231, 76, 60, 0.1)',
                  border: '1px solid rgba(231, 76, 60, 0.3)',
                  borderRadius: '10px',
                  color: '#e74c3c',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={20} color="#e74c3c" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{salesError}</span>
                </div>
                <Button variant="secondary" size="sm" onClick={() => fetchSalesData()}>
                  Retry
                </Button>
              </div>
            )}

            {/* Content Loading Skeleton vs Tables */}
            {salesLoading ? (
              <div>
                <DashboardKpiSkeleton />
                <DashboardCardSkeleton height="350px" />
              </div>
            ) : (
              <>
                {/* SUB-TAB 1: PRODUCT PERFORMANCE TABLE */}
                {salesSubTab === 'products' && (
                  <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px', background: 'rgba(15, 12, 10, 0.85)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: '#f5efe6', margin: 0, fontWeight: 700 }}>
                        PRODUCT PERFORMANCE
                      </h3>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: '#f5efe6' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(201, 168, 76, 0.3)', color: '#c9a84c', textAlign: 'left' }}>
                            <th style={{ padding: '12px' }}>PRODUCT NAME</th>
                            <th style={{ padding: '12px' }}>ONLINE UNITS</th>
                            <th style={{ padding: '12px' }}>OFFLINE UNITS</th>
                            <th style={{ padding: '12px' }}>TOTAL UNITS</th>
                            <th style={{ padding: '12px' }}>TOTAL REVENUE</th>
                            <th style={{ padding: '12px' }}>STOCK AVAILABLE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displaySalesProducts.products.length > 0 ? (
                            displaySalesProducts.products.map((prod, i) => (
                              <tr key={prod.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                                <td style={{ padding: '12px', fontWeight: 600 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {prod.image_url ? (
                                      <img
                                        src={getImageUrl(prod.image_url)}
                                        alt={prod.name}
                                        style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(201,168,76,0.3)' }}
                                      />
                                    ) : (
                                      <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c9a84c' }}>
                                        <ShoppingBag size={18} />
                                      </div>
                                    )}
                                    <div>
                                      <div style={{ color: '#f5efe6', fontWeight: 600 }}>{prod.name}</div>
                                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{prod.category_name}</div>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: '12px' }}>{prod.online_units}</td>
                                <td style={{ padding: '12px' }}>{prod.offline_units}</td>
                                <td style={{ padding: '12px', fontWeight: 700 }}>{prod.total_units}</td>
                                <td style={{ padding: '12px', fontWeight: 700, color: '#c9a84c' }}>
                                  ₹{prod.total_revenue.toLocaleString('en-IN')}
                                </td>
                                <td style={{ padding: '12px' }}>
                                  <span style={{ fontWeight: 600, color: prod.stock_available < 10 ? '#e74c3c' : '#2ecc71' }}>
                                    {prod.stock_available}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.5)' }}>
                                No product sales performance records found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ marginTop: '16px' }}>
                      <Pagination
                        currentPage={salesProductsPage}
                        totalPages={Math.ceil(displaySalesProducts.total / salesPageLimit) || 1}
                        totalItems={displaySalesProducts.total}
                        itemsPerPage={salesPageLimit}
                        onPageChange={setSalesProductsPage}
                      />
                    </div>
                  </div>
                )}

                {/* SUB-TAB 2: ONLINE SALES LEDGER */}
                {salesSubTab === 'online' && (
                  <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px', background: 'rgba(15, 12, 10, 0.85)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: '#f5efe6', margin: 0, fontWeight: 700 }}>
                        ONLINE SALES LEDGER
                      </h3>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: '#f5efe6' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(201, 168, 76, 0.3)', color: '#c9a84c', textAlign: 'left' }}>
                            <th style={{ padding: '12px' }}>ORDER ID</th>
                            <th style={{ padding: '12px' }}>DATE</th>
                            <th style={{ padding: '12px' }}>CUSTOMER</th>
                            <th style={{ padding: '12px' }}>PRODUCT</th>
                            <th style={{ padding: '12px' }}>QTY</th>
                            <th style={{ padding: '12px' }}>PAYMENT</th>
                            <th style={{ padding: '12px' }}>AMOUNT</th>
                            <th style={{ padding: '12px' }}>STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayOnlineLedger.items.length > 0 ? (
                            displayOnlineLedger.items.map((item, i) => (
                              <tr key={item.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                                <td style={{ padding: '12px', fontWeight: 700, color: '#c9a84c' }}>{item.order_id}</td>
                                <td style={{ padding: '12px' }}>{item.created_at}</td>
                                <td style={{ padding: '12px' }}>
                                  <div style={{ fontWeight: 600, color: '#f5efe6' }}>{item.customer_name}</div>
                                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>{item.customer_email}</div>
                                </td>
                                <td style={{ padding: '12px', maxWidth: '200px' }}>{item.product_summary}</td>
                                <td style={{ padding: '12px', fontWeight: 600 }}>{item.quantity}</td>
                                <td style={{ padding: '12px' }}>{item.payment_method}</td>
                                <td style={{ padding: '12px', fontWeight: 700, color: '#c9a84c' }}>₹{item.amount.toLocaleString('en-IN')}</td>
                                <td style={{ padding: '12px' }}>
                                  <span style={{
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    background: item.order_status === 'Delivered' ? 'rgba(46, 204, 113, 0.15)' : item.order_status === 'Paid' ? 'rgba(52, 152, 219, 0.15)' : 'rgba(201, 168, 76, 0.15)',
                                    color: item.order_status === 'Delivered' ? '#2ecc71' : item.order_status === 'Paid' ? '#3498db' : '#c9a84c',
                                  }}>
                                    {item.order_status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.5)' }}>
                                No online sales ledger records found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ marginTop: '16px' }}>
                      <Pagination
                        currentPage={onlineLedgerPage}
                        totalPages={Math.ceil(displayOnlineLedger.total / salesPageLimit) || 1}
                        totalItems={displayOnlineLedger.total}
                        itemsPerPage={salesPageLimit}
                        onPageChange={setOnlineLedgerPage}
                      />
                    </div>
                  </div>
                )}

                {/* SUB-TAB 3: OFFLINE SALES LEDGER */}
                {salesSubTab === 'offline' && (
                  <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px', background: 'rgba(15, 12, 10, 0.85)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: '#f5efe6', margin: 0, fontWeight: 700 }}>
                        OFFLINE SALES LEDGER
                      </h3>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: '#f5efe6' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(201, 168, 76, 0.3)', color: '#c9a84c', textAlign: 'left' }}>
                            <th style={{ padding: '12px' }}>RECEIPT ID</th>
                            <th style={{ padding: '12px' }}>DATE</th>
                            <th style={{ padding: '12px' }}>PRODUCT NAME</th>
                            <th style={{ padding: '12px' }}>QTY</th>
                            <th style={{ padding: '12px' }}>PAYMENT METHOD</th>
                            <th style={{ padding: '12px' }}>AMOUNT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayOfflineLedger.items.length > 0 ? (
                            displayOfflineLedger.items.map((item: any, i: number) => (
                              <tr key={item.id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                                <td style={{ padding: '12px', fontWeight: 700, color: '#c9a84c' }}>{item.receipt_id}</td>
                                <td style={{ padding: '12px' }}>{item.created_at}</td>
                                <td style={{ padding: '12px', fontWeight: 600 }}>{item.product_name}</td>
                                <td style={{ padding: '12px', fontWeight: 600 }}>{item.quantity}</td>
                                <td style={{ padding: '12px' }}>{item.payment_method}</td>
                                <td style={{ padding: '12px', fontWeight: 700, color: '#c9a84c' }}>₹{item.amount.toLocaleString('en-IN')}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.5)' }}>
                                No offline sales ledger records found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ marginTop: '16px' }}>
                      <Pagination
                        currentPage={offlineLedgerPage}
                        totalPages={Math.ceil(displayOfflineLedger.total / salesPageLimit) || 1}
                        totalItems={displayOfflineLedger.total}
                        itemsPerPage={salesPageLimit}
                        onPageChange={setOfflineLedgerPage}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ADMIN MANAGEMENT TAB */}
        {activeTab === 'admin-mgmt' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#f5efe6', margin: '0 0 6px 0', fontWeight: 700 }}>
                  Manage Administrators
                </h1>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.65)' }}>
                  Create and manage administrator accounts
                </p>
              </div>

              <Button
                variant="gold"
                glow
                onClick={() => setIsRegisterOpen(!isRegisterOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {isRegisterOpen ? <X size={16} /> : <UserPlus size={16} />}
                {isRegisterOpen ? 'Close Form' : '+ Register Administrator'}
              </Button>
            </div>

            {/* Expandable Register Administrator Form */}
            <AnimatePresence>
              {isRegisterOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="admin-form-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: '#c9a84c', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                        <UserPlus size={18} /> Register New Administrator Account
                      </h3>
                      <button
                        onClick={() => setIsRegisterOpen(false)}
                        style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <X size={18} />
                      </button>
                    </div>

                    {regFormError && (
                      <div
                        style={{
                          background: 'rgba(231, 76, 60, 0.15)',
                          border: '1px solid #e74c3c',
                          color: '#e74c3c',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          fontSize: '0.85rem',
                          marginBottom: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <AlertTriangle size={16} /> {regFormError}
                      </div>
                    )}

                    <form onSubmit={handleRegisterAdminSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: false ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
                        <Input
                          label="Full Name *"
                          required
                          placeholder="e.g. Ramesh Kumar"
                          value={regFullName}
                          onChange={(e) => setRegFullName(e.target.value)}
                        />
                        <Input
                          label="Email Address *"
                          type="email"
                          required
                          placeholder="e.g. ramesh@gmail.com"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                        />
                        <Input
                          label="Phone Number *"
                          type="tel"
                          required
                          placeholder="e.g. +91 98765 43210"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: false ? '1fr' : 'repeat(4, 1fr)', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '0.75rem', color: 'rgba(245, 230, 211, 0.75)', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 600 }}>
                            Role *
                          </label>
                          <select
                            value={regRole}
                            onChange={(e) => setRegRole(e.target.value)}
                            style={{
                              background: '#14100d',
                              color: '#f5efe6',
                              border: '1px solid rgba(201, 168, 76, 0.4)',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              fontSize: '0.88rem',
                              outline: 'none',
                            }}
                          >
                            <option value="admin">Admin</option>
                            <option value="superadmin">Super Admin</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '0.75rem', color: 'rgba(245, 230, 211, 0.75)', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 600 }}>
                            Status *
                          </label>
                          <select
                            value={regStatus}
                            onChange={(e) => setRegStatus(e.target.value)}
                            style={{
                              background: '#14100d',
                              color: '#f5efe6',
                              border: '1px solid rgba(201, 168, 76, 0.4)',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              fontSize: '0.88rem',
                              outline: 'none',
                            }}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>

                        <Input
                          label="Password *"
                          type="password"
                          required
                          placeholder="Min. 8 chars (A-Z, 0-9, !@#)"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                        />
                        <Input
                          label="Confirm Password *"
                          type="password"
                          required
                          placeholder="Repeat password"
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                        <Button variant="secondary" type="button" onClick={() => setIsRegisterOpen(false)}>
                          Cancel
                        </Button>
                        <Button variant="gold" type="submit" glow disabled={regSubmitting}>
                          {regSubmitting ? 'Registering...' : 'Submit Administrator'}
                        </Button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Modal: Edit Administrator */}
            <AnimatePresence>
              {editingAdmin && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{ marginBottom: '24px' }}
                >
                  <div className="admin-form-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: '#c9a84c', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                        <Edit3 size={18} /> Edit Administrator Profile — {editingAdmin.full_name}
                      </h3>
                      <button onClick={() => setEditingAdmin(null)} style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={18} />
                      </button>
                    </div>

                    {editFormError && (
                      <div style={{ background: 'rgba(231, 76, 60, 0.15)', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={16} /> {editFormError}
                      </div>
                    )}

                    <form onSubmit={handleEditAdminSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: false ? '1fr' : 'repeat(3, 1fr)', gap: '16px' }}>
                        <Input label="Full Name" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} required />
                        <Input label="Email Address" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
                        <Input label="Phone Number" type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+91 98765 43210" />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: false ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '0.75rem', color: 'rgba(245, 230, 211, 0.75)', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 600 }}>Role</label>
                          <select
                            value={editRole}
                            onChange={(e) => setEditRole(e.target.value)}
                            style={{ background: '#14100d', color: '#f5efe6', border: '1px solid rgba(201, 168, 76, 0.4)', borderRadius: '6px', padding: '8px 12px', fontSize: '0.88rem', outline: 'none' }}
                          >
                            <option value="admin">Admin</option>
                            <option value="superadmin">Super Admin</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <label style={{ fontSize: '0.75rem', color: 'rgba(245, 230, 211, 0.75)', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 600 }}>Status</label>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            style={{ background: '#14100d', color: '#f5efe6', border: '1px solid rgba(201, 168, 76, 0.4)', borderRadius: '6px', padding: '8px 12px', fontSize: '0.88rem', outline: 'none' }}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <Button variant="secondary" type="button" onClick={() => setEditingAdmin(null)}>Cancel</Button>
                        <Button variant="gold" type="submit" glow disabled={editSubmitting}>{editSubmitting ? 'Saving...' : 'Save Changes'}</Button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>



            {/* Toolbar: Search & Filters */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                marginBottom: '24px',
                flexWrap: 'wrap',
                background: 'rgba(20, 16, 13, 0.85)',
                padding: '12px 18px',
                borderRadius: '10px',
                border: '1px solid rgba(201, 168, 76, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '240px' }}>
                <Search size={18} color="#c9a84c" />
                <input
                  type="text"
                  placeholder="Search administrator name, email or phone..."
                  value={adminsSearch}
                  onChange={(e) => {
                    setAdminsSearch(e.target.value);
                    setAdminsPage(1);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#f5efe6',
                    fontSize: '0.88rem',
                    width: '100%',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <select
                  value={adminsRoleFilter}
                  onChange={(e) => {
                    setAdminsRoleFilter(e.target.value);
                    setAdminsPage(1);
                  }}
                  style={{
                    background: '#14100d',
                    color: '#f5efe6',
                    border: '1px solid rgba(201, 168, 76, 0.4)',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="ALL">All Roles</option>
                  <option value="superadmin">Super Admin</option>
                  <option value="admin">Admin</option>
                </select>

                <select
                  value={adminsStatusFilter}
                  onChange={(e) => {
                    setAdminsStatusFilter(e.target.value);
                    setAdminsPage(1);
                  }}
                  style={{
                    background: '#14100d',
                    color: '#f5efe6',
                    border: '1px solid rgba(201, 168, 76, 0.4)',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="ALL">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Error Alert */}
            {adminsError && (
              <div
                style={{
                  padding: '14px 18px',
                  background: 'rgba(231, 76, 60, 0.1)',
                  border: '1px solid rgba(231, 76, 60, 0.3)',
                  borderRadius: '10px',
                  color: '#e74c3c',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={20} color="#e74c3c" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{adminsError}</span>
                </div>
                <Button variant="secondary" size="sm" onClick={() => fetchAdmins()}>Retry</Button>
              </div>
            )}

            {/* Main Administrators Datatable */}
            {adminsLoading ? (
              <DashboardCardSkeleton height="350px" />
            ) : (
              <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px', background: 'rgba(15, 12, 10, 0.85)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', color: '#f5efe6' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(201, 168, 76, 0.3)', color: '#c9a84c', textAlign: 'left' }}>
                        <th style={{ padding: '12px' }}>NAME</th>
                        <th style={{ padding: '12px' }}>EMAIL</th>
                        <th style={{ padding: '12px' }}>ROLE</th>
                        <th style={{ padding: '12px' }}>STATUS</th>
                        <th style={{ padding: '12px' }}>CREATED DATE</th>
                        <th style={{ padding: '12px' }}>LAST LOGIN</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayAdmins.items.length > 0 ? (
                        displayAdmins.items.map((adm, idx) => (
                          <tr key={adm.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                            <td style={{ padding: '12px', fontWeight: 600, color: '#f5efe6' }}>
                              {adm.full_name}
                            </td>
                            <td style={{ padding: '12px', color: 'rgba(255,255,255,0.75)' }}>
                              {adm.email}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  background: adm.role === 'superadmin' ? 'rgba(201, 168, 76, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                                  color: adm.role === 'superadmin' ? '#c9a84c' : 'rgba(255, 255, 255, 0.8)',
                                  border: adm.role === 'superadmin' ? '1px solid rgba(201, 168, 76, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
                                }}
                              >
                                {adm.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                              </span>
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: adm.is_active ? '#2ecc71' : '#e74c3c',
                                  fontSize: '0.85rem',
                                }}
                              >
                                {adm.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td style={{ padding: '12px', color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem' }}>
                              {adm.created_at || '—'}
                            </td>
                            <td style={{ padding: '12px', color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem' }}>
                              {adm.last_login_at || 'Never'}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
                                {/* Edit */}
                                <button
                                  onClick={() => handleEditAdminOpen(adm)}
                                  title="Edit Administrator"
                                  style={{
                                    background: 'rgba(201, 168, 76, 0.1)',
                                    border: '1px solid rgba(201, 168, 76, 0.3)',
                                    color: '#c9a84c',
                                    borderRadius: '6px',
                                    padding: '6px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Edit3 size={15} />
                                </button>

                                {/* Toggle Status */}
                                <button
                                  onClick={() => handleToggleAdminStatus(adm)}
                                  title={adm.is_active ? 'Deactivate Account' : 'Activate Account'}
                                  style={{
                                    background: adm.is_active ? 'rgba(231, 76, 60, 0.1)' : 'rgba(46, 204, 113, 0.1)',
                                    border: adm.is_active ? '1px solid rgba(231, 76, 60, 0.3)' : '1px solid rgba(46, 204, 113, 0.3)',
                                    color: adm.is_active ? '#e74c3c' : '#2ecc71',
                                    borderRadius: '6px',
                                    padding: '6px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Power size={15} />
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={() => handleDeleteAdmin(adm)}
                                  title="Delete Account"
                                  style={{
                                    background: 'rgba(231, 76, 60, 0.15)',
                                    border: '1px solid rgba(231, 76, 60, 0.4)',
                                    color: '#e74c3c',
                                    borderRadius: '6px',
                                    padding: '6px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.5)' }}>
                            No administrators found matching criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <Pagination
                    currentPage={adminsPage}
                    totalPages={Math.ceil(displayAdmins.total / adminsLimit) || 1}
                    totalItems={displayAdmins.total}
                    itemsPerPage={adminsLimit}
                    onPageChange={setAdminsPage}
                  />
                </div>
              </div>
            )}
          </div>
        )}



        {/* AUDIT LOGS TAB */}
        {activeTab === 'audit-logs' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#f5efe6', margin: '0 0 6px 0', fontWeight: 700 }}>
                  Audit Logs
                </h1>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.65)' }}>
                  Track all system and administrator activities
                </p>
              </div>

              <Button
                variant="gold"
                glow
                onClick={handleExportAuditLogsCsv}
                disabled={auditExporting}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Download size={16} />
                {auditExporting ? 'Exporting...' : 'Export Audit Logs (CSV)'}
              </Button>
            </div>

            {/* Filters Toolbar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '24px',
                flexWrap: 'wrap',
                background: 'rgba(20, 16, 13, 0.85)',
                padding: '14px 18px',
                borderRadius: '10px',
                border: '1px solid rgba(201, 168, 76, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
                {/* Search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#14100d', border: '1px solid rgba(201, 168, 76, 0.4)', borderRadius: '6px', padding: '6px 12px', minWidth: '220px' }}>
                  <Search size={16} color="#c9a84c" />
                  <input
                    type="text"
                    placeholder="Search user, action, details..."
                    value={auditSearch}
                    onChange={(e) => {
                      setAuditSearch(e.target.value);
                      setAuditPage(1);
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#f5efe6', fontSize: '0.82rem', width: '100%', outline: 'none' }}
                  />
                </div>

                {/* Action Filter */}
                <select
                  value={auditActionFilter}
                  onChange={(e) => { setAuditActionFilter(e.target.value); setAuditPage(1); }}
                  style={{ background: '#14100d', color: '#f5efe6', border: '1px solid rgba(201, 168, 76, 0.4)', borderRadius: '6px', padding: '6px 12px', fontSize: '0.82rem', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="ALL">All Actions</option>
                  <option value="Login">Login</option>
                  <option value="Logout">Logout</option>
                  <option value="Created Product">Created Product</option>
                  <option value="Updated Product">Updated Product</option>
                  <option value="Deleted Product">Deleted Product</option>
                  <option value="Updated Order Status">Updated Order Status</option>
                  <option value="Created Coupon">Created Coupon</option>
                  <option value="Updated Coupon">Updated Coupon</option>
                  <option value="Changed Settings">Changed Settings</option>
                  <option value="CREATE_ADMIN">Registered Admin</option>
                  <option value="DELETE_ADMIN">Deleted Admin</option>
                  <option value="Offline Sale Recorded">Offline Sale Recorded</option>
                </select>

                {/* User Filter */}
                <select
                  value={auditUserId}
                  onChange={(e) => { setAuditUserId(e.target.value); setAuditPage(1); }}
                  style={{ background: '#14100d', color: '#f5efe6', border: '1px solid rgba(201, 168, 76, 0.4)', borderRadius: '6px', padding: '6px 12px', fontSize: '0.82rem', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="ALL">All Users</option>
                  {displayAdmins.items.map((u) => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={auditStatusFilter}
                  onChange={(e) => { setAuditStatusFilter(e.target.value); setAuditPage(1); }}
                  style={{ background: '#14100d', color: '#f5efe6', border: '1px solid rgba(201, 168, 76, 0.4)', borderRadius: '6px', padding: '6px 12px', fontSize: '0.82rem', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="ALL">All Status</option>
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="FAILURE">FAILURE</option>
                  <option value="DENIED">DENIED</option>
                </select>

                {/* Date Range */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={15} color="#c9a84c" />
                  <input
                    type="date"
                    value={auditDateFrom}
                    onChange={(e) => { setAuditDateFrom(e.target.value); setAuditPage(1); }}
                    style={{ background: '#14100d', color: '#f5efe6', colorScheme: 'dark', border: '1px solid rgba(201, 168, 76, 0.4)', borderRadius: '6px', padding: '5px 8px', fontSize: '0.8rem', cursor: 'pointer' }}
                  />
                  <span style={{ color: 'var(--beige)', fontSize: '0.8rem' }}>to</span>
                  <input
                    type="date"
                    value={auditDateTo}
                    onChange={(e) => { setAuditDateTo(e.target.value); setAuditPage(1); }}
                    style={{ background: '#14100d', color: '#f5efe6', colorScheme: 'dark', border: '1px solid rgba(201, 168, 76, 0.4)', borderRadius: '6px', padding: '5px 8px', fontSize: '0.8rem', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <Button variant="secondary" size="sm" onClick={handleClearAuditFilters}>
                Clear Filters
              </Button>
            </div>

            {/* Error Alert State */}
            {auditLogsError && (
              <div
                style={{
                  padding: '14px 18px',
                  background: 'rgba(231, 76, 60, 0.1)',
                  border: '1px solid rgba(231, 76, 60, 0.3)',
                  borderRadius: '10px',
                  color: '#e74c3c',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={20} color="#e74c3c" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{auditLogsError}</span>
                </div>
                <Button variant="secondary" size="sm" onClick={() => fetchAuditLogs()}>Retry</Button>
              </div>
            )}

            {/* Production View Details Modal */}
            <AuditLogDetailModal
              logId={selectedAuditLog?.id || null}
              initialLog={selectedAuditLog}
              onClose={() => setSelectedAuditLog(null)}
              role="superadmin"
            />

            {/* Main Audit Logs Datatable */}
            {auditLogsLoading ? (
              <DashboardCardSkeleton height="350px" />
            ) : (
              <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px', background: 'rgba(15, 12, 10, 0.85)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', color: '#f5efe6' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(201, 168, 76, 0.3)', color: '#c9a84c', textAlign: 'left' }}>
                        <th style={{ padding: '12px' }}>DATE & TIME</th>
                        <th style={{ padding: '12px' }}>USER</th>
                        <th style={{ padding: '12px' }}>ROLE</th>
                        <th style={{ padding: '12px' }}>ACTION</th>
                        <th style={{ padding: '12px' }}>STATUS</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>DETAILS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayAuditLogs.items.length > 0 ? (
                        displayAuditLogs.items.map((log, idx) => (
                          <tr
                            key={log.id || idx}
                            onClick={() => setSelectedAuditLog(log)}
                            style={{
                              borderBottom: '1px solid rgba(255,255,255,0.05)',
                              background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
                              cursor: 'pointer',
                            }}
                          >
                            <td style={{ padding: '12px', color: 'rgba(255,255,255,0.8)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                              {log.created_at}
                            </td>
                            <td style={{ padding: '12px', fontWeight: 600, color: '#f5efe6' }}>
                              {log.user_name && log.user_name !== 'System Process' ? log.user_name : 'Enterprise Chief'}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  background: log.user_role === 'superadmin' ? 'rgba(201, 168, 76, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                                  color: log.user_role === 'superadmin' ? '#c9a84c' : 'rgba(255, 255, 255, 0.8)',
                                  border: log.user_role === 'superadmin' ? '1px solid rgba(201, 168, 76, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                                }}
                              >
                                {log.user_role === 'superadmin' ? 'Super Admin' : log.user_role === 'admin' ? 'Admin' : 'Super Admin'}
                              </span>
                            </td>
                            <td style={{ padding: '12px', fontWeight: 600, color: '#f5efe6' }}>
                              {formatActionLabel(log.action)}
                            </td>
                            <td style={{ padding: '12px' }}>
                              <span
                                style={{
                                  fontWeight: 700,
                                  fontSize: '0.82rem',
                                  color: log.status === 'SUCCESS' ? '#2ecc71' : log.status === 'DENIED' ? '#e67e22' : '#e74c3c',
                                }}
                              >
                                {log.status}
                              </span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAuditLog(log);
                                }}
                                style={{
                                  background: 'rgba(201, 168, 76, 0.1)',
                                  border: '1px solid rgba(201, 168, 76, 0.3)',
                                  color: '#c9a84c',
                                  borderRadius: '6px',
                                  padding: '4px 10px',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.5)' }}>
                            No audit log records found matching search filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '20px' }}>
                  <Pagination
                    currentPage={auditPage}
                    totalPages={Math.ceil(displayAuditLogs.total / auditLimit) || 1}
                    totalItems={displayAuditLogs.total}
                    itemsPerPage={auditLimit}
                    onPageChange={setAuditPage}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* THEME BUILDER TAB */}
        {activeTab === 'theme-builder' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#f5efe6', margin: '0 0 6px 0', fontWeight: 700 }}>
                Theme Builder
              </h1>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.65)' }}>
                Customize the look & feel of your website
              </p>
            </div>

            {/* Error Alert */}
            {themesError && (
              <div
                style={{
                  padding: '14px 18px',
                  background: 'rgba(231, 76, 60, 0.1)',
                  border: '1px solid rgba(231, 76, 60, 0.3)',
                  borderRadius: '10px',
                  color: '#e74c3c',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle size={20} color="#e74c3c" />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{themesError}</span>
                </div>
                <Button variant="secondary" size="sm" onClick={() => fetchThemes()}>Retry</Button>
              </div>
            )}

            {themesLoading ? (
              <DashboardCardSkeleton height="450px" />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: false ? '1fr' : '1.1fr 1fr 1fr', gap: '24px', alignItems: 'flex-start' }}>
                
                {/* 1. THEME PRESETS */}
                <div className="glass-panel" style={{ padding: '22px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px', background: 'rgba(15, 12, 10, 0.85)' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: '#c9a84c', margin: '0 0 6px 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    THEME PRESETS
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', margin: '0 0 18px 0' }}>
                    Click a theme to preview, then apply it live across all pages.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '18px' }}>
                    {displayThemes.items.map((preset) => {
                      const isSelected = selectedThemeId === preset.id;
                      const isActive = activeThemeId === preset.id;
                      return (
                        <div
                          key={preset.id}
                          onClick={() => handleSelectPreset(preset)}
                          style={{
                            borderRadius: '10px',
                            border: isSelected ? '2px solid #c9a84c' : '1px solid rgba(255,255,255,0.12)',
                            background: isSelected ? 'rgba(201, 168, 76, 0.12)' : 'rgba(0,0,0,0.3)',
                            padding: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.25s ease',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            minHeight: '180px',
                          }}
                        >
                          {/* Active / Selected Badge */}
                          {isSelected && (
                            <div style={{
                              position: 'absolute',
                              top: '8px',
                              right: '8px',
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              background: '#c9a84c',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <Check size={14} color="#14100d" />
                            </div>
                          )}

                          {/* Preset Miniature Visual Mockup */}
                          <div style={{
                            background: preset.background_color,
                            borderRadius: '6px',
                            padding: '12px',
                            border: `1px solid ${preset.surface_color}`,
                            marginBottom: '10px',
                            textAlign: 'center',
                          }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: preset.luxury_gold_color, letterSpacing: '1px', display: 'block' }}>
                              CHOVIQUE
                            </span>
                            <span style={{ fontSize: '0.55rem', color: preset.text_color, display: 'block', opacity: 0.7, margin: '2px 0 6px 0' }}>
                              Premium Handmade Chocolates
                            </span>
                            <div style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              fontSize: '0.55rem',
                              fontWeight: 700,
                              background: preset.luxury_gold_color,
                              color: preset.background_color,
                              borderRadius: '3px',
                            }}>
                              SHOP NOW
                            </div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: '#f5efe6', margin: 0, fontWeight: 700 }}>
                                {preset.name}
                              </h4>
                              {isActive && (
                                <span style={{ fontSize: '0.65rem', color: '#2ecc71', fontWeight: 700 }}>[Active]</span>
                              )}
                            </div>
                            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', margin: '4px 0 0 0', lineHeight: 1.3 }}>
                              {preset.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add New Theme Button */}
                  <button
                    onClick={() => setShowSaveModal(true)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px dashed rgba(201, 168, 76, 0.5)',
                      background: 'rgba(201, 168, 76, 0.05)',
                      color: '#c9a84c',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Plus size={16} /> + Add New Theme
                  </button>
                </div>

                {/* 2. MANUAL COLOR CUSTOMIZATION */}
                <div className="glass-panel" style={{ padding: '22px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px', background: 'rgba(15, 12, 10, 0.85)' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: '#c9a84c', margin: '0 0 6px 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    MANUAL COLOR CUSTOMIZATION
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', margin: '0 0 18px 0' }}>
                    Fine-tune individual colors. Changes apply across all pages instantly.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { key: 'primary_brand_color' as const, label: 'Primary Brand Brown' },
                      { key: 'background_color' as const, label: 'Chocolate Background Dark' },
                      { key: 'luxury_gold_color' as const, label: 'Signature Luxury Gold' },
                      { key: 'secondary_accent_color' as const, label: 'Rose Gold Accent' },
                      { key: 'text_color' as const, label: 'Text Color' },
                      { key: 'surface_color' as const, label: 'Card / Surface Color' },
                    ].map((field) => {
                      const val = customColors[field.key];
                      const valid = isValidHex(val);
                      return (
                        <div key={field.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                          <span style={{ fontSize: '0.82rem', color: '#f5efe6', fontWeight: 500, flex: 1 }}>{field.label}</span>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="text"
                              value={val}
                              onChange={(e) => setCustomColors({ ...customColors, [field.key]: e.target.value })}
                              style={{
                                width: '78px',
                                background: '#14100d',
                                border: valid ? '1px solid rgba(201, 168, 76, 0.4)' : '1px solid #e74c3c',
                                borderRadius: '4px',
                                color: '#f5efe6',
                                padding: '4px 6px',
                                fontSize: '0.78rem',
                                fontFamily: 'monospace',
                                textAlign: 'center',
                                outline: 'none',
                              }}
                            />
                            <input
                              type="color"
                              value={valid ? val : '#000000'}
                              onChange={(e) => setCustomColors({ ...customColors, [field.key]: e.target.value.toUpperCase() })}
                              style={{
                                width: '32px',
                                height: '30px',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '4px',
                                background: 'transparent',
                                cursor: 'pointer',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!isFormValid && (
                    <span style={{ fontSize: '0.75rem', color: '#e74c3c', marginTop: '10px', display: 'block', fontWeight: 600 }}>
                      * All fields require valid HEX colors (e.g. #D4AF37).
                    </span>
                  )}
                </div>

                {/* 3. LIVE PREVIEW */}
                <div className="glass-panel" style={{ padding: '22px', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px', background: 'rgba(15, 12, 10, 0.85)' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: '#c9a84c', margin: '0 0 6px 0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    LIVE PREVIEW
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', margin: '0 0 14px 0' }}>
                    Preview updates instantly. Click Apply to publish.
                  </p>

                  {/* Realtime Storefront Mini Canvas */}
                  <div style={{
                    background: isValidHex(customColors.background_color) ? customColors.background_color : '#0D090A',
                    color: isValidHex(customColors.text_color) ? customColors.text_color : '#F7F7F7',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '16px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 800, color: isValidHex(customColors.luxury_gold_color) ? customColors.luxury_gold_color : '#D4AF37', letterSpacing: '1px' }}>
                        CHOVIQUE
                      </span>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '0.62rem', fontWeight: 600, color: isValidHex(customColors.text_color) ? customColors.text_color : '#F7F7F7', opacity: 0.8 }}>
                        <span>HOME</span>
                        <span>SHOP</span>
                        <span>OUR STORY</span>
                        <span>CONTACT</span>
                      </div>
                    </div>

                    {/* Hero Box */}
                    <div style={{
                      background: isValidHex(customColors.surface_color) ? customColors.surface_color : '#1A1716',
                      borderRadius: '6px',
                      padding: '14px',
                      marginBottom: '12px',
                      border: `1px solid ${isValidHex(customColors.secondary_accent_color) ? customColors.secondary_accent_color : '#B76E79'}`,
                    }}>
                      <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.92rem', color: isValidHex(customColors.text_color) ? customColors.text_color : '#F7F7F7', margin: '0 0 4px 0', lineHeight: 1.2 }}>
                        Premium Handmade Chocolates
                      </h4>
                      <p style={{ fontSize: '0.65rem', margin: '0 0 10px 0', opacity: 0.7 }}>
                        Crafted with Passion, Delivered with Love.
                      </p>
                      <button style={{
                        padding: '4px 10px',
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        background: isValidHex(customColors.luxury_gold_color) ? customColors.luxury_gold_color : '#D4AF37',
                        color: isValidHex(customColors.background_color) ? customColors.background_color : '#0D090A',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                      }}>
                        SHOP NOW
                      </button>
                    </div>

                    {/* Product Card Mini */}
                    <div style={{
                      background: isValidHex(customColors.surface_color) ? customColors.surface_color : '#1A1716',
                      borderRadius: '6px',
                      padding: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, display: 'block' }}>Artisanal Truffle Box</span>
                        <span style={{ fontSize: '0.65rem', color: isValidHex(customColors.luxury_gold_color) ? customColors.luxury_gold_color : '#D4AF37', fontWeight: 700 }}>₹1,490</span>
                      </div>
                      <button style={{
                        padding: '3px 8px',
                        fontSize: '0.58rem',
                        fontWeight: 700,
                        background: isValidHex(customColors.primary_brand_color) ? customColors.primary_brand_color : '#5A3825',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '3px',
                      }}>
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginTop: '24px' }}>
              <Button variant="secondary" onClick={handleResetDefaults} disabled={isResettingTheme}>
                <RotateCcw size={16} style={{ marginRight: '6px' }} />
                {isResettingTheme ? 'Resetting...' : 'Reset Defaults'}
              </Button>
              <Button variant="gold" glow onClick={handleApplyTheme} disabled={!isFormValid || isApplyingTheme}>
                <Check size={16} style={{ marginRight: '6px' }} />
                {isApplyingTheme ? 'Applying...' : 'Apply Live Palettes'}
              </Button>
            </div>

            {/* Save Custom Theme Modal */}
            <AnimatePresence>
              {showSaveModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.85)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    style={{
                      background: 'rgba(20, 16, 13, 0.95)',
                      border: '1px solid rgba(201, 168, 76, 0.5)',
                      borderRadius: '12px',
                      padding: '24px',
                      maxWidth: '440px',
                      width: '100%',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: '#c9a84c', margin: 0, fontWeight: 700 }}>
                        Save Custom Theme Preset
                      </h3>
                      <button onClick={() => setShowSaveModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                        <X size={18} />
                      </button>
                    </div>

                    <form onSubmit={handleSaveCustomThemeSubmit}>
                      <Input
                        label="Theme Name *"
                        placeholder="e.g. Royal Gold Edition"
                        value={customThemeForm.name}
                        onChange={(e) => setCustomThemeForm({ ...customThemeForm, name: e.target.value })}
                        required
                      />
                      <Input
                        label="Description"
                        placeholder="Short description of this palette..."
                        value={customThemeForm.description}
                        onChange={(e) => setCustomThemeForm({ ...customThemeForm, description: e.target.value })}
                      />

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                        <Button variant="secondary" size="sm" type="button" onClick={() => setShowSaveModal(false)}>
                          Cancel
                        </Button>
                        <Button variant="gold" size="sm" type="submit" disabled={isSavingCustomTheme}>
                          {isSavingCustomTheme ? 'Saving...' : 'Save Theme'}
                        </Button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}





        {/* PLATFORM SETTINGS TAB */}
        {activeTab === 'platform-settings' && (
          <div>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#f5efe6', margin: '0 0 6px 0', fontWeight: 700 }}>
                Platform Settings
              </h1>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)' }}>
                Configure global settings for the Chovique store.
              </p>
            </div>

            {/* Maintenance Mode Warning Banner */}
            {psForm.maintenance_mode && (
              <div style={{
                padding: '14px 18px',
                background: 'rgba(231, 76, 60, 0.12)',
                border: '1px solid rgba(231, 76, 60, 0.5)',
                borderRadius: '10px',
                color: '#e74c3c',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontWeight: 600,
                fontSize: '0.88rem',
              }}>
                <AlertTriangle size={20} />
                ⚠️ Maintenance Mode is ACTIVE — The storefront is currently offline for all customers.
              </div>
            )}

            {/* Unsaved Changes Warning */}
            {psHasChanges && (
              <div style={{
                padding: '10px 16px',
                background: 'rgba(241, 196, 15, 0.08)',
                border: '1px solid rgba(241, 196, 15, 0.35)',
                borderRadius: '8px',
                color: '#f1c40f',
                marginBottom: '16px',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <Info size={15} /> You have unsaved changes.
              </div>
            )}

            {/* Sub-Tabs */}
            <div style={{
              display: 'flex',
              gap: '0',
              borderBottom: '1px solid rgba(201, 168, 76, 0.2)',
              marginBottom: '28px',
              overflowX: 'auto',
            }}>
              {[
                { id: 'payment', label: 'Payment & Shipping' },
                { id: 'customer-order', label: 'Customer & Order Settings' },
                { id: 'system', label: 'System & Security' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setPsActiveTab(t.id as any)}
                  style={{
                    padding: '10px 20px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: 'none',
                    border: 'none',
                    borderBottom: psActiveTab === t.id ? '2px solid #c9a84c' : '2px solid transparent',
                    color: psActiveTab === t.id ? '#c9a84c' : 'rgba(255,255,255,0.55)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {psLoading ? (
              <DashboardCardSkeleton height="400px" />
            ) : (
              <form onSubmit={handleSavePlatformSettings}>
                {/* ── TAB 1: Payment & Shipping ── */}
                {psActiveTab === 'payment' && (
                  <div style={{ display: 'grid', gridTemplateColumns: false ? '1fr' : '1fr 1fr', gap: '28px' }}>
                    <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(201, 168, 76, 0.2)', borderRadius: '12px', background: 'rgba(15, 12, 10, 0.85)' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: '#c9a84c', margin: '0 0 18px 0', fontWeight: 700 }}>
                        Payment Settings
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div>
                            <span style={{ color: '#f5efe6', fontWeight: 600, fontSize: '0.88rem', display: 'block' }}>Enable COD Payments</span>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Allow Cash on Delivery for orders</span>
                          </div>
                          <input type="checkbox" checked={psForm.cod_enabled} onChange={(e) => updatePsField('cod_enabled', e.target.checked)} style={{ accentColor: '#c9a84c', width: '18px', height: '18px', cursor: 'pointer' }} />
                        </div>
                        <div>
                          <Input label="Tax Rate (GST %)" type="number" value={psForm.gst_rate} onChange={(e) => updatePsField('gst_rate', parseFloat(e.target.value) || 0)} />
                          {psErrors.gst_rate && <span style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{psErrors.gst_rate}</span>}
                        </div>
                        <div>
                          <Input label="Platform Fee (₹)" type="number" value={psForm.platform_fee} onChange={(e) => updatePsField('platform_fee', parseFloat(e.target.value) || 0)} />
                          {psErrors.platform_fee && <span style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{psErrors.platform_fee}</span>}
                        </div>
                        {psForm.cod_enabled && (
                          <div>
                            <Input label="Maximum COD Order Value (₹)" type="number" value={psForm.maximum_cod_order_value} onChange={(e) => updatePsField('maximum_cod_order_value', parseFloat(e.target.value) || 0)} />
                            {psErrors.maximum_cod_order_value && <span style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{psErrors.maximum_cod_order_value}</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(201, 168, 76, 0.2)', borderRadius: '12px', background: 'rgba(15, 12, 10, 0.85)' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: '#c9a84c', margin: '0 0 18px 0', fontWeight: 700 }}>
                        Shipping Settings
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <Input label="Standard Shipping Charge (₹)" type="number" value={psForm.standard_shipping_charge} onChange={(e) => updatePsField('standard_shipping_charge', parseFloat(e.target.value) || 0)} />
                          {psErrors.standard_shipping_charge && <span style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{psErrors.standard_shipping_charge}</span>}
                        </div>
                        <div>
                          <Input label="Minimum Order for Free Shipping (₹)" type="number" value={psForm.free_shipping_min_order} onChange={(e) => updatePsField('free_shipping_min_order', parseFloat(e.target.value) || 0)} />
                          {psErrors.free_shipping_min_order && <span style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{psErrors.free_shipping_min_order}</span>}
                          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', margin: '6px 0 0 0', lineHeight: 1.4 }}>
                            Orders above this amount qualify for free shipping.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 3: Customer & Order Settings ── */}
                {psActiveTab === 'customer-order' && (
                  <div style={{ display: 'grid', gridTemplateColumns: false ? '1fr' : '1fr 1fr', gap: '28px' }}>
                    <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(201, 168, 76, 0.2)', borderRadius: '12px', background: 'rgba(15, 12, 10, 0.85)' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: '#c9a84c', margin: '0 0 18px 0', fontWeight: 700 }}>
                        Customer Settings
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                          { key: 'customer_registration_enabled', label: 'Allow Customer Registration', desc: 'Allow new customers to sign up' },
                          { key: 'guest_checkout_enabled', label: 'Allow Guest Checkout', desc: 'Allow unregistered users to checkout' },
                        ].map((toggle) => (
                          <div key={toggle.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <div>
                              <span style={{ color: '#f5efe6', fontWeight: 600, fontSize: '0.88rem', display: 'block' }}>{toggle.label}</span>
                              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{toggle.desc}</span>
                            </div>
                            <input type="checkbox" checked={(psForm as any)[toggle.key]} onChange={(e) => updatePsField(toggle.key, e.target.checked)} style={{ accentColor: '#c9a84c', width: '18px', height: '18px', cursor: 'pointer' }} />
                          </div>
                        ))}
                        <div>
                          <Input label="Minimum Order Value (₹)" type="number" value={psForm.minimum_order_value} onChange={(e) => updatePsField('minimum_order_value', parseFloat(e.target.value) || 0)} />
                          {psErrors.minimum_order_value && <span style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{psErrors.minimum_order_value}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(201, 168, 76, 0.2)', borderRadius: '12px', background: 'rgba(15, 12, 10, 0.85)' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: '#c9a84c', margin: '0 0 18px 0', fontWeight: 700 }}>
                        Order Settings
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div>
                            <span style={{ color: '#f5efe6', fontWeight: 600, fontSize: '0.88rem', display: 'block' }}>Allow Order Cancellation</span>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Let customers cancel placed orders</span>
                          </div>
                          <input type="checkbox" checked={psForm.order_cancellation_enabled} onChange={(e) => updatePsField('order_cancellation_enabled', e.target.checked)} style={{ accentColor: '#c9a84c', width: '18px', height: '18px', cursor: 'pointer' }} />
                        </div>
                        {psForm.order_cancellation_enabled && (
                          <div>
                            <Input label="Cancellation Time Limit (hours)" type="number" value={psForm.cancellation_time_limit} onChange={(e) => updatePsField('cancellation_time_limit', parseInt(e.target.value) || 1)} />
                            {psErrors.cancellation_time_limit && <span style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{psErrors.cancellation_time_limit}</span>}
                            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', margin: '6px 0 0 0' }}>
                              Orders can be cancelled within this many hours of placing.
                            </p>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div>
                            <span style={{ color: '#f5efe6', fontWeight: 600, fontSize: '0.88rem', display: 'block' }}>Return / Refund Enabled</span>
                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Allow return and refund requests</span>
                          </div>
                          <input type="checkbox" checked={psForm.return_refund_enabled} onChange={(e) => updatePsField('return_refund_enabled', e.target.checked)} style={{ accentColor: '#c9a84c', width: '18px', height: '18px', cursor: 'pointer' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 4: System & Security ── */}
                {psActiveTab === 'system' && (
                  <div style={{ display: 'grid', gridTemplateColumns: false ? '1fr' : '1fr 1fr', gap: '28px' }}>
                    <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(231, 76, 60, 0.25)', borderRadius: '12px', background: 'rgba(15, 12, 10, 0.85)' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: '#e74c3c', margin: '0 0 6px 0', fontWeight: 700 }}>
                        Maintenance Mode
                      </h3>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', margin: '0 0 18px 0' }}>
                        Enabling this takes the storefront offline for all customers. Admins can still access the dashboard.
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: psForm.maintenance_mode ? 'rgba(231, 76, 60, 0.1)' : 'rgba(0,0,0,0.2)', borderRadius: '8px', border: `1px solid ${psForm.maintenance_mode ? 'rgba(231, 76, 60, 0.4)' : 'rgba(255,255,255,0.08)'}` }}>
                        <div>
                          <span style={{ color: '#f5efe6', fontWeight: 700, fontSize: '0.9rem', display: 'block' }}>
                            {psForm.maintenance_mode ? '🔴 Maintenance Mode: ON' : '🟢 Maintenance Mode: OFF'}
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                            {psForm.maintenance_mode ? 'Storefront is currently offline.' : 'Storefront is live and accessible.'}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={psForm.maintenance_mode}
                          onChange={(e) => handleMaintenanceModeToggle(e.target.checked)}
                          style={{ accentColor: '#e74c3c', width: '20px', height: '20px', cursor: 'pointer' }}
                        />
                      </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(201, 168, 76, 0.2)', borderRadius: '12px', background: 'rgba(15, 12, 10, 0.85)' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: '#c9a84c', margin: '0 0 18px 0', fontWeight: 700 }}>
                        Security Settings
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ color: '#f5efe6', fontWeight: 600, fontSize: '0.85rem' }}>Admin Session Timeout</span>
                            <span style={{ color: '#c9a84c', fontWeight: 700, fontSize: '0.85rem' }}>{psForm.admin_session_timeout} min</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="480"
                            step="5"
                            value={psForm.admin_session_timeout}
                            onChange={(e) => updatePsField('admin_session_timeout', parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: '#c9a84c', cursor: 'pointer' }}
                          />
                          {psErrors.admin_session_timeout && <span style={{ color: '#e74c3c', fontSize: '0.75rem' }}>{psErrors.admin_session_timeout}</span>}
                        </div>
                        <div>
                          <Input label="Maximum Login Attempts" type="number" value={psForm.max_login_attempts} onChange={(e) => updatePsField('max_login_attempts', parseInt(e.target.value) || 1)} />
                          {psErrors.max_login_attempts && <span style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{psErrors.max_login_attempts}</span>}
                        </div>
                        <div>
                          <Input label="Account Lockout Duration (minutes)" type="number" value={psForm.account_lockout_duration} onChange={(e) => updatePsField('account_lockout_duration', parseInt(e.target.value) || 1)} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginTop: '28px' }}>
                  <Button variant="secondary" type="button" onClick={handlePsDiscard}>
                    <X size={15} style={{ marginRight: '6px' }} />
                    Discard Changes
                  </Button>
                  <Button variant="gold" type="submit" glow disabled={psSaving}>
                    {psSaving ? (
                      <><span style={{ marginRight: '6px' }}>⏳</span> Saving...</>
                    ) : (
                      <><Check size={15} style={{ marginRight: '6px' }} /> Save Configurations</>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* Maintenance Mode Confirmation Modal */}
            <AnimatePresence>
              {psShowMaintenanceConfirm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    style={{ background: 'rgba(20, 10, 8, 0.98)', border: '1px solid rgba(231, 76, 60, 0.5)', borderRadius: '14px', padding: '28px', maxWidth: '460px', width: '100%' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(231, 76, 60, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AlertTriangle size={22} color="#e74c3c" />
                      </div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: '#e74c3c', margin: 0, fontWeight: 700 }}>
                        Enable Maintenance Mode?
                      </h3>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '24px' }}>
                      This will take the entire Chovique storefront <strong style={{ color: '#e74c3c' }}>OFFLINE</strong> immediately. Customers will not be able to browse, shop, or checkout until you disable maintenance mode.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <Button variant="secondary" onClick={() => { setPsShowMaintenanceConfirm(false); setPsPendingMaintenanceMode(null); }}>
                        Cancel
                      </Button>
                      <Button variant="secondary" onClick={confirmMaintenanceMode} style={{ background: 'rgba(231,76,60,0.15)', borderColor: 'rgba(231,76,60,0.5)', color: '#e74c3c' }}>
                        Yes, Enable Maintenance Mode
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div>
            {/* Header & Top Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: '#f5efe6', margin: '0 0 6px 0', fontWeight: 700 }}>
                  Notifications
                </h1>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'rgba(255,255,255,0.6)' }}>
                  Important alerts and updates requiring your attention.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {notifUnreadCount > 0 && (
                  <Button variant="secondary" onClick={handleMarkAllNotifsAsRead} size="sm">
                    <Check size={14} style={{ marginRight: '6px' }} /> Mark All as Read
                  </Button>
                )}
                <Button variant="glass" onClick={fetchSuperadminNotifications} size="sm">
                  <RotateCcw size={14} style={{ marginRight: '6px' }} /> Refresh
                </Button>
              </div>
            </div>

            {/* Category Tabs */}
            <div style={{
              display: 'flex',
              gap: '0',
              borderBottom: '1px solid rgba(201, 168, 76, 0.2)',
              marginBottom: '20px',
              overflowX: 'auto',
            }}>
              {[
                { id: 'ALL', label: 'All' },
                { id: 'SECURITY', label: 'Security' },
                { id: 'ADMIN_MANAGEMENT', label: 'Admin Management' },
                { id: 'PLATFORM_SYSTEM', label: 'Platform / System' },
                { id: 'BUSINESS', label: 'Business' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setNotifCategoryTab(t.id); setNotifPage(1); }}
                  style={{
                    padding: '10px 20px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: 'none',
                    border: 'none',
                    borderBottom: notifCategoryTab === t.id ? '2px solid #c9a84c' : '2px solid transparent',
                    color: notifCategoryTab === t.id ? '#c9a84c' : 'rgba(255,255,255,0.55)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Filters & Search Row */}
            <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '12px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(201,168,76,0.2)', background: 'rgba(15, 12, 10, 0.85)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', flex: 1 }}>
                {/* Search */}
                <div style={{ minWidth: '220px', flex: '1 1 220px' }}>
                  <Input
                    placeholder="Search notifications..."
                    value={notifSearch}
                    onChange={(e) => { setNotifSearch(e.target.value); setNotifPage(1); }}
                  />
                </div>

                {/* Read / Unread Status */}
                <div style={{ width: '150px' }}>
                  <Select
                    value={notifReadFilter}
                    onChange={(e) => { setNotifReadFilter(e.target.value); setNotifPage(1); }}
                    options={[
                      { value: 'ALL', label: 'All Status' },
                      { value: 'UNREAD', label: 'Unread Only' },
                      { value: 'READ', label: 'Read Only' },
                    ]}
                  />
                </div>

                {/* Date From */}
                <div style={{ width: '150px' }}>
                  <Input
                    type="date"
                    value={notifDateFrom}
                    onChange={(e) => { setNotifDateFrom(e.target.value); setNotifPage(1); }}
                  />
                </div>

                {/* Date To */}
                <div style={{ width: '150px' }}>
                  <Input
                    type="date"
                    value={notifDateTo}
                    onChange={(e) => { setNotifDateTo(e.target.value); setNotifPage(1); }}
                  />
                </div>
              </div>

              {(notifSearch || notifReadFilter !== 'ALL' || notifDateFrom || notifDateTo || notifCategoryTab !== 'ALL') && (
                <Button
                  variant="text"
                  size="sm"
                  onClick={() => {
                    setNotifSearch('');
                    setNotifReadFilter('ALL');
                    setNotifCategoryTab('ALL');
                    setNotifDateFrom('');
                    setNotifDateTo('');
                    setNotifPage(1);
                  }}
                  style={{ color: '#c9a84c' }}
                >
                  Clear Filters
                </Button>
              )}
            </div>

            {/* List Table */}
            {notifLoading ? (
              <DashboardCardSkeleton height="350px" />
            ) : notifItems.length === 0 ? (
              <EmptyState
                title="No Notifications Found"
                description="There are no owner notifications matching your current filters."
                icon={<Bell size={40} color="#c9a84c" />}
              />
            ) : (
              <div className="glass-panel" style={{ borderRadius: '12px', border: '1px solid rgba(201,168,76,0.2)', overflow: 'hidden', background: 'rgba(15, 12, 10, 0.85)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(201, 168, 76, 0.08)', borderBottom: '1px solid rgba(201, 168, 76, 0.2)', color: '#c9a84c', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                      <th style={{ padding: '14px 18px' }}>Notification</th>
                      <th style={{ padding: '14px 18px' }}>Category</th>
                      <th style={{ padding: '14px 18px' }}>Severity</th>
                      <th style={{ padding: '14px 18px' }}>Date & Time</th>
                      <th style={{ padding: '14px 18px' }}>Status</th>
                      <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifItems.map((n) => {
                      const getCatBadge = (cat: string) => {
                        switch (cat) {
                          case 'SECURITY':
                            return { label: 'Security', bg: 'rgba(231,76,60,0.15)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.4)' };
                          case 'ADMIN_MANAGEMENT':
                            return { label: 'Admin Management', bg: 'rgba(201,168,76,0.15)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.4)' };
                          case 'PLATFORM_SYSTEM':
                            return { label: 'Platform / System', bg: 'rgba(230,126,34,0.15)', color: '#e67e22', border: '1px solid rgba(230,126,34,0.4)' };
                          case 'BUSINESS':
                            return { label: 'Business', bg: 'rgba(46,204,113,0.15)', color: '#2ecc71', border: '1px solid rgba(46,204,113,0.4)' };
                          default:
                            return { label: cat, bg: 'rgba(255,255,255,0.1)', color: '#f5efe6', border: '1px solid rgba(255,255,255,0.2)' };
                        }
                      };

                      const getSevBadge = (sev: string) => {
                        switch (sev) {
                          case 'CRITICAL':
                            return { label: 'CRITICAL', bg: 'rgba(231,76,60,0.25)', color: '#ff6b6b', border: '1px solid #e74c3c' };
                          case 'WARNING':
                            return { label: 'WARNING', bg: 'rgba(241,196,15,0.2)', color: '#f1c40f', border: '1px solid rgba(241,196,15,0.5)' };
                          default:
                            return { label: 'INFO', bg: 'rgba(52,152,219,0.15)', color: '#3498db', border: '1px solid rgba(52,152,219,0.4)' };
                        }
                      };

                      const catStyle = getCatBadge(n.category);
                      const sevStyle = getSevBadge(n.severity);

                      return (
                        <tr
                          key={n.id}
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            background: n.is_read ? 'transparent' : 'rgba(201, 168, 76, 0.04)',
                            transition: 'background 0.2s ease',
                          }}
                        >
                          {/* Title & snippet */}
                          <td style={{ padding: '14px 18px', maxWidth: '320px' }}>
                            <div style={{ fontWeight: n.is_read ? 600 : 700, color: '#f5efe6', fontSize: '0.88rem', marginBottom: '3px' }}>
                              {n.title}
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {n.message}
                            </div>
                          </td>

                          {/* Category */}
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600, background: catStyle.bg, color: catStyle.color, border: catStyle.border, display: 'inline-block' }}>
                              {catStyle.label}
                            </span>
                          </td>

                          {/* Severity */}
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: sevStyle.bg, color: sevStyle.color, border: sevStyle.border, display: 'inline-block' }}>
                              {sevStyle.label}
                            </span>
                          </td>

                          {/* Date */}
                          <td style={{ padding: '14px 18px', color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                            {n.created_at ? new Date(n.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                          </td>

                          {/* Status */}
                          <td style={{ padding: '14px 18px' }}>
                            {n.is_read ? (
                              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>Read</span>
                            ) : (
                              <span style={{ color: '#c9a84c', fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c9a84c', display: 'inline-block' }} />
                                Unread
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                              <Button
                                variant="glass"
                                size="sm"
                                onClick={() => {
                                  setSelectedNotif(n);
                                  if (!n.is_read) handleMarkNotifAsRead(n);
                                }}
                              >
                                <Eye size={13} style={{ marginRight: '4px' }} /> View
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setNotifToDelete(n)}
                                style={{ background: 'rgba(231,76,60,0.12)', borderColor: 'rgba(231,76,60,0.4)', color: '#e74c3c' }}
                              >
                                <Trash2 size={13} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination */}
                {notifTotalPages > 1 && (
                  <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(201, 168, 76, 0.15)', display: 'flex', justifyContent: 'flex-end' }}>
                    <Pagination
                      currentPage={notifPage}
                      totalPages={notifTotalPages}
                      totalItems={notifTotal}
                      itemsPerPage={notifLimit}
                      onPageChange={(p) => setNotifPage(p)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Notification Detail Drawer / Modal */}
            <AnimatePresence>
              {selectedNotif && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    style={{ background: 'rgba(20, 15, 12, 0.98)', border: '1px solid rgba(201, 168, 76, 0.4)', borderRadius: '16px', padding: '28px', maxWidth: '540px', width: '100%', boxShadow: '0 20px 50px rgba(0,0,0,0.9)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, color: '#c9a84c' }}>
                        {selectedNotif.category.replace('_', ' ')}
                      </span>
                      <button onClick={() => setSelectedNotif(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px' }}>
                        <X size={20} />
                      </button>
                    </div>

                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#f5efe6', margin: '0 0 12px 0', fontWeight: 700 }}>
                      {selectedNotif.title}
                    </h2>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: selectedNotif.severity === 'CRITICAL' ? 'rgba(231,76,60,0.25)' : selectedNotif.severity === 'WARNING' ? 'rgba(241,196,15,0.2)' : 'rgba(52,152,219,0.15)', color: selectedNotif.severity === 'CRITICAL' ? '#ff6b6b' : selectedNotif.severity === 'WARNING' ? '#f1c40f' : '#3498db' }}>
                        Severity: {selectedNotif.severity}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem' }}>
                        {selectedNotif.created_at ? new Date(selectedNotif.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                      </span>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
                      {selectedNotif.message}
                    </div>

                    {selectedNotif.related_user && (
                      <div style={{ padding: '14px', background: 'rgba(201,168,76,0.06)', borderRadius: '8px', border: '1px solid rgba(201,168,76,0.2)', marginBottom: '24px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#c9a84c', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                          Related Administrator
                        </div>
                        <div style={{ color: '#f5efe6', fontWeight: 600, fontSize: '0.88rem' }}>
                          {selectedNotif.related_user.name} ({selectedNotif.related_user.email})
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginTop: '2px' }}>
                          Role: {selectedNotif.related_user.role}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      {selectedNotif.category === 'ADMIN_MANAGEMENT' && (
                        <Button variant="gold" size="sm" onClick={() => { setSelectedNotif(null); setActiveTab('admin-mgmt'); }}>
                          View Admins
                        </Button>
                      )}
                      {selectedNotif.category === 'PLATFORM_SYSTEM' && (
                        <Button variant="gold" size="sm" onClick={() => { setSelectedNotif(null); setActiveTab('platform-settings'); }}>
                          View Platform Settings
                        </Button>
                      )}
                      {selectedNotif.category === 'BUSINESS' && (
                        <Button variant="gold" size="sm" onClick={() => { setSelectedNotif(null); setActiveTab('revenue'); }}>
                          View Revenue Analytics
                        </Button>
                      )}
                      <Button variant="secondary" size="sm" onClick={() => setSelectedNotif(null)}>
                        Close
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
              isOpen={!!notifToDelete}
              title="Delete Notification"
              message="Are you sure you want to delete this notification? This action cannot be undone."
              confirmText={isDeletingNotif ? 'Deleting...' : 'Delete'}
              cancelText="Cancel"
              isConfirming={isDeletingNotif}
              variant="danger"
              onConfirm={handleDeleteNotifConfirm}
              onCancel={() => setNotifToDelete(null)}
            />
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <AdminProfileView />
        )}

        {/* CHANGE PASSWORD TAB */}
        {activeTab === 'change-password' && (
          <ChangePasswordView />
        )}

        {/* REPORTS & ANALYTICS TAB */}
        {activeTab === 'reports' && (
          <ReportsAnalyticsView />
        )}

        {/* AUDIT LOG TAB FALLBACK */}
        {!['enterprise', 'revenue', 'sales-comparison', 'reports', 'admin-mgmt', 'audit-logs', 'theme-builder', 'home-mgmt', 'platform-settings', 'notifications', 'profile', 'change-password'].includes(activeTab) && (
          <div
            className="glass-panel"
            style={{
              padding: '60px 40px',
              textAlign: 'center',
              border: '1px solid var(--glass-border)',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', marginBottom: '15px' }}>
              Superadmin Control Tab Under Construction
            </h2>
            <p style={{ color: 'var(--beige)', maxWidth: '400px', margin: '0 auto' }}>
              The selected Enterprise control panel "{activeTab}" is active inside navigation configuration. Sub-panel details are under mock state.
            </p>
          </div>
        )}

        {/* Global Toast Container */}
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />

        {/* Destructive Action Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          isConfirming={confirmModal.isConfirming}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        />

        {/* Logout Confirmation Modal */}
        <ConfirmationModal
          isOpen={showLogoutConfirmModal}
          title="Confirm Logout"
          message="Are you sure you want to logout?"
          confirmText={isLoggingOut ? 'Logging out...' : 'Logout'}
          cancelText="Cancel"
          isConfirming={isLoggingOut}
          variant="danger"
          onConfirm={handleConfirmLogout}
          onCancel={() => setShowLogoutConfirmModal(false)}
        />
      </div>
    </div>
  );
};
export default SuperadminDashboard;
