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
  Activity,
  AlertTriangle
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
import { pageTransition } from '../../lib/framer';

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

// Users list interface for Roles & Permissions
interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin' | 'superadmin';
  permissions: {
    manageInventory: boolean;
    viewAnalytics: boolean;
    manageUsers: boolean;
    configureThemes: boolean;
    exportData: boolean;
  };
}

export const SuperadminDashboard: React.FC = () => {
  const { theme, updateThemeColors, offlineSales, orders, banners, updateBanner, products } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('enterprise');
  const [isMobileGrid, setIsMobileGrid] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileGrid(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'total' | 'online' | 'offline'>('total');

  // --- Dynamic local state for stock/units sold to keep them interactive for superadmin ---
  const [productMetrics, setProductMetrics] = useState<{ [productId: string]: { stock: number; sold: number } }>(() => {
    const saved = localStorage.getItem('chovique_product_metrics');
    if (saved) return JSON.parse(saved);
    return {
      'p1': { stock: 45, sold: 148 },
      'p2': { stock: 12, sold: 92 },
      'p3': { stock: 8, sold: 74 },
      'p4': { stock: 60, sold: 110 },
      'p5': { stock: 3, sold: 88 },
      'p6': { stock: 25, sold: 56 },
      'p7': { stock: 18, sold: 63 },
      'p8': { stock: 35, sold: 120 },
    };
  });

  useEffect(() => {
    localStorage.setItem('chovique_product_metrics', JSON.stringify(productMetrics));
  }, [productMetrics]);

  // --- Theme Builder Colors State ---
  const [themeInput, setThemeInput] = useState({
    primary: theme.primary,
    darkChocolate: theme.darkChocolate,
    gold: theme.gold,
    roseGold: theme.roseGold,
    black: theme.black || '#0A0A0A',
  });

  // --- Theme Presets State ---
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [customThemes, setCustomThemes] = useState<ThemePreset[]>(() => {
    const saved = localStorage.getItem('chovique_custom_themes');
    return saved ? JSON.parse(saved) : [];
  });
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
  const bannerFileRef = useRef<HTMLInputElement>(null);

  // --- Admin Accounts Management State ---
  const [admins, setAdmins] = useState([
    { id: 'a1', name: 'Alok Mishra', email: 'alok@chovique.com', status: 'Active', scope: 'All Boutiques' },
    { id: 'a2', name: 'Karen Dsouza', email: 'karen@chovique.com', status: 'Active', scope: 'West Region' },
  ]);
  const [showAddAdminForm, setShowAddAdminForm] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', scope: 'All Boutiques' });

  // --- Roles & Permissions User List State ---
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(() => {
    const saved = localStorage.getItem('chovique_system_users');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'u1', name: 'Priya Sharma', email: 'customer@chovique.com', role: 'customer', permissions: { manageInventory: false, viewAnalytics: false, manageUsers: false, configureThemes: false, exportData: false } },
      { id: 'u2', name: 'Vikram Kapoor', email: 'vikram@chovique.com', role: 'customer', permissions: { manageInventory: false, viewAnalytics: false, manageUsers: false, configureThemes: false, exportData: false } },
      { id: 'u3', name: 'Neha Patel', email: 'neha@chovique.com', role: 'customer', permissions: { manageInventory: false, viewAnalytics: false, manageUsers: false, configureThemes: false, exportData: false } },
      { id: 'u4', name: 'Chef Ravi Joshi', email: 'ravi@chovique.com', role: 'customer', permissions: { manageInventory: false, viewAnalytics: false, manageUsers: false, configureThemes: false, exportData: false } },
      { id: 'u5', name: 'Alok Mishra', email: 'alok@chovique.com', role: 'admin', permissions: { manageInventory: true, viewAnalytics: true, manageUsers: false, configureThemes: false, exportData: true } },
      { id: 'u6', name: 'Karen Dsouza', email: 'karen@chovique.com', role: 'admin', permissions: { manageInventory: true, viewAnalytics: true, manageUsers: false, configureThemes: false, exportData: false } },
      { id: 'u7', name: 'Enterprise Chief', email: 'superadmin@chovique.com', role: 'superadmin', permissions: { manageInventory: true, viewAnalytics: true, manageUsers: true, configureThemes: true, exportData: true } },
    ];
  });

  useEffect(() => {
    localStorage.setItem('chovique_system_users', JSON.stringify(systemUsers));
  }, [systemUsers]);

  // --- Orders State with live modifications ---
  const [superOrders, setSuperOrders] = useState(() => {
    const saved = localStorage.getItem('chovique_orders');
    return saved ? JSON.parse(saved) : orders;
  });

  useEffect(() => {
    localStorage.setItem('chovique_orders', JSON.stringify(superOrders));
  }, [superOrders]);

  // --- Platform Settings State & Handlers ---
  const [platformSettings, setPlatformSettings] = useState(() => {
    const saved = localStorage.getItem('chovique_platform_settings');
    if (saved) return JSON.parse(saved);
    return {
      storeName: 'Chovique Luxury Chocolates',
      supportEmail: 'support@chovique.com',
      supportPhone: '+91 98765 43210',
      maintenanceMode: false,
      enableCOD: true,
      minOrderFreeShipping: 1500,
      allowRegistrations: true,
      idleTimeout: 30,
    };
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleSavePlatformSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('chovique_platform_settings', JSON.stringify(platformSettings));
    setSettingsSaved(true);
    addLogEntry('Saved system platform settings configuration', 'setting');
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  // --- Audit logs with live addition triggers ---
  const [liveLogs, setLiveLogs] = useState(() => {
    const saved = localStorage.getItem('chovique_audit_logs');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'log1', time: '07:12:45', action: 'Boutique register CSV upload parsed', user: 'Karen Dsouza', type: 'order' },
      { id: 'log2', time: '06:44:12', action: 'Modified price of Royal Truffle Box to ₹2499', user: 'Alok Mishra', type: 'product' },
      { id: 'log3', time: 'Yesterday', action: 'Dynamic banner Slide 1 text adjusted', user: 'Atelier Admin', type: 'setting' },
      { id: 'log4', time: '2 days ago', action: 'Superadmin credentials session initialized', user: 'Enterprise Chief', type: 'security' },
    ];
  });

  useEffect(() => {
    localStorage.setItem('chovique_audit_logs', JSON.stringify(liveLogs));
  }, [liveLogs]);

  // --- Stock adjustment fields ---
  const [adjustingStockId, setAdjustingStockId] = useState<string | null>(null);
  const [adjustStockVal, setAdjustStockVal] = useState<number>(0);

  // --- Customer detail modal inspection ---
  const [inspectedCustomer, setInspectedCustomer] = useState<SystemUser | null>(null);

  const addLogEntry = (action: string, type: 'order' | 'product' | 'security' | 'setting') => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const newLog = {
      id: `log-${Date.now()}`,
      time: timeStr,
      action,
      user: 'Enterprise Chief (Superadmin)',
      type,
    };
    setLiveLogs((prev: any) => [newLog, ...prev]);
  };

  // Preset operations
  const allPresets = [...builtInPresets, ...customThemes];

  const handleApplyPreset = (preset: ThemePreset) => {
    setActivePresetId(preset.id);
    setThemeInput(preset.colors);
    updateThemeColors(preset.colors);
    addLogEntry(`Applied Theme Preset: "${preset.name}"`, 'setting');
  };

  const handleApplyTheme = () => {
    setActivePresetId(null);
    updateThemeColors({
      primary: themeInput.primary,
      darkChocolate: themeInput.darkChocolate,
      gold: themeInput.gold,
      roseGold: themeInput.roseGold,
      black: themeInput.black,
    });
    addLogEntry('Configured custom theme color values manually', 'setting');
  };

  const handleResetTheme = () => {
    const defaults = builtInPresets[0].colors;
    setThemeInput(defaults);
    setActivePresetId('classic');
    updateThemeColors(defaults);
    addLogEntry('Reset theme color tokens to defaults', 'setting');
  };

  const handleAddCustomTheme = () => {
    if (!newThemeName.trim()) return;
    const newTheme: ThemePreset = {
      id: `custom-${Date.now()}`,
      name: newThemeName,
      description: newThemeDesc || 'Custom theme',
      colors: { ...newThemeColors },
    };
    const updated = [...customThemes, newTheme];
    setCustomThemes(updated);
    localStorage.setItem('chovique_custom_themes', JSON.stringify(updated));
    setNewThemeName('');
    setNewThemeDesc('');
    setShowAddThemeForm(false);
    addLogEntry(`Created Custom Theme: "${newTheme.name}"`, 'setting');
  };

  const handleRemoveCustomTheme = (id: string) => {
    const targetTheme = customThemes.find(t => t.id === id);
    const updated = customThemes.filter((t) => t.id !== id);
    setCustomThemes(updated);
    localStorage.setItem('chovique_custom_themes', JSON.stringify(updated));
    if (activePresetId === id) setActivePresetId(null);
    if (targetTheme) {
      addLogEntry(`Deleted Custom Theme: "${targetTheme.name}"`, 'setting');
    }
  };

  // Banner image upload
  const handleBannerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (banners[selectedSlideIdx]) {
        updateBanner(banners[selectedSlideIdx].id, { image: dataUrl });
        addLogEntry(`Uploaded new banner image file for Hero Slide ${selectedSlideIdx + 1}`, 'setting');
      }
    };
    reader.readAsDataURL(file);
    if (bannerFileRef.current) bannerFileRef.current.value = '';
  };

  // Add mock admin
  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.name || !newAdmin.email) return;
    
    // Add to side list
    setAdmins([
      ...admins,
      {
        id: `a${admins.length + 3}`,
        name: newAdmin.name,
        email: newAdmin.email,
        status: 'Active',
        scope: newAdmin.scope,
      },
    ]);

    // Add to global roles list
    const newUser: SystemUser = {
      id: `u-${Date.now()}`,
      name: newAdmin.name,
      email: newAdmin.email,
      role: 'admin',
      permissions: {
        manageInventory: true,
        viewAnalytics: true,
        manageUsers: false,
        configureThemes: false,
        exportData: true
      }
    };
    setSystemUsers(prev => [...prev, newUser]);
    
    addLogEntry(`Registered new administrator account: ${newAdmin.name}`, 'security');
    setNewAdmin({ name: '', email: '', scope: 'All Boutiques' });
    setShowAddAdminForm(false);
  };

  // Delete mock admin
  const handleRemoveAdmin = (id: string) => {
    const adm = admins.find(a => a.id === id);
    setAdmins(admins.filter((a) => a.id !== id));
    if (adm) {
      // Also demote or remove from systemUsers
      setSystemUsers(prev => prev.filter(u => u.email !== adm.email));
      addLogEntry(`Revoked administrator account: ${adm.name}`, 'security');
    }
  };



  // Restock items
  const handleSaveStockLevel = (prodId: string) => {
    setProductMetrics(prev => {
      const updated = {
        ...prev,
        [prodId]: {
          ...prev[prodId],
          stock: adjustStockVal
        }
      };
      const prodName = products.find(p => p.id === prodId)?.name || prodId;
      addLogEntry(`Adjusted inventory stock for "${prodName}" to ${adjustStockVal} units`, 'product');
      return updated;
    });
    setAdjustingStockId(null);
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

  // Computed summary metrics
  const totalOfflineRevenue = offlineSales.reduce((sum, s) => sum + s.totalPrice, 0);
  const totalOnlineRevenue = superOrders.filter((o: any) => o.status !== 'Cancelled').reduce((sum: number, o: any) => sum + o.total, 0);
  const totalRevenue = totalOnlineRevenue + totalOfflineRevenue;
  
  // Count total sold items & available items
  const totalUnitsSold = Object.values(productMetrics).reduce((sum, m) => sum + m.sold, 0);
  const totalUnitsAvailable = Object.values(productMetrics).reduce((sum, m) => sum + m.stock, 0);

  // Analytics mockup data for charts (Website sales vs Boutique sales)
  const salesHistoryData = [
    { name: 'Jan', OnlineSales: 45000, BoutiqueSales: 30000 },
    { name: 'Feb', OnlineSales: 52000, BoutiqueSales: 35000 },
    { name: 'Mar', OnlineSales: 61000, BoutiqueSales: 48000 },
    { name: 'Apr', OnlineSales: 58000, BoutiqueSales: 40000 },
    { name: 'May', OnlineSales: 75000, BoutiqueSales: 65000 },
    { name: 'Jun', OnlineSales: 89000, BoutiqueSales: 72000 },
  ];

  // Pie chart values for revenue sources
  const revenueChannelsData = [
    { name: 'Online Boutique', value: totalOnlineRevenue, color: 'var(--rose-gold)' },
    { name: 'Offline Boutiques', value: totalOfflineRevenue, color: 'var(--gold)' },
  ];

  // Specific Customer Inspection Details
  const getCustomerOrders = (customerEmail: string) => {
    const nameToMatch = inspectedCustomer ? inspectedCustomer.name.toLowerCase() : '';
    return superOrders.filter((o: any) =>
      o.shippingAddress.name.toLowerCase() === nameToMatch ||
      o.shippingAddress.phone.includes('98765') // Fallback matching
    );
  };

  const selectedBanner = banners[selectedSlideIdx] || null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', color: 'var(--cream)', fontFamily: 'var(--font-body)' }}>
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main content pane */}
      <div className="admin-workspace">
        
        {/* ENTERPRISE DASHBOARD TAB */}
        {activeTab === 'enterprise' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <span className="section-label">Enterprise Workspace</span>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--cream)', margin: 0 }}>
                  Overview Control
                </h1>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button variant="gold" size="sm" onClick={() => navigate('/')} glow>
                  View Live Site
                </Button>
              </div>
            </div>

            {/* Core Stats row */}
            <div className="stats-grid-dashboard">
              <div className="dashboard-stat-card glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>
                  Combined ARR
                </span>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--cream)', display: 'block' }}>
                  ₹{(totalRevenue * 12).toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--grey-light)', display: 'block', marginTop: '6px' }}>
                  Based on monthly run rate
                </span>
              </div>
              <div className="dashboard-stat-card glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>
                  Total Chocolates Sold
                </span>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--cream)', display: 'block' }}>
                  {totalUnitsSold.toLocaleString()} units
                </span>
                <span style={{ fontSize: '0.75rem', color: '#2ecc71', display: 'block', marginTop: '6px' }}>
                  Online + Offline sales
                </span>
              </div>
              <div className="dashboard-stat-card glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>
                  Inventory Stock
                </span>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--cream)', display: 'block' }}>
                  {totalUnitsAvailable.toLocaleString()} units
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--rose-gold)', display: 'block', marginTop: '6px' }}>
                  Available in all warehouses
                </span>
              </div>
              <div className="dashboard-stat-card glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>
                  Active Admins
                </span>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--cream)', display: 'block' }}>
                  {admins.length} accounts
                </span>
                <span style={{ fontSize: '0.75rem', color: '#2ecc71', display: 'block', marginTop: '6px' }}>
                  100% Security Audited
                </span>
              </div>
            </div>

            {/* Quick overview layout */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1.2fr 1fr', gap: '30px', marginTop: '30px' }}>
              {/* Financial source pie chart */}
              <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--cream)', marginBottom: '15px' }}>
                  Revenue Channels Distribution
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexGrow: 1 }}>
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie
                        data={revenueChannelsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {revenueChannelsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {revenueChannelsData.map((channel, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: channel.color }} />
                        <div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--grey-light)', display: 'block' }}>{channel.name}</span>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--cream)' }}>₹{channel.value.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* System Audit logs timeline */}
              <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--cream)', margin: 0 }}>
                    Recent Operations Log
                  </h3>
                  <button onClick={() => setActiveTab('audit-logs')} style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600 }}>
                    View All
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {liveLogs.slice(0, 3).map((log: any) => (
                    <div
                      key={log.id}
                      style={{
                        padding: '12px',
                        background: 'rgba(0,0,0,0.15)',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        borderLeft: '3px solid var(--gold)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--gold)', marginBottom: '3px' }}>
                        <span style={{ fontWeight: 600 }}>{log.user}</span>
                        <span>{log.time}</span>
                      </div>
                      <p style={{ margin: 0, color: 'var(--cream)' }}>{log.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REVENUE ANALYTICS TAB */}
        {activeTab === 'revenue' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <span className="section-label">Financial Analytics</span>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--cream)', margin: 0 }}>
                  Revenue Performance
                </h1>
              </div>
              <Button variant="gold" glow onClick={handleExportOverallSales}>
                Export Overall Sales (CSV)
              </Button>
            </div>

            {/* Income summaries */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Income</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0' }}>₹{totalRevenue.toLocaleString('en-IN')}</h3>
              </div>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>Online Channels</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0' }}>₹{totalOnlineRevenue.toLocaleString('en-IN')}</h3>
              </div>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>Boutique Sales</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0' }}>₹{totalOfflineRevenue.toLocaleString('en-IN')}</h3>
              </div>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>Gross Margin</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0', color: '#2ecc71' }}>68.4%</h3>
              </div>
            </div>

            {/* Charts detail */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              <div className="glass-panel" style={{ padding: '30px', border: '1px solid var(--glass-border)', height: '400px' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '20px' }}>
                  Monthly Revenue Trends (ARR Projection)
                </h3>
                <ResponsiveContainer width="100%" height="85%">
                  <AreaChart data={salesHistoryData}>
                    <defs>
                      <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--rose-gold)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--rose-gold)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorBoutique" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--gold)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--gold)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="var(--beige)" />
                    <YAxis stroke="var(--beige)" />
                    <Tooltip contentStyle={{ background: 'var(--dark-chocolate)', border: '1px solid var(--gold)', color: 'white' }} />
                    <Legend />
                    <Area type="monotone" dataKey="OnlineSales" name="Online Boutique" stroke="var(--rose-gold)" fillOpacity={1} fill="url(#colorOnline)" strokeWidth={3} />
                    <Area type="monotone" dataKey="BoutiqueSales" name="Offline Boutiques" stroke="var(--gold)" fillOpacity={1} fill="url(#colorBoutique)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* SALES COMPARISON & INVENTORY TAB */}
        {activeTab === 'sales-comparison' && (
          <div>
            <span className="section-label">Enterprise Reporting</span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--cream)', marginBottom: '25px' }}>
              Sales Analytics & Ledger
            </h1>

            {/* Sub-tab Navigation */}
            <div style={{ display: 'flex', gap: '15px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginBottom: '30px' }}>
              {[
                { id: 'total' as const, label: 'Total Sales & Stock' },
                { id: 'online' as const, label: 'Online Sales Ledger' },
                { id: 'offline' as const, label: 'Offline Sales Ledger' },
              ].map((sub) => {
                const isSubActive = analyticsSubTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setAnalyticsSubTab(sub.id)}
                    style={{
                      padding: '8px 16px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: isSubActive ? 'var(--gold)' : 'var(--beige)',
                      background: isSubActive ? 'rgba(201, 168, 76, 0.08)' : 'transparent',
                      border: isSubActive ? '1px solid var(--gold)' : '1px solid transparent',
                      borderRadius: '4px',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>

            {/* SUB-TAB 1: TOTAL SALES OVERVIEW */}
            {analyticsSubTab === 'total' && (
              <div>
                {/* Volumes & Metrics breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>Combined Sales Volume</span>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0' }}>{totalUnitsSold.toLocaleString()} units</h3>
                    <span style={{ fontSize: '0.7rem', color: 'var(--grey-light)', display: 'block', marginTop: '4px' }}>
                      Online + Offline combined
                    </span>
                  </div>
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>Combined Revenue</span>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0' }}>₹{totalRevenue.toLocaleString('en-IN')}</h3>
                    <span style={{ fontSize: '0.7rem', color: 'var(--grey-light)', display: 'block', marginTop: '4px' }}>
                      Online: ₹{totalOnlineRevenue.toLocaleString('en-IN')} | Offline: ₹{totalOfflineRevenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>Top Selling Chocolate</span>
                    {(() => {
                      // Dynamically calculate top selling product by volume
                      const salesByProd: { [name: string]: number } = {};
                      
                      // 1. Online orders
                      superOrders.forEach((o: any) => {
                        if (o.status !== 'Cancelled') {
                          o.items.forEach((it: any) => {
                            salesByProd[it.product.name] = (salesByProd[it.product.name] || 0) + it.quantity;
                          });
                        }
                      });

                      // 2. Offline sales
                      offlineSales.forEach((s: any) => {
                        salesByProd[s.productName] = (salesByProd[s.productName] || 0) + s.quantity;
                      });

                      let topProd = 'Belgian Dark Truffle';
                      let maxQty = 0;
                      Object.entries(salesByProd).forEach(([name, qty]) => {
                        if (qty > maxQty) {
                          maxQty = qty;
                          topProd = name;
                        }
                      });

                      return (
                        <>
                          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '8px 0 0 0', color: 'var(--gold)' }}>{topProd}</h3>
                          <span style={{ fontSize: '0.7rem', color: 'var(--grey-light)', display: 'block', marginTop: '4px' }}>
                            Volume: {maxQty} units sold
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Stock Control Table */}
                <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)', marginBottom: '30px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--cream)', margin: 0 }}>
                      Product Sales & Stock Control
                    </h3>
                    <Button variant="glass" size="sm" onClick={handleExportOverallSales}>
                      Export Consolidated Sales (CSV)
                    </Button>
                  </div>
                  
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Units Sold</th>
                        <th>Total Revenue</th>
                        <th>Available Stock</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((prod) => {
                        const metrics = productMetrics[prod.id] || { stock: 0, sold: 0 };
                        const isLowStock = metrics.stock < 10;
                        
                        return (
                          <tr key={prod.id}>
                            <td style={{ fontWeight: 600 }}>{prod.name}</td>
                            <td style={{ textTransform: 'capitalize', color: 'var(--beige)' }}>{prod.category}</td>
                            <td>₹{prod.price}</td>
                            <td style={{ fontWeight: 700, color: 'var(--rose-gold)' }}>{metrics.sold} units</td>
                            <td>₹{(metrics.sold * prod.price).toLocaleString('en-IN')}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {adjustingStockId === prod.id ? (
                                  <input
                                    type="number"
                                    value={adjustStockVal}
                                    onChange={(e) => setAdjustStockVal(parseInt(e.target.value) || 0)}
                                    style={{
                                      padding: '4px 8px',
                                      width: '70px',
                                      background: 'rgba(0,0,0,0.3)',
                                      border: '1px solid var(--gold)',
                                      color: 'white',
                                      borderRadius: '4px',
                                      outline: 'none',
                                    }}
                                  />
                                ) : (
                                  <span style={{ fontWeight: 700, color: isLowStock ? 'var(--rose-gold)' : 'var(--cream)' }}>
                                    {metrics.stock} units
                                  </span>
                                )}
                                {isLowStock && (
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: 'rgba(183, 110, 121, 0.15)',
                                    color: 'var(--rose-gold)',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '0.7rem',
                                    border: '1px solid rgba(183, 110, 121, 0.25)',
                                  }}>
                                    <AlertTriangle size={10} /> Low
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {adjustingStockId === prod.id ? (
                                <div style={{ display: 'inline-flex', gap: '8px' }}>
                                  <Button
                                    variant="gold"
                                    size="sm"
                                    onClick={() => handleSaveStockLevel(prod.id)}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setAdjustingStockId(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="glass"
                                  size="sm"
                                  onClick={() => {
                                    setAdjustingStockId(prod.id);
                                    setAdjustStockVal(metrics.stock);
                                  }}
                                >
                                  Adjust Stock
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 2: ONLINE SALES LEDGER */}
            {analyticsSubTab === 'online' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--rose-gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>Online Revenue</span>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0' }}>₹{totalOnlineRevenue.toLocaleString('en-IN')}</h3>
                  </div>
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--rose-gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>Website Orders Placed</span>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0' }}>{superOrders.length} orders</h3>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--cream)', margin: 0 }}>
                      Website Online Orders (Completed & Processing)
                    </h3>
                    <Button variant="gold" size="sm" onClick={handleExportOnlineSales} glow>
                      Download Online Sales (CSV)
                    </Button>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Date</th>
                          <th>Customer Details</th>
                          <th>Products Purchased</th>
                          <th>Subtotal</th>
                          <th>Total Paid</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {superOrders.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--grey-light)', fontStyle: 'italic' }}>
                              No website orders registered.
                            </td>
                          </tr>
                        ) : (
                          superOrders.map((ord: any) => (
                            <tr key={ord.id}>
                              <td style={{ fontWeight: 600, color: 'var(--gold)' }}>{ord.id}</td>
                              <td>{ord.date}</td>
                              <td>
                                <div>
                                  <div style={{ fontWeight: 500 }}>{ord.shippingAddress.name}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--grey-light)' }}>{ord.shippingAddress.phone}</div>
                                </div>
                              </td>
                              <td>
                                <div style={{ fontSize: '0.85rem' }}>
                                  {ord.items.map((it: any) => `${it.product.name} (x${it.quantity})`).join(', ')}
                                </div>
                              </td>
                              <td>₹{ord.subtotal.toLocaleString('en-IN')}</td>
                              <td style={{ fontWeight: 700 }}>₹{ord.total.toLocaleString('en-IN')}</td>
                              <td>
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: '12px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  background: ord.status === 'Delivered' ? 'rgba(46, 204, 113, 0.15)' : ord.status === 'Cancelled' ? 'rgba(183, 110, 121, 0.15)' : 'rgba(201, 168, 76, 0.15)',
                                  color: ord.status === 'Delivered' ? '#2ecc71' : ord.status === 'Cancelled' ? 'var(--rose-gold)' : 'var(--gold-light)'
                                }}>
                                  {ord.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 3: OFFLINE SALES LEDGER */}
            {analyticsSubTab === 'offline' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>Boutique Revenue</span>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0' }}>₹{totalOfflineRevenue.toLocaleString('en-IN')}</h3>
                  </div>
                  <div className="glass-panel" style={{ padding: '20px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>Offline Items Sold</span>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0' }}>
                      {offlineSales.reduce((sum, s) => sum + s.quantity, 0)} units
                    </h3>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--cream)', margin: 0 }}>
                      Boutique Offline Sales Logs
                    </h3>
                    <Button variant="gold" size="sm" onClick={handleExportOfflineSales} glow>
                      Download Offline Sales (CSV)
                    </Button>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Receipt ID</th>
                          <th>Date</th>
                          <th>Product Name</th>
                          <th>Quantity Sold</th>
                          <th>Payment Method</th>
                          <th>Total Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {offlineSales.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--grey-light)', fontStyle: 'italic' }}>
                              No offline sales logged.
                            </td>
                          </tr>
                        ) : (
                          offlineSales.map((sale) => (
                            <tr key={sale.id}>
                              <td style={{ fontWeight: 600, color: 'var(--gold)' }}>{sale.id}</td>
                              <td>{sale.date}</td>
                              <td style={{ fontWeight: 500 }}>{sale.productName}</td>
                              <td>{sale.quantity} units</td>
                              <td>{sale.paymentMethod}</td>
                              <td style={{ fontWeight: 700 }}>₹{sale.totalPrice.toLocaleString('en-IN')}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADMIN MANAGEMENT TAB */}
        {activeTab === 'admin-mgmt' && (
          <div>
            <span className="section-label">Access Control</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--cream)', margin: 0 }}>
                Manage Administrators
              </h1>
              
              <Button
                variant="gold"
                glow
                onClick={() => setShowAddAdminForm(!showAddAdminForm)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {showAddAdminForm ? <X size={16} /> : <Plus size={16} />}
                {showAddAdminForm ? 'Close Registration Panel' : 'Register Administrator'}
              </Button>
            </div>

            {/* Expandable Register Admin Form */}
            <AnimatePresence>
              {showAddAdminForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 30 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="glass-panel" style={{ padding: '30px', border: '1px solid var(--gold)', background: 'rgba(26,13,0,0.8)' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--cream)', marginBottom: '20px' }}>
                      Add New Administrator Account
                    </h3>
                    <form onSubmit={handleAddAdmin} style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : 'repeat(3, 1fr) auto', gap: '20px', alignItems: 'end' }}>
                      <Input
                        label="Full Name"
                        required
                        value={newAdmin.name}
                        onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                      />
                      <Input
                        label="Email Address"
                        type="email"
                        required
                        value={newAdmin.email}
                        onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                      />
                      <Select
                        label="Assigned Scope"
                        options={[
                          { value: 'All Boutiques', label: 'All Locations Global' },
                          { value: 'West Region', label: 'Boutiques West' },
                          { value: 'South Region', label: 'Boutiques South' },
                        ]}
                        value={newAdmin.scope}
                        onChange={(e) => setNewAdmin({ ...newAdmin, scope: e.target.value })}
                      />
                      <Button variant="gold" type="submit" glow style={{ height: '42px' }}>
                        Register Account
                      </Button>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Scope</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((adm) => (
                    <tr key={adm.id}>
                      <td style={{ fontWeight: 600 }}>{adm.name}</td>
                      <td>{adm.email}</td>
                      <td>
                        <span style={{
                          background: 'rgba(201, 168, 76, 0.15)',
                          color: 'var(--gold-light)',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          border: '1px solid rgba(201, 168, 76, 0.2)',
                        }}>
                          {adm.scope}
                        </span>
                      </td>
                      <td style={{ color: '#2ecc71', fontWeight: 600 }}>{adm.status}</td>
                      <td>
                        <button
                          onClick={() => handleRemoveAdmin(adm.id)}
                          style={{
                            color: 'var(--rose-gold)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Trash2 size={16} /> Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </div>
          </div>
        )}



        {/* AUDIT LOGS & ORDERS INSPECTOR TAB */}
        {activeTab === 'audit-logs' && (
          <div>
            <span className="section-label">Audit Trial & Logs</span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--cream)', marginBottom: '35px' }}>
              System Ledger & Customer Inspector
            </h1>

            {/* Split layout: Customers Inspector List & Active Orders Status Editor */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1.2fr 1fr', gap: '30px', alignItems: 'flex-start' }}>
              
              {/* Customer Inspection List */}
              <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '15px' }}>
                  Interactive Customer Directory
                </h3>
                <p style={{ color: 'var(--beige)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  Click a customer profile card to inspect their complete order list, spend metrics, and verify stock availability of items they bought.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {systemUsers.filter(u => u.role === 'customer').map((cust) => {
                    const customerOrders = superOrders.filter((o: any) =>
                      o.shippingAddress.name.toLowerCase() === cust.name.toLowerCase() ||
                      o.shippingAddress.phone.includes('98765')
                    );
                    const totalSpend = customerOrders.reduce((sum: number, o: any) => sum + o.total, 0);

                    return (
                      <div
                        key={cust.id}
                        onClick={() => setInspectedCustomer(cust)}
                        style={{
                          padding: '16px',
                          background: 'rgba(0,0,0,0.15)',
                          border: inspectedCustomer?.id === cust.id ? '2px solid var(--gold)' : '1px solid var(--glass-border)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                        onMouseEnter={(e) => {
                          if (inspectedCustomer?.id !== cust.id) {
                            e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (inspectedCustomer?.id !== cust.id) {
                            e.currentTarget.style.borderColor = 'var(--glass-border)';
                          }
                        }}
                      >
                        <div>
                          <h4 style={{ margin: 0, color: 'var(--cream)', fontSize: '1rem', fontWeight: 600 }}>{cust.name}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--grey-light)' }}>{cust.email}</span>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)' }}>
                            ₹{totalSpend.toLocaleString('en-IN')}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--grey-light)' }}>
                            {customerOrders.length} orders total
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Orders List with status editor */}
              <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '15px' }}>
                  Orders & Status Editor
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {superOrders.map((ord: any) => (
                    <div
                      key={ord.id}
                      style={{
                        padding: '16px',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)' }}>{ord.id}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--grey-light)', marginLeft: '8px' }}>{ord.date}</span>
                        </div>
                        <select
                          value={ord.status}
                          onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                          style={{
                            background: 'var(--dark-chocolate)',
                            color: ord.status === 'Delivered' ? '#2ecc71' : ord.status === 'Cancelled' ? 'var(--rose-gold)' : 'var(--gold)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            outline: 'none',
                          }}
                        >
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--cream)' }}>
                            Purchaser: <span style={{ fontWeight: 600 }}>{ord.shippingAddress.name}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--grey-light)' }}>
                            Items: {ord.items.map((it: any) => `${it.product.name} (x${it.quantity})`).join(', ')}
                          </div>
                        </div>

                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--cream)' }}>
                          ₹{ord.total.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Inspected Customer Detail Modal / Sliding Card */}
            <AnimatePresence>
              {inspectedCustomer && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  style={{
                    marginTop: '30px',
                  }}
                >
                  <div
                    className="glass-panel"
                    style={{
                      padding: '30px',
                      border: '1px solid var(--gold)',
                      background: 'rgba(26,13,0,0.95)',
                      borderRadius: '12px',
                      position: 'relative',
                    }}
                  >
                    {/* Close button */}
                    <button
                      onClick={() => setInspectedCustomer(null)}
                      style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        color: 'var(--grey-light)',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={24} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'var(--gradient-gold)',
                        color: 'var(--dark-chocolate)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.4rem',
                      }}>
                        {inspectedCustomer.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--cream)', margin: 0 }}>
                          {inspectedCustomer.name}
                        </h2>
                        <p style={{ color: 'var(--beige)', fontSize: '0.85rem', margin: 0 }}>{inspectedCustomer.email}</p>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                      {/* Left side: Orders list */}
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--gold)', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                          Customer Order History
                        </h3>

                        {getCustomerOrders(inspectedCustomer.email).length === 0 ? (
                          <p style={{ color: 'var(--grey-light)', fontSize: '0.9rem', fontStyle: 'italic' }}>No orders found for this customer.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {getCustomerOrders(inspectedCustomer.email).map((ord: any) => (
                              <div
                                key={ord.id}
                                style={{
                                  padding: '12px 16px',
                                  background: 'rgba(0,0,0,0.15)',
                                  borderRadius: '6px',
                                  borderLeft: '3px solid var(--gold)',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <div>
                                  <span style={{ fontWeight: 700, color: 'var(--cream)' }}>{ord.id}</span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--grey-light)', marginLeft: '8px' }}>{ord.date}</span>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--grey-light)', marginTop: '4px' }}>
                                    Status: <span style={{ color: ord.status === 'Delivered' ? '#2ecc71' : 'var(--gold)', fontWeight: 600 }}>{ord.status}</span>
                                  </div>
                                </div>
                                <span style={{ fontWeight: 700, color: 'var(--gold)' }}>₹{ord.total.toLocaleString('en-IN')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right side: Purchased products & stock statuses */}
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--gold)', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                          Items Purchased & Stock Availability
                        </h3>

                        {getCustomerOrders(inspectedCustomer.email).length === 0 ? (
                          <p style={{ color: 'var(--grey-light)', fontSize: '0.9rem', fontStyle: 'italic' }}>No products purchased.</p>
                        ) : (
                          <div className="admin-table-wrapper">
                            <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Item purchased</th>
                                <th>Total Units</th>
                                <th>In-Stock Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* Aggregate items bought across all their orders */}
                              {(() => {
                                const itemsBought: { [name: string]: { qty: number; available: number; low: boolean } } = {};
                                getCustomerOrders(inspectedCustomer.email).forEach((o: any) => {
                                  o.items.forEach((it: any) => {
                                    const m = productMetrics[it.product.id] || { stock: 0 };
                                    if (itemsBought[it.product.name]) {
                                      itemsBought[it.product.name].qty += it.quantity;
                                    } else {
                                      itemsBought[it.product.name] = {
                                        qty: it.quantity,
                                        available: m.stock,
                                        low: m.stock < 10
                                      };
                                    }
                                  });
                                });

                                return Object.entries(itemsBought).map(([name, data]) => (
                                  <tr key={name}>
                                    <td style={{ fontWeight: 600 }}>{name}</td>
                                    <td>{data.qty} units bought</td>
                                    <td>
                                      <span style={{
                                        color: data.low ? 'var(--rose-gold)' : '#2ecc71',
                                        fontWeight: 700
                                      }}>
                                        {data.available} units available
                                      </span>
                                      {data.low && (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--rose-gold)', display: 'block', fontStyle: 'italic' }}>
                                          * Stock warning triggered
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ));
                              })()}
                            </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Comprehensive chronological audit log list */}
            <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)', marginTop: '30px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '15px' }}>
                Chronological System Operations Ledger
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {liveLogs.map((log: any) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '14px 18px',
                      background: 'rgba(0,0,0,0.15)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        padding: '4px 10px',
                        background: log.type === 'order' ? 'rgba(183, 110, 121, 0.15)' : log.type === 'security' ? 'rgba(238, 77, 45, 0.15)' : 'rgba(201, 168, 76, 0.15)',
                        color: log.type === 'order' ? 'var(--rose-gold)' : log.type === 'security' ? '#ff4d2d' : 'var(--gold-light)',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        border: '1px solid rgba(255,255,255,0.05)'
                      }}>
                        {log.type}
                      </span>
                      <span style={{ color: 'var(--cream)' }}>{log.action}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: 'var(--grey-light)', fontSize: '0.8rem' }}>
                      <span>By: <strong style={{ color: 'var(--beige)' }}>{log.user}</strong></span>
                      <span>{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* THEME BUILDER TAB */}
        {activeTab === 'theme-builder' && (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--cream)', marginBottom: '35px' }}>
              Dynamic Theme Builder
            </h1>

            {/* Theme Presets Section */}
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--gold)', marginBottom: '20px' }}>
                Theme Presets
              </h2>
              <p style={{ color: 'var(--beige)', marginBottom: '24px', fontSize: '0.9rem' }}>
                Click a theme to preview, then it applies live across all pages instantly.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                {allPresets.map((preset) => {
                  const isActive = activePresetId === preset.id;
                  const isCustom = preset.id.startsWith('custom-');
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset)}
                      style={{
                        padding: '20px',
                        borderRadius: '12px',
                        border: isActive ? '2px solid var(--gold)' : '1px solid var(--glass-border)',
                        background: isActive ? 'rgba(201, 168, 76, 0.08)' : 'rgba(0,0,0,0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                      }}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'var(--gradient-gold)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Check size={14} color="#1A0D00" />
                        </div>
                      )}

                      {/* Custom theme delete button */}
                      {isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCustomTheme(preset.id);
                          }}
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: isActive ? '42px' : '10px',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: 'rgba(183, 110, 121, 0.2)',
                            border: '1px solid rgba(183, 110, 121, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            color: 'var(--rose-gold)',
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}

                      {/* Color swatches */}
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                        {Object.values(preset.colors).map((color, i) => (
                          <div
                            key={i}
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              background: color,
                              border: '2px solid rgba(255,255,255,0.1)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                            }}
                          />
                        ))}
                      </div>

                      <h4 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.1rem',
                        color: 'var(--cream)',
                        marginBottom: '6px',
                      }}>
                        {preset.name}
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--grey-light)', margin: 0, lineHeight: 1.4 }}>
                        {preset.description}
                      </p>
                    </div>
                  );
                })}

                {/* Add New Theme Card */}
                <div
                  onClick={() => setShowAddThemeForm(true)}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    border: '2px dashed var(--glass-border)',
                    background: 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '160px',
                    gap: '12px',
                  }}
                >
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: '2px solid var(--gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--gold)',
                  }}>
                    <Plus size={24} />
                  </div>
                  <span style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Add New Theme
                  </span>
                </div>
              </div>

              {/* Add New Theme Form Modal */}
              {showAddThemeForm && (
                <div
                  className="glass-panel"
                  style={{
                    padding: '30px',
                    border: '1px solid var(--gold)',
                    maxWidth: '500px',
                    marginBottom: '30px',
                    background: 'rgba(26,13,0,0.8)',
                    borderRadius: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)', margin: 0 }}>
                      Create Custom Theme
                    </h3>
                    <button
                      onClick={() => setShowAddThemeForm(false)}
                      style={{ color: 'var(--grey-light)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <Input
                    label="Theme Name"
                    placeholder="e.g. Ocean Breeze"
                    value={newThemeName}
                    onChange={(e) => setNewThemeName(e.target.value)}
                  />
                  <Input
                    label="Description"
                    placeholder="Brief description..."
                    value={newThemeDesc}
                    onChange={(e) => setNewThemeDesc(e.target.value)}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    {[
                      { key: 'primary' as const, label: 'Primary Color' },
                      { key: 'darkChocolate' as const, label: 'Background Dark' },
                      { key: 'gold' as const, label: 'Accent Gold' },
                      { key: 'roseGold' as const, label: 'Accent Rose' },
                      { key: 'black' as const, label: 'Base Black' },
                    ].map((field) => (
                      <div key={field.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--cream)', fontSize: '0.85rem' }}>{field.label}</span>
                        <input
                          type="color"
                          value={newThemeColors[field.key]}
                          onChange={(e) => setNewThemeColors({ ...newThemeColors, [field.key]: e.target.value })}
                          style={{ width: '50px', height: '32px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Preview swatch */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    {Object.values(newThemeColors).map((color, i) => (
                      <div
                        key={i}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          background: color,
                          border: '2px solid rgba(255,255,255,0.1)',
                        }}
                      />
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <Button variant="gold" onClick={handleAddCustomTheme} glow>
                      Save Theme
                    </Button>
                    <Button variant="glass" onClick={() => setShowAddThemeForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Manual Color Picker Section */}
            <div className="glass-panel" style={{ padding: '30px', border: '1px solid var(--glass-border)', maxWidth: '600px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '10px' }}>
                Manual Color Customization
              </h3>
              <p style={{ color: 'var(--beige)', marginBottom: '24px', lineHeight: 1.5, fontSize: '0.85rem' }}>
                Fine-tune individual colors. Changes apply across all pages instantly.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--cream)', fontWeight: 600 }}>Primary Brand Brown</span>
                  <input
                    type="color"
                    value={themeInput.primary}
                    onChange={(e) => setThemeInput({ ...themeInput, primary: e.target.value })}
                    style={{ width: '60px', height: '40px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--cream)', fontWeight: 600 }}>Chocolate Background Dark</span>
                  <input
                    type="color"
                    value={themeInput.darkChocolate}
                    onChange={(e) => setThemeInput({ ...themeInput, darkChocolate: e.target.value })}
                    style={{ width: '60px', height: '40px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--cream)', fontWeight: 600 }}>Signature Luxury Gold</span>
                  <input
                    type="color"
                    value={themeInput.gold}
                    onChange={(e) => setThemeInput({ ...themeInput, gold: e.target.value })}
                    style={{ width: '60px', height: '40px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--cream)', fontWeight: 600 }}>Rose Gold Accent</span>
                  <input
                    type="color"
                    value={themeInput.roseGold}
                    onChange={(e) => setThemeInput({ ...themeInput, roseGold: e.target.value })}
                    style={{ width: '60px', height: '40px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--cream)', fontWeight: 600 }}>Base Black Color</span>
                  <input
                    type="color"
                    value={themeInput.black}
                    onChange={(e) => setThemeInput({ ...themeInput, black: e.target.value })}
                    style={{ width: '60px', height: '40px', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <Button variant="gold" onClick={handleApplyTheme} glow>
                  Apply Live Palettes
                </Button>
                <Button variant="glass" onClick={handleResetTheme}>
                  Reset Defaults
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* BANNER & CAROUSEL MANAGEMENT TAB */}
        {activeTab === 'home-mgmt' && (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--cream)', marginBottom: '10px' }}>
              Banner & Carousel Manager
            </h1>
            <p style={{ color: 'var(--beige)', marginBottom: '35px', fontSize: '0.9rem' }}>
              Select a carousel slide below to edit its content. Upload images or change text — changes reflect live on the hero section.
            </p>

            {/* Carousel Slide Selector — Thumbnail Grid */}
            <div style={{ marginBottom: '35px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--gold)', marginBottom: '16px' }}>
                Select Carousel Slide to Edit
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {banners.map((banner, idx) => {
                  const isSelected = selectedSlideIdx === idx;
                  return (
                    <div
                      key={banner.id}
                      onClick={() => setSelectedSlideIdx(idx)}
                      style={{
                        position: 'relative',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: isSelected ? '3px solid var(--gold)' : '2px solid var(--glass-border)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: isSelected ? '0 4px 20px rgba(201, 168, 76, 0.3)' : 'none',
                      }}
                    >
                      {/* Thumbnail image */}
                      <img
                        src={banner.image}
                        alt={banner.title}
                        style={{
                          width: '100%',
                          height: '120px',
                          objectFit: 'cover',
                          filter: isSelected ? 'brightness(0.7)' : 'brightness(0.4)',
                          transition: 'filter 0.3s ease',
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80';
                        }}
                      />

                      {/* Slide label overlay */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: '10px 12px',
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                        }}
                      >
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: isSelected ? 'var(--gold)' : 'var(--cream)',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                        }}>
                          Slide {idx + 1}
                        </span>
                        <p style={{
                          margin: '2px 0 0 0',
                          fontSize: '0.7rem',
                          color: 'var(--grey-light)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {banner.title}
                        </p>
                      </div>

                      {/* Selected check badge */}
                      {isSelected && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'var(--gradient-gold)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 8px rgba(201, 168, 76, 0.4)',
                        }}>
                          <Check size={16} color="#1A0D00" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Slide Editor */}
            {selectedBanner && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'flex-start' }}>
                {/* Editor Fields */}
                <div
                  className="glass-panel"
                  style={{
                    padding: '30px',
                    border: '1px solid var(--glass-border)',
                    background: 'rgba(26,13,0,0.4)',
                    borderRadius: '12px',
                  }}
                >
                  <h3 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.3rem',
                    color: 'var(--gold)',
                    marginBottom: '20px',
                  }}>
                    Editing Slide {selectedSlideIdx + 1}
                  </h3>

                  <Input
                    label="Heading / Title Text"
                    value={selectedBanner.title}
                    onChange={(e) => updateBanner(selectedBanner.id, { title: e.target.value })}
                  />
                  <Input
                    label="Subheading / Description"
                    value={selectedBanner.subtitle}
                    onChange={(e) => updateBanner(selectedBanner.id, { subtitle: e.target.value })}
                  />
                  <Input
                    label="Tag Line"
                    value={selectedBanner.tag}
                    onChange={(e) => updateBanner(selectedBanner.id, { tag: e.target.value })}
                  />
                  <Input
                    label="CTA Button Text"
                    value={selectedBanner.buttonText}
                    onChange={(e) => updateBanner(selectedBanner.id, { buttonText: e.target.value })}
                  />
                  <Input
                    label="Image URL (or upload below)"
                    value={selectedBanner.image.startsWith('data:') ? '(Uploaded file)' : selectedBanner.image}
                    onChange={(e) => updateBanner(selectedBanner.id, { image: e.target.value })}
                  />

                  {/* File Upload for banner image */}
                  <div style={{ marginTop: '12px' }}>
                    <input
                      type="file"
                      ref={bannerFileRef}
                      accept="image/*"
                      onChange={handleBannerFileUpload}
                      style={{ display: 'none' }}
                    />
                    <Button
                      variant="glass"
                      fullWidth
                      onClick={() => bannerFileRef.current?.click()}
                    >
                      <UploadCloud size={18} />
                      Upload Banner Image
                    </Button>
                    <p style={{ fontSize: '0.75rem', color: 'var(--grey-light)', marginTop: '8px', textAlign: 'center' }}>
                      Supports JPG, PNG, WebP. Recommended: 1920×1080px
                    </p>
                  </div>
                </div>

                {/* Live Preview Panel */}
                <div
                  className="glass-panel"
                  style={{
                    padding: '0',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ position: 'relative', width: '100%', height: '260px' }}>
                    <img
                      src={selectedBanner.image}
                      alt={selectedBanner.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: 'brightness(0.5)',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '20px',
                      textAlign: 'center',
                    }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--gold-light)', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '8px' }}>
                        {selectedBanner.tag}
                      </span>
                      <h4 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '1.4rem',
                        color: 'var(--cream)',
                        marginBottom: '8px',
                        fontWeight: 700,
                      }}>
                        {selectedBanner.title}
                      </h4>
                      <p style={{
                        fontFamily: 'var(--font-elegant)',
                        fontSize: '0.85rem',
                        color: 'var(--beige)',
                        marginBottom: '12px',
                        maxWidth: '360px',
                        lineHeight: 1.4,
                      }}>
                        {selectedBanner.subtitle}
                      </p>
                      <div style={{
                        padding: '6px 16px',
                        background: 'var(--gradient-gold)',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: 'var(--dark-chocolate)',
                        textTransform: 'uppercase',
                      }}>
                        {selectedBanner.buttonText}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: '14px 20px',
                    background: 'rgba(0,0,0,0.4)',
                    textAlign: 'center',
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Live Preview — Slide {selectedSlideIdx + 1}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PLATFORM SETTINGS TAB */}
        {activeTab === 'platform-settings' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <span className="section-label">Enterprise Config</span>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--cream)', margin: 0 }}>
                  Platform Settings
                </h1>
              </div>
            </div>

            {settingsSaved && (
              <div
                style={{
                  padding: '16px',
                  background: 'rgba(46, 204, 113, 0.1)',
                  border: '1px solid #2ecc71',
                  color: '#2ecc71',
                  borderRadius: '6px',
                  marginBottom: '30px',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Check size={18} /> Global platform settings configurations have been successfully saved and applied.
              </div>
            )}

            <form onSubmit={handleSavePlatformSettings}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', marginBottom: '40px' }}>
                
                {/* Panel 1: General Info */}
                <div className="glass-panel" style={{ padding: '30px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--gold)', margin: '0 0 10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                    Store Configuration
                  </h3>
                  <Input
                    label="Store Front Name"
                    required
                    value={platformSettings.storeName}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, storeName: e.target.value })}
                  />
                  <Input
                    label="Customer Support Email"
                    type="email"
                    required
                    value={platformSettings.supportEmail}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, supportEmail: e.target.value })}
                  />
                  <Input
                    label="Customer Support Phone"
                    required
                    value={platformSettings.supportPhone}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, supportPhone: e.target.value })}
                  />
                </div>

                {/* Panel 2: Logistics & Checkout */}
                <div className="glass-panel" style={{ padding: '30px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--gold)', margin: '0 0 10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                    Payment & Shipping
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--cream)', fontWeight: 600 }}>Enable COD Payments</span>
                    <input
                      type="checkbox"
                      checked={platformSettings.enableCOD}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, enableCOD: e.target.checked })}
                      style={{ accentColor: 'var(--gold)', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </div>
                  <Input
                    label="Min Order for Free Shipping (₹)"
                    type="number"
                    required
                    value={platformSettings.minOrderFreeShipping}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, minOrderFreeShipping: parseInt(e.target.value) || 0 })}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'var(--grey-light)', margin: 0 }}>
                    Orders below this threshold will carry standard delivery charges.
                  </p>
                </div>

                {/* Panel 3: System Security & Status */}
                <div className="glass-panel" style={{ padding: '30px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--gold)', margin: '0 0 10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                    System & Security
                  </h3>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '0.9rem', color: 'var(--cream)', display: 'block', fontWeight: 600 }}>Maintenance Mode</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--grey-light)' }}>Front-end catalog goes offline</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={platformSettings.maintenanceMode}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, maintenanceMode: e.target.checked })}
                      style={{ accentColor: 'var(--rose-gold)', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '0.9rem', color: 'var(--cream)', display: 'block', fontWeight: 600 }}>Allow Customer Signups</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--grey-light)' }}>Allow guest checkout and signup</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={platformSettings.allowRegistrations}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, allowRegistrations: e.target.checked })}
                      style={{ accentColor: 'var(--gold)', width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--cream)', fontWeight: 600 }}>Admin Session Timeout</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--gold)', fontWeight: 700 }}>{platformSettings.idleTimeout} mins</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="120"
                      step="5"
                      value={platformSettings.idleTimeout}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, idleTimeout: parseInt(e.target.value) })}
                      style={{ accentColor: 'var(--gold)', cursor: 'pointer' }}
                    />
                  </div>
                </div>

              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <Button variant="gold" type="submit" glow>
                  Save Configurations
                </Button>
                <Button
                  variant="glass"
                  type="button"
                  onClick={() => {
                    if (confirm('Discard edits and revert to default values?')) {
                      setPlatformSettings({
                        storeName: 'Chovique Luxury Chocolates',
                        supportEmail: 'support@chovique.com',
                        supportPhone: '+91 98765 43210',
                        maintenanceMode: false,
                        enableCOD: true,
                        minOrderFreeShipping: 1500,
                        allowRegistrations: true,
                        idleTimeout: 30,
                      });
                    }
                  }}
                >
                  Discard Changes
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* AUDIT LOG TAB FALLBACK */}
        {!['enterprise', 'revenue', 'sales-comparison', 'admin-mgmt', 'audit-logs', 'theme-builder', 'home-mgmt', 'platform-settings'].includes(activeTab) && (
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
      </div>
    </div>
  );
};
export default SuperadminDashboard;
