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
  Key
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
import { adminService, type DashboardStats, type AuditLogEntry } from '../../services/adminService';
import { homeService } from '../../services/homeService';
import type { SystemUser, Order, InstagramReel, Testimonial } from '../../types';
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
  const { user, theme, updateThemeColors, offlineSales, orders, banners, updateBanner, products, setProducts, addBanner, deleteBannerState, refreshBanners } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('enterprise');
  const [isMobileGrid, setIsMobileGrid] = useState(window.innerWidth <= 768);

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


  // --- Platform Settings State & Handlers ---
  const [platformSettings, setPlatformSettings] = useState({
    storeName: 'Chovique Luxury Chocolates',
    supportEmail: 'support@chovique.com',
    supportPhone: '+91 98765 43210',
    maintenanceMode: false,
    enableCOD: true,
    minOrderFreeShipping: 1500,
    allowRegistrations: true,
    idleTimeout: 30,
    taxRate: 5,
    platformFee: 0,
    currency: 'INR (₹)',
  });
  
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    adminService.getPlatformConfig()
      .then((data) => {
        if (data && Object.keys(data).length > 0) {
          setPlatformSettings((prev) => ({ ...prev, ...data }));
        }
      })
      .catch((err) => console.error('Failed to load platform settings', err));
  }, []);

  const handleSavePlatformSettings = (e: React.FormEvent) => {
    e.preventDefault();
    adminService.updatePlatformConfig(platformSettings)
      .then(() => {
        setSettingsSaved(true);
        addLogEntry('Saved system platform settings configuration', 'setting');
        setTimeout(() => setSettingsSaved(false), 3000);
      })
      .catch((err) => {
        console.error('Failed to save platform settings:', err);
      });
  };
  const [backendAuditLogs, setBackendAuditLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    adminService.getAuditLogs()
      .then((logs) => setBackendAuditLogs(logs))
      .catch((err) => console.error('Failed to fetch audit logs:', err));
  }, []);

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

  const handleApplyTheme = async () => {
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
  const handleEditAdminSubmit = async (e: React.FormEvent) => {
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
              <div 
                className="dashboard-stat-card glass-panel interactive-card" 
                style={{ padding: '24px', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.3s' }}
                onClick={() => setActiveTab('revenue')}
                title="View Revenue Analytics"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>
                    Combined ARR
                  </span>
                  <ArrowRight size={14} color="var(--gold)" />
                </div>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--cream)', display: 'block' }}>
                  ₹{(totalRevenue * 12).toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--grey-light)', display: 'block', marginTop: '6px' }}>
                  Based on monthly run rate
                </span>
              </div>
              <div 
                className="dashboard-stat-card glass-panel interactive-card" 
                style={{ padding: '24px', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.3s' }}
                onClick={() => { setActiveTab('sales-comparison'); setAnalyticsSubTab('total'); }}
                title="View Sales Analytics"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>
                    Total Chocolates Sold
                  </span>
                  <ArrowRight size={14} color="var(--gold)" />
                </div>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--cream)', display: 'block' }}>
                  {totalUnitsSold.toLocaleString()} units
                </span>
                <span style={{ fontSize: '0.75rem', color: '#2ecc71', display: 'block', marginTop: '6px' }}>
                  Online + Offline sales
                </span>
              </div>
              <div 
                className="dashboard-stat-card glass-panel interactive-card" 
                style={{ padding: '24px', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.3s' }}
                onClick={() => { setActiveTab('sales-comparison'); setAnalyticsSubTab('total'); }}
                title="View Total Stock"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>
                    Total Stock
                  </span>
                  <ArrowRight size={14} color="var(--gold)" />
                </div>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--cream)', display: 'block' }}>
                  {totalUnitsAvailable.toLocaleString()} units
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--rose-gold)', display: 'block', marginTop: '6px' }}>
                  Available in all warehouses
                </span>
              </div>
              <div 
                className="dashboard-stat-card glass-panel interactive-card" 
                style={{ padding: '24px', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.3s' }}
                onClick={() => setActiveTab('admin-mgmt')}
                title="Manage Admin Accounts"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>
                    Active Admins
                  </span>
                  <ArrowRight size={14} color="var(--gold)" />
                </div>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--cream)', display: 'block' }}>
                  {dashboardStats?.admin_count || 0} accounts
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
                  {backendAuditLogs.slice(0, 3).map((log: any) => (
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
                        <span style={{ fontWeight: 600 }}>{log.user_name || log.user_email || 'System'}</span>
                        <span>{new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
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
                <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>Gross Margin (Online Share)</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0', color: '#2ecc71' }}>
                  {totalRevenue > 0 ? ((totalOnlineRevenue / totalRevenue) * 100).toFixed(1) : '0'}%
                </h3>
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
                      if (!dashboardStats?.top_products || dashboardStats.top_products.length === 0) {
                        return (
                          <>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '8px 0 0 0', color: 'var(--gold)' }}>N/A</h3>
                            <span style={{ fontSize: '0.7rem', color: 'var(--grey-light)', display: 'block', marginTop: '4px' }}>
                              Volume: 0 units sold
                            </span>
                          </>
                        );
                      }
                      
                      const topProd = dashboardStats.top_products[0];
                      return (
                        <>
                          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '8px 0 0 0', color: 'var(--gold)' }}>{topProd.name}</h3>
                          <span style={{ fontSize: '0.7rem', color: 'var(--grey-light)', display: 'block', marginTop: '4px' }}>
                            Volume: {topProd.units_sold} units sold
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
                        // Dynamically calculate units sold for this specific product
                        let unitsSold = 0;
                        superOrders.forEach((o: any) => {
                          if (o.status !== 'Cancelled') {
                            o.items.forEach((it: any) => {
                              if (it.product.id === prod.id || it.product.name === prod.name) {
                                unitsSold += it.quantity;
                              }
                            });
                          }
                        });
                        offlineSales.forEach((s: any) => {
                          if (s.productName === prod.name) {
                            unitsSold += s.quantity;
                          }
                        });
                        
                        const isLowStock = (prod.stock || 0) < 10;
                        
                        return (
                          <tr key={prod.id}>
                            <td style={{ fontWeight: 600 }}>{prod.name}</td>
                            <td style={{ textTransform: 'capitalize', color: 'var(--beige)' }}>{prod.category}</td>
                            <td>₹{prod.price}</td>
                            <td style={{ fontWeight: 700, color: 'var(--rose-gold)' }}>{unitsSold} units</td>
                            <td>₹{(unitsSold * prod.price).toLocaleString('en-IN')}</td>
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
                                    {prod.stock} units
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
                                    setAdjustStockVal(prod.stock || 0);
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
                  <div className="admin-form-panel">
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--cream)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ display: 'inline-flex', padding: '6px', background: 'rgba(201,168,76,0.12)', borderRadius: '6px', border: '1px solid rgba(201,168,76,0.3)' }}>
                        <UserCheck size={18} color="var(--gold)" />
                      </span>
                      Add New Administrator Account
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--grey-light)', marginBottom: '24px', letterSpacing: '0.3px' }}>
                      Register a new admin account with access to the management dashboard.
                    </p>
                    {adminCreateError && (
                      <div
                        style={{
                          background: 'rgba(231, 76, 60, 0.15)',
                          border: '1px solid #e74c3c',
                          color: '#e74c3c',
                          borderRadius: '6px',
                          padding: '10px 14px',
                          fontSize: '0.85rem',
                          marginBottom: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <AlertTriangle size={15} /> {adminCreateError}
                      </div>
                    )}
                    <form onSubmit={handleAddAdmin} style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : 'repeat(3, 1fr) auto', gap: '16px', alignItems: 'end' }}>
                      <Input
                        label="Full Name"
                        required
                        placeholder="e.g. Priya Sharma"
                        value={newAdmin.name}
                        onChange={(e) => {
                          setNewAdmin({ ...newAdmin, name: e.target.value });
                          if (adminCreateError) setAdminCreateError('');
                        }}
                      />
                      <Input
                        label="Email Address"
                        type="email"
                        required
                        placeholder="admin@chovique.com"
                        value={newAdmin.email}
                        onChange={(e) => {
                          setNewAdmin({ ...newAdmin, email: e.target.value });
                          if (adminCreateError) setAdminCreateError('');
                        }}
                      />
                      <Input
                        label="Initial Password"
                        type="password"
                        required
                        placeholder="Min. 6 characters"
                        value={newAdmin.password}
                        onChange={(e) => {
                          setNewAdmin({ ...newAdmin, password: e.target.value });
                          if (adminCreateError) setAdminCreateError('');
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--cream)', marginBottom: '8px', fontWeight: 600 }}>Role</label>
                        <select
                          value={newAdmin.role}
                          onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                          style={{
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--cream)',
                            padding: '10px 14px',
                            borderRadius: '6px',
                            outline: 'none',
                          }}
                        >
                          <option value="admin">Admin</option>
                          <option value="superadmin">Superadmin</option>
                        </select>
                      </div>
                      <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'flex-end' }}>
                        <Button variant="gold" type="submit" glow disabled={isCreatingAdmin} style={{ height: '42px', minWidth: '150px', whiteSpace: 'nowrap', width: '100%' }}>
                          {isCreatingAdmin ? 'Creating...' : 'Register Account'}
                        </Button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Edit Admin Modal */}
            <AnimatePresence>
              {editAdminUser && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{ marginBottom: '30px' }}
                >
                  <div className="admin-form-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--gold)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserCheck size={18} /> Edit Admin — {editAdminUser.name}
                      </h3>
                      <button
                        onClick={() => { setEditAdminUser(null); setEditAdminError(''); }}
                        style={{ color: 'var(--grey-light)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <X size={20} />
                      </button>
                    </div>
                    {editAdminError && (
                      <div style={{ background: 'rgba(231, 76, 60, 0.15)', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: '6px', padding: '10px 14px', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={15} /> {editAdminError}
                      </div>
                    )}
                    <form onSubmit={handleEditAdminSubmit} style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : 'repeat(2, 1fr) auto', gap: '16px', alignItems: 'end' }}>
                      <Input
                        label="Full Name"
                        required
                        value={editAdminForm.name}
                        placeholder="Admin full name"
                        onChange={(e) => { setEditAdminForm({ ...editAdminForm, name: e.target.value }); setEditAdminError(''); }}
                      />
                      <Input
                        label="Email Address"
                        type="email"
                        required
                        value={editAdminForm.email}
                        placeholder="admin@chovique.com"
                        onChange={(e) => { setEditAdminForm({ ...editAdminForm, email: e.target.value }); setEditAdminError(''); }}
                      />
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <Button variant="gold" type="submit" glow disabled={isEditingAdmin} style={{ height: '42px' }}>
                          {isEditingAdmin ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button variant="glass" type="button" onClick={() => setEditAdminUser(null)} style={{ height: '42px' }}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Password Reset Modal */}
            <AnimatePresence>
              {resetAdminUser && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{ marginBottom: '30px' }}
                >
                  <div className="admin-form-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--gold)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Key size={18} /> Reset Password — {resetAdminUser.name}
                      </h3>
                      <button
                        onClick={() => { setResetAdminUser(null); setResetAdminPassword(''); }}
                        style={{ color: 'var(--grey-light)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <X size={20} />
                      </button>
                    </div>
                    {resetPasswordError && (
                      <div style={{ background: 'rgba(231, 76, 60, 0.15)', border: '1px solid #e74c3c', color: '#e74c3c', borderRadius: '6px', padding: '10px 14px', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={15} /> {resetPasswordError}
                      </div>
                    )}
                    {resetPasswordSuccess && (
                      <div style={{ background: 'rgba(46, 204, 113, 0.15)', border: '1px solid #2ecc71', color: '#2ecc71', borderRadius: '6px', padding: '10px 14px', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Check size={16} /> {resetPasswordSuccess}
                      </div>
                    )}
                    <form onSubmit={handleUpdateAdminPasswordSubmit} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', maxWidth: '600px' }}>
                      <div style={{ flexGrow: 1 }}>
                        <Input
                          label="New Account Password"
                          type="password"
                          required
                          placeholder="At least 6 characters"
                          value={resetAdminPassword}
                          onChange={(e) => {
                            setResetAdminPassword(e.target.value);
                            if (resetPasswordError) setResetPasswordError('');
                          }}
                        />
                      </div>
                      <Button variant="gold" type="submit" glow disabled={isResettingPassword} style={{ height: '42px', whiteSpace: 'nowrap' }}>
                        {isResettingPassword ? 'Saving...' : 'Update Password'}
                      </Button>
                      <Button variant="glass" type="button" onClick={() => setResetAdminUser(null)} style={{ height: '42px' }}>
                        Cancel
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
                    <th>Role</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {systemUsers
                    .filter((u) => u.role === 'admin' || u.role === 'superadmin')
                    .map((u) => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600 }}>{u.name}</td>
                        <td>{u.email}</td>
                        <td>
                          <span style={{
                            background: u.role === 'superadmin' ? 'rgba(201, 168, 76, 0.15)' : 'rgba(255,255,255,0.07)',
                            color: u.role === 'superadmin' ? 'var(--gold-light)' : 'var(--beige)',
                            padding: '4px 10px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            border: u.role === 'superadmin' ? '1px solid rgba(201, 168, 76, 0.2)' : '1px solid rgba(255,255,255,0.1)',
                            textTransform: 'capitalize',
                          }}>
                            {u.role === 'superadmin' ? 'Superadmin' : 'Admin'}
                          </span>
                        </td>
                        <td style={{ color: '#2ecc71', fontWeight: 600 }}>Active</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {/* Edit button */}
                            <button
                              onClick={() => {
                                setEditAdminUser(u);
                                setEditAdminForm({ name: u.name, email: u.email });
                                setEditAdminError('');
                                setResetAdminUser(null);
                              }}
                              style={{
                                color: 'var(--gold)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'rgba(201,168,76,0.08)',
                                border: '1px solid rgba(201,168,76,0.3)',
                                borderRadius: '4px',
                                padding: '5px 10px',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,168,76,0.18)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; }}
                            >
                              <UserCheck size={14} /> Edit
                            </button>
                            {/* Promote / Demote button */}
                            {u.role === 'admin' ? (
                              <button
                                onClick={() => handlePromoteAdmin(u.id, u.name)}
                                style={{
                                  color: 'var(--gold)',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: 'rgba(201,168,76,0.08)',
                                  border: '1px solid rgba(201,168,76,0.3)',
                                  borderRadius: '4px',
                                  padding: '5px 10px',
                                  fontSize: '0.82rem',
                                  fontWeight: 600,
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,168,76,0.18)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; }}
                              >
                                <UserCheck size={14} /> Promote
                              </button>
                            ) : u.id !== user?.id ? (
                              <button
                                onClick={() => handleDemoteAdmin(u.id, u.name)}
                                style={{
                                  color: '#ffaa00',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: 'rgba(255,170,0,0.08)',
                                  border: '1px solid rgba(255,170,0,0.3)',
                                  borderRadius: '4px',
                                  padding: '5px 10px',
                                  fontSize: '0.82rem',
                                  fontWeight: 600,
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,170,0,0.18)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,170,0,0.08)'; }}
                              >
                                <UserX size={14} /> Demote
                              </button>
                            ) : null}
                            {/* Reset Password button */}
                            <button
                              onClick={() => {
                                setResetAdminUser(u);
                                setResetAdminPassword('');
                                setResetPasswordError('');
                                setResetPasswordSuccess('');
                                setEditAdminUser(null);
                              }}
                              style={{
                                color: 'var(--beige)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: '4px',
                                padding: '5px 10px',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                            >
                              <Key size={14} /> Password
                            </button>
                            {/* Delete button — allow superadmin to delete any non-self admin/superadmin account */}
                            {u.id !== user?.id && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Revoke administrator account for "${u.name}" (${u.email})? This cannot be undone.`)) {
                                    handleRemoveAdmin(u.id, u.name, u.email);
                                  }
                                }}
                                style={{
                                  color: '#ff6b6b',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: 'rgba(255,107,107,0.08)',
                                  border: '1px solid rgba(255,107,107,0.3)',
                                  borderRadius: '4px',
                                  padding: '5px 10px',
                                  fontSize: '0.82rem',
                                  fontWeight: 600,
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,107,107,0.18)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,107,107,0.08)'; }}
                                title="Delete Account"
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            )}
                          </div>
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
                                    const m = products.find(p => p.id === it.product.id) || { stock: 0 };
                                    if (itemsBought[it.product.name]) {
                                      itemsBought[it.product.name].qty += it.quantity;
                                    } else {
                                      itemsBought[it.product.name] = {
                                        qty: it.quantity,
                                        available: m.stock || 0,
                                        low: (m.stock || 0) < 10
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
                {backendAuditLogs.map((log: any) => (
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
                    label="Tax Rate (GST %)"
                    type="number"
                    required
                    value={platformSettings.taxRate}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, taxRate: parseFloat(e.target.value) || 0 })}
                  />
                  <Input
                    label="Platform Fee (₹)"
                    type="number"
                    required
                    value={platformSettings.platformFee}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, platformFee: parseFloat(e.target.value) || 0 })}
                  />
                  <Input
                    label="Base Currency"
                    required
                    value={platformSettings.currency}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, currency: e.target.value })}
                  />
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
                        taxRate: 5,
                        platformFee: 0,
                        currency: 'INR (₹)',
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
      </div>
    </div>
  );
};
export default SuperadminDashboard;
