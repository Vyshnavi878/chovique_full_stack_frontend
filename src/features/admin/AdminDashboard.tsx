import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Check,
  Edit2,
  UploadCloud,
  X,
  Warehouse,
  ShoppingBag,
  Coins,
  Users,
  CheckCircle,
  Loader2,
  Star,
  Phone,
  Mail,
  Clock,
  MessageSquare,
  FolderTree,
  ToggleLeft,
  ToggleRight,
  ImagePlus
} from 'lucide-react';
import { useApp } from '../../app/providers';
import { Sidebar } from '../../components/Sidebar';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { walletService, RewardSettings } from '../../services/walletService';
import { adminService } from '../../services/adminService';
import { productService } from '../../services/productService';
import { inventoryService } from '../../services/inventoryService';
import { categoryService, AdminCategory } from '../../services/categoryService';
import { Product, OfflineSale, SystemUser, Banner } from '../../types';
import { getImageUrl } from '../../utils/imageUrl';

// SystemUser is imported from types/index.ts

export const AdminDashboard: React.FC = () => {
  const {
    products,
    addProduct,
    updateProductInventory,
    deleteProduct,
    offlineSales,
    setOfflineSales,
    orders,
    addOfflineSale,
    importOfflineSales,
    tickets,
    resolveSupportTicket,
    banners,
    updateBanner,
    addBanner,
    deleteBannerState,
    refreshBanners
  } = useApp();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('products');
  const [isMobileGrid, setIsMobileGrid] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileGrid(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch categories list when categories tab becomes active
  useEffect(() => {
    if (activeTab === 'categories' && categoriesList.length === 0) {
      fetchCategories();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // --- Add Product Form Toggling ---
  const [showAddProductForm, setShowAddProductForm] = useState(false);

  // --- Add Product Form State ---
  const [newProd, setNewProd] = useState({
    name: '',
    category: 'dark' as Product['category'],
    price: 0,
    weight: '100g',
    description: '',
    ingredients: '',
    badge: '' as Product['badge'] | '',
    imageFiles: [] as File[],
    imagePreviewUrls: [] as string[],
    stock: 10,
    calories: '550 kcal',
    totalFat: '35g',
    saturatedFat: '20g',
    cholesterol: '0mg',
    sodium: '15mg',
    totalCarb: '50g',
    protein: '7g',
  });
  const [productAddedSuccess, setProductAddedSuccess] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);

  // --- Dynamic local state for stock/units sold to keep them interactive ---
  // Stock is now stored in the Product object from backend (product.stock)
  const [productMetrics, setProductMetrics] = useState<{ [productId: string]: { stock: number; sold: number } }>({});

  // --- Edit Product State ---
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingProductImageFiles, setEditingProductImageFiles] = useState<File[]>([]);
  const [editingProductImagePreviews, setEditingProductImagePreviews] = useState<string[]>([]);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // --- Inventory Editor State ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState(0);
  const [editWeight, setEditWeight] = useState('');
  const [editStock, setEditStock] = useState(0);

  const imageInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle image file selection — stores the File object for FormData upload.
   * Generates a local object URL for preview only (not sent to backend).
   * The actual file will be sent as multipart/form-data via productService.createProduct().
   */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const validFiles = files.filter(file => allowed.includes(file.type.toLowerCase()));
    
    if (validFiles.length !== files.length) {
      alert('Some files were invalid format. Please select only JPG, JPEG, PNG, or WebP images.');
    }
    
    const validSizeFiles = validFiles.filter(file => file.size <= 10 * 1024 * 1024);
    if (validSizeFiles.length !== validFiles.length) {
      alert('Some files were too large. Maximum size is 10 MB per image.');
    }

    if (!validSizeFiles.length) {
      if (imageInputRef.current) imageInputRef.current.value = '';
      return;
    }

    const previewUrls = validSizeFiles.map(file => URL.createObjectURL(file));
    setNewProd(prev => ({ 
      ...prev, 
      imageFiles: [...prev.imageFiles, ...validSizeFiles], 
      imagePreviewUrls: [...prev.imagePreviewUrls, ...previewUrls] 
    }));
  };

  // Handle adding product — calls productService.createProduct with real FormData
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || newProd.price <= 0) return;
    if (isCreatingProduct) return;

    setIsCreatingProduct(true);

    // Build FormData for multipart/form-data submission to backend
    const formData = new FormData();
    formData.append('name', newProd.name);
    formData.append('category', newProd.category);
    formData.append('price', String(newProd.price));
    formData.append('weight', newProd.weight);
    formData.append('description', newProd.description);
    formData.append('ingredients', newProd.ingredients);
    formData.append('stock', String(newProd.stock));
    if (newProd.badge) formData.append('badge', newProd.badge);
    if (newProd.imageFiles.length > 0) {
      formData.append('image', newProd.imageFiles[0]);
      newProd.imageFiles.forEach(file => formData.append('gallery_images', file));
    }
    // Nutrition fields
    formData.append('nutrition_calories', newProd.calories);
    formData.append('nutrition_total_fat', newProd.totalFat);
    formData.append('nutrition_saturated_fat', newProd.saturatedFat);
    formData.append('nutrition_cholesterol', newProd.cholesterol);
    formData.append('nutrition_sodium', newProd.sodium);
    formData.append('nutrition_total_carb', newProd.totalCarb);
    formData.append('nutrition_protein', newProd.protein);

    try {
      const created = await productService.createProduct(formData);
      addProduct(created);
      setProductAddedSuccess(true);
      setNewProd({
        name: '',
        category: dynamicCategoryOptions[0]?.value || 'dark-chocolate',
        price: 0,
        weight: '100g',
        description: '',
        ingredients: '',
        badge: '',
        imageFiles: [],
        imagePreviewUrls: [],
        stock: 10,
        calories: '550 kcal',
        totalFat: '35g',
        saturatedFat: '20g',
        cholesterol: '0mg',
        sodium: '15mg',
        totalCarb: '50g',
        protein: '7g',
      });
      setTimeout(() => {
        setProductAddedSuccess(false);
        setShowAddProductForm(false);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to create product:', err);
      const detail = err?.detail || err?.message || 'Failed to create product. Please try again.';
      alert(detail);
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (isUpdatingProduct) return;

    setIsUpdatingProduct(true);
    try {
      await productService.updateProduct(editingProduct.id, {
        name: editingProduct.name,
        price: editingProduct.price,
        stock: editingProduct.stock,
        category: editingProduct.category,
      });
      if (editingProductImageFiles.length > 0) {
        const formData = new FormData();
        editingProductImageFiles.forEach(file => formData.append('images', file));
        await productService.updateProductImage(editingProduct.id, formData);
        window.location.reload();
        return;
      }
      updateProductInventory(editingProduct.id, editingProduct.weight, editingProduct.price, editingProduct.stock ?? 0);
      setEditingProduct(null);
      setEditingProductImageFiles([]);
      setEditingProductImagePreviews([]);
    } catch (err: any) {
      console.error('Failed to update product:', err);
      alert(err?.detail || err?.message || 'Failed to update product');
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  // Handle inventory edit save — calls inventoryService.updateStock + productService.updateProduct
  const handleSaveInventory = async (productId: string) => {
    try {
      // Update price, weight, and stock via product service
      await productService.updateProduct(productId, { price: editPrice, weight: editWeight, stock: editStock });
      // Update stock log via inventory service
      await inventoryService.updateStock({ product_id: productId, new_stock: editStock, reason: 'Admin manual update' });
      // Update local context
      updateProductInventory(productId, editWeight, editPrice, editStock);
      setProductMetrics((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], stock: editStock },
      }));

    } catch (err: any) {
      console.error('Failed to update inventory:', err);
      const detail = err?.detail || err?.message || 'Failed to update inventory. Please try again.';
      alert(detail);
    }
    setEditingId(null);
  };

  // --- Offline Sales State ---
  const [saleBasket, setSaleBasket] = useState<{ productName: string; quantity: number; totalPrice: number }[]>([]);
  const [manualSale, setManualSale] = useState({
    productName: 'Belgian Dark Truffle Bar',
    quantity: 1,
    totalPrice: 849,
    paymentMethod: 'Cash',
  });
  const [saleAddedSuccess, setSaleAddedSuccess] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Customers Inspector State — fetched from backend on mount ---
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [inspectedCustomer, setInspectedCustomer] = useState<SystemUser | null>(null);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);

  // --- Testimonials & Contact Messages & Story Video States ---
  const [testimonialsList, setTestimonialsList] = useState<any[]>([]);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [newTestimonial, setNewTestimonial] = useState({
    author: '',
    title: '',
    text: '',
    rating: 5,
    initials: '',
  });
  const [testimonialAvatarFile, setTestimonialAvatarFile] = useState<File | null>(null);
  const [uploadingTestimonial, setUploadingTestimonial] = useState(false);
  const [storyVideoFile, setStoryVideoFile] = useState<File | null>(null);
  const [uploadingStoryVideo, setUploadingStoryVideo] = useState(false);
  const [storyVideoUrl, setStoryVideoUrl] = useState('');

  // --- Coupons State ---
  const [couponsList, setCouponsList] = useState<any[]>([]);
  const initialCouponState = {
    code: '',
    name: '',
    description: '',
    discount_type: 'PERCENTAGE',
    discount_percent: 0,
    discount_amount: 0,
    maximum_discount_amount: 0,
    minimum_order_amount: 0,
    start_at: '',
    expires_at: '',
    usage_limit: 0,
    per_user_usage_limit: 1,
    eligibility_rule: 'ALL_USERS',
    eligibility_value: '',
    applicability: 'ENTIRE_STORE',
    applicable_ids: '',
    is_active: true,
  };
  const [newCoupon, setNewCoupon] = useState(initialCouponState);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);

  // --- Analytics State ---
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  // =============================================================
  // CATEGORIES STATE
  // =============================================================
  const [categoriesList, setCategoriesList] = useState<AdminCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null);
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState<string>('');
  const [editCategoryImageFile, setEditCategoryImageFile] = useState<File | null>(null);
  const [editCategoryImagePreview, setEditCategoryImagePreview] = useState<string>('');
  const [categorySuccess, setCategorySuccess] = useState(false);
  const categoryImageRef = useRef<HTMLInputElement>(null);
  const editCategoryImageRef = useRef<HTMLInputElement>(null);

  const [newCategory, setNewCategory] = useState({
    name: '',
    slug: '',
    description: '',
    sort_order: 0,
    is_active: true,
  });

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const data = await categoryService.adminGetAllCategories();
      setCategoriesList(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name) return;
    try {
      const formData = new FormData();
      formData.append('name', newCategory.name);
      if (newCategory.slug) formData.append('slug', newCategory.slug);
      if (newCategory.description) formData.append('description', newCategory.description);
      formData.append('sort_order', String(newCategory.sort_order));
      formData.append('is_active', String(newCategory.is_active));
      if (categoryImageFile) formData.append('image', categoryImageFile);

      const created = await categoryService.adminCreateCategory(formData);
      setCategoriesList((prev) => [...prev, created]);
      setNewCategory({ name: '', slug: '', description: '', sort_order: 0, is_active: true });
      setCategoryImageFile(null);
      setCategoryImagePreview('');
      setCategorySuccess(true);
      setTimeout(() => {
        setCategorySuccess(false);
        setShowAddCategoryForm(false);
      }, 2000);
    } catch (err: any) {
      alert(err?.detail || err?.message || 'Failed to create category.');
    }
  };

  const handleEditCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      // Upload new image if selected
      if (editCategoryImageFile) {
        const fd = new FormData();
        fd.append('image', editCategoryImageFile);
        const res = await categoryService.adminUploadCategoryImage(editingCategory.id, fd);
        editingCategory.image_url = res.image_url;
      }
      await categoryService.adminUpdateCategory(editingCategory.id, {
        name: editingCategory.name,
        slug: editingCategory.slug,
        description: editingCategory.description,
        sort_order: editingCategory.sort_order,
        is_active: editingCategory.is_active,
      });
      setCategoriesList((prev) =>
        prev.map((c) => (c.id === editingCategory.id ? { ...editingCategory } : c))
      );
      setEditingCategory(null);
      setEditCategoryImageFile(null);
      setEditCategoryImagePreview('');
    } catch (err: any) {
      alert(err?.detail || err?.message || 'Failed to update category.');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"? This cannot be undone.`)) return;
    try {
      await categoryService.adminDeleteCategory(id);
      setCategoriesList((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err?.detail || err?.message || 'Failed to delete category.');
    }
  };

  const handleToggleCategoryStatus = async (cat: AdminCategory) => {
    try {
      const updated = await categoryService.adminUpdateCategory(cat.id, { is_active: !cat.is_active });
      setCategoriesList((prev) => prev.map((c) => (c.id === cat.id ? updated : c)));
    } catch (err: any) {
      alert('Failed to toggle category status.');
    }
  };

  const handleEditBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;
    try {
      await updateBanner(editingBanner.id, editingBanner);
      setEditingBanner(null);
    } catch (error) {
      console.error('Failed to update banner:', error);
      alert('Failed to update banner.');
    }
  };

  const fetchExtraAdminData = () => {
    adminService.getUsers().then((users) => setSystemUsers(users)).catch((err) => console.error(err));
    adminService.getContactMessages().then((msgs) => setContactMessages(msgs)).catch(() => { });
    adminService.getStoryVideo().then((res) => { if (res?.video_url) setStoryVideoUrl(res.video_url); }).catch(() => { });
    adminService.getCoupons().then((coupons) => setCouponsList(coupons)).catch(() => { });
    adminService.getStats().then(stats => setDashboardStats(stats)).catch(() => {});
  };
  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.description) return;
    try {
      const payload = {
        ...newCoupon,
        applicable_ids: typeof newCoupon.applicable_ids === 'string' ? newCoupon.applicable_ids.split(',').map(s=>s.trim()).filter(Boolean) : newCoupon.applicable_ids
      };
      const created = await adminService.createCoupon(payload);
      setCouponsList([created, ...couponsList]);
      setNewCoupon(initialCouponState);
    } catch (err: any) {
      console.error(err);
      alert(err.detail || 'Failed to create coupon');
    }
  };

  const handleUpdateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;
    try {
      const payload = {
        ...editingCoupon,
        applicable_ids: typeof editingCoupon.applicable_ids === 'string' ? editingCoupon.applicable_ids.split(',').map(s=>s.trim()).filter(Boolean) : editingCoupon.applicable_ids
      };
      const updated = await adminService.updateCoupon(editingCoupon.code, payload);
      setCouponsList((prev) => prev.map((c) => (c.code === editingCoupon.code ? updated : c)));
      setEditingCoupon(null);
    } catch (err: any) {
      console.error(err);
      alert(err.detail || 'Failed to update coupon');
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await adminService.deleteCoupon(code);
      setCouponsList(prev => prev.filter(c => c.code !== code));
    } catch (err: any) {
      console.error(err);
      alert(err.detail || 'Failed to delete coupon');
    }
  };

  // --- Reward Settings State & Handlers ---
  const [rewardSettingsForm, setRewardSettingsForm] = useState<RewardSettings>({
    reward_system_enabled: true,
    spend_per_coin: 10,
    coins_per_rupee: 10,
    max_redemption_percentage: 20,
  });
  const [isSavingRewardSettings, setIsSavingRewardSettings] = useState(false);
  const [rewardSettingsSaved, setRewardSettingsSaved] = useState(false);

  // Manual coin adjustment state
  const [adjustCoinForm, setAdjustCoinForm] = useState({ user_id: '', coins: 100, reason: 'Customer Goodwill' });
  const [isAdjustingCoins, setIsAdjustingCoins] = useState(false);
  const [adjustCoinsSuccess, setAdjustCoinsSuccess] = useState(false);

  useEffect(() => {
    if (activeTab === 'reward-settings') {
      walletService.getRewardSettings()
        .then((res) => setRewardSettingsForm(res))
        .catch(() => {});
    }
  }, [activeTab]);

  const handleSaveRewardSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingRewardSettings(true);
    try {
      await walletService.updateRewardSettings(rewardSettingsForm);
      setRewardSettingsSaved(true);
      setTimeout(() => setRewardSettingsSaved(false), 3000);
    } catch (err: any) {
      alert(err?.message || 'Failed to save reward settings');
    } finally {
      setIsSavingRewardSettings(false);
    }
  };

  const handleAdjustCoinsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustCoinForm.user_id.trim()) {
      alert('Please enter a User ID');
      return;
    }
    setIsAdjustingCoins(true);
    try {
      await walletService.adminAdjustCoins(adjustCoinForm.user_id, adjustCoinForm.coins, adjustCoinForm.reason);
      setAdjustCoinsSuccess(true);
      setTimeout(() => setAdjustCoinsSuccess(false), 3000);
      setAdjustCoinForm({ user_id: '', coins: 100, reason: 'Customer Goodwill' });
    } catch (err: any) {
      alert(err?.message || 'Failed to adjust coins');
    } finally {
      setIsAdjustingCoins(false);
    }
  };
  const [siteStats, setSiteStats] = useState({
    happy_customers: 26000,
    unique_flavors: 120,
    countries_shipped: 15,
    five_star_reviews_percent: 98,
  });
  const [isSavingStats, setIsSavingStats] = useState(false);
  const [statsSavedSuccess, setStatsSavedSuccess] = useState(false);

  const fetchSiteStats = () => {
    fetch('http://localhost:8000/api/v1/home/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === 'object') {
          setSiteStats({
            happy_customers: data.happy_customers ?? 26000,
            unique_flavors: data.unique_flavors ?? 120,
            countries_shipped: data.countries_shipped ?? 15,
            five_star_reviews_percent: data.five_star_reviews_percent ?? 98,
          });
        }
      })
      .catch(() => {});
  };

  const handleSaveSiteStatsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingStats(true);
    try {
      await adminService.updateSiteStats(siteStats);
      setStatsSavedSuccess(true);
      setTimeout(() => setStatsSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err?.message || 'Failed to save site stats');
    } finally {
      setIsSavingStats(false);
    }
  };

  // --- Instagram Reels State & Handlers ---
  const [cmsReels, setCmsReels] = useState<any[]>([]);
  const [showAddReelModal, setShowAddReelModal] = useState(false);
  const [newReelData, setNewReelData] = useState({ title: '', likes: '14.2K', comments: '348', views: '124K views', video_url: '' });
  const [newReelVideoFile, setNewReelVideoFile] = useState<File | null>(null);
  const [isCreatingReel, setIsCreatingReel] = useState(false);

  const fetchCmsReels = () => {
    fetch('http://localhost:8000/api/v1/home/reels')
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setCmsReels(data); })
      .catch(() => {});
  };

  const handleCreateReelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReelData.title) return;
    setIsCreatingReel(true);
    const formData = new FormData();
    formData.append('title', newReelData.title);
    formData.append('likes', newReelData.likes || '14.2K');
    formData.append('comments', newReelData.comments || '348');
    formData.append('views', newReelData.views || '124K views');
    formData.append('video_url', newReelData.video_url || '');
    if (newReelVideoFile) formData.append('video', newReelVideoFile);

    try {
      await adminService.createReel(formData);
      fetchCmsReels();
      setShowAddReelModal(false);
      setNewReelData({ title: '', likes: '14.2K', comments: '348', views: '124K views', video_url: '' });
      setNewReelVideoFile(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to publish reel video');
    } finally {
      setIsCreatingReel(false);
    }
  };

  const handleDeleteReelSubmit = async (reelId: string, title: string) => {
    if (!window.confirm(`Delete reel video "${title}"?`)) return;
    try {
      await adminService.deleteReel(reelId);
      setCmsReels((prev) => prev.filter((r) => r.id !== reelId));
    } catch (err: any) {
      alert('Failed to delete reel');
    }
  };

  // --- Banner/Carousel State & Handlers ---
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

  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const currentBanner = banners[selectedSlideIdx];
    if (currentBanner) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await adminService.uploadBannerImage(currentBanner.id, formData);
        if (updateBanner) updateBanner(currentBanner.id, { image: res.image_url });
        alert('Banner image uploaded successfully!');
      } catch (err: any) {
        alert(err?.message || 'Failed to upload banner image.');
      }
    }
    if (bannerFileRef.current) bannerFileRef.current.value = '';
  };

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
    } catch (err: any) {
      setBannerCreateError(err?.message || 'Failed to create banner slide.');
    } finally {
      setIsCreatingBanner(false);
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (!window.confirm('Are you sure you want to delete this hero banner slide?')) return;
    try {
      await adminService.deleteBanner(bannerId);
      if (deleteBannerState) deleteBannerState(bannerId);
      if (refreshBanners) await refreshBanners();
      setSelectedSlideIdx(0);
    } catch (err: any) {
      alert('Failed to delete banner.');
    }
  };

  // Testimonial Moderation & Review State
  const [testimonialStatusFilter, setTestimonialStatusFilter] = useState<string>('all');
  const [reviewsList, setReviewsList] = useState<any[]>([]);

  const fetchAdminTestimonials = (status?: string) => {
    adminService.adminGetTestimonials(status)
      .then(data => { if (Array.isArray(data)) setTestimonialsList(data); })
      .catch((err) => { console.error('Failed to load admin testimonials:', err); });
  };

  const fetchAdminReviews = () => {
    adminService.adminGetReviews()
      .then(data => { if (Array.isArray(data)) setReviewsList(data); })
      .catch((err) => { console.error('Failed to load admin reviews:', err); });
  };

  useEffect(() => {
    fetchExtraAdminData();
    fetchSiteStats();
    fetchCmsReels();
    fetchCategories();
    fetchAdminTestimonials(testimonialStatusFilter);
    fetchAdminReviews();
  }, []);

  // Compute dynamic category options from database categories
  const dynamicCategoryOptions = React.useMemo(() => {
    if (categoriesList && categoriesList.length > 0) {
      return categoriesList
        .filter((cat) => cat.is_active !== false)
        .map((cat) => ({
          value: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'),
          label: cat.name,
        }));
    }
    return [
      { value: 'dark-chocolate', label: 'Dark Chocolate' },
      { value: 'milk-chocolate', label: 'Milk Chocolate' },
      { value: 'gift-hamper', label: 'Gift Hamper' },
      { value: 'white-chocolate', label: 'White Chocolate' },
    ];
  }, [categoriesList]);

  useEffect(() => {
    if (dynamicCategoryOptions.length > 0 && (!newProd.category || !dynamicCategoryOptions.some(o => o.value === newProd.category))) {
      setNewProd(prev => ({ ...prev, category: dynamicCategoryOptions[0].value as any }));
    }
  }, [dynamicCategoryOptions]);

  const handleStatusFilterChange = (status: string) => {
    setTestimonialStatusFilter(status);
    fetchAdminTestimonials(status);
  };

  const handleApproveTestimonial = async (id: string) => {
    try {
      await adminService.updateTestimonialStatus(id, 'approved');
      fetchAdminTestimonials(testimonialStatusFilter);
    } catch (err: any) {
      alert(err?.message || 'Failed to approve testimonial');
    }
  };

  const handleRejectTestimonial = async (id: string) => {
    try {
      await adminService.updateTestimonialStatus(id, 'rejected');
      fetchAdminTestimonials(testimonialStatusFilter);
    } catch (err: any) {
      alert(err?.message || 'Failed to reject testimonial');
    }
  };

  const handleAddTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestimonial.author || !newTestimonial.text) return;
    setUploadingTestimonial(true);

    const formData = new FormData();
    formData.append('author', newTestimonial.author);
    formData.append('title', newTestimonial.title || 'Chocolate Enthusiast');
    formData.append('text', newTestimonial.text);
    formData.append('rating', String(newTestimonial.rating));
    formData.append('initials', newTestimonial.initials || newTestimonial.author.slice(0, 2).toUpperCase());
    if (testimonialAvatarFile) {
      formData.append('avatar', testimonialAvatarFile);
    }

    try {
      await adminService.createTestimonial(formData);
      alert('Testimonial created successfully!');
      setNewTestimonial({ author: '', title: '', text: '', rating: 5, initials: '' });
      setTestimonialAvatarFile(null);
      fetchAdminTestimonials(testimonialStatusFilter);
    } catch (err: any) {
      alert(err?.message || 'Failed to create testimonial');
    } finally {
      setUploadingTestimonial(false);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!window.confirm('Delete this testimonial permanently?')) return;
    try {
      await adminService.deleteTestimonial(id);
      fetchAdminTestimonials(testimonialStatusFilter);
    } catch (err: any) {
      alert('Failed to delete testimonial');
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('Delete this product review? The product average rating will be recalculated.')) return;
    try {
      await adminService.adminDeleteReview(id);
      fetchAdminReviews();
    } catch (err: any) {
      alert('Failed to delete product review');
    }
  };

  const handleDeleteContactMessage = async (id: string) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await adminService.deleteContactMessage(id);
      setContactMessages(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      alert('Failed to delete contact message');
    }
  };

  const handleUploadStoryVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storyVideoFile) {
      alert('Please select a video file first.');
      return;
    }
    setUploadingStoryVideo(true);
    const formData = new FormData();
    formData.append('video', storyVideoFile);

    try {
      const result = await adminService.uploadStoryVideo(formData);
      setStoryVideoUrl(result.video_url);
      alert('Our Story process video updated successfully!');
      setStoryVideoFile(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to upload video.');
    } finally {
      setUploadingStoryVideo(false);
    }
  };

  const handleDeleteStoryVideo = async () => {
    if (!window.confirm('Reset Our Story crafting video to default?')) return;
    try {
      const res = await adminService.deleteStoryVideo();
      setStoryVideoUrl(res.video_url);
      alert('Crafting video reset to default.');
    } catch (err: any) {
      alert('Failed to reset video.');
    }
  };

  // Customer Support contact details state
  const [supportContactData, setSupportContactData] = useState({
    phone: '+91 98765 43210',
    whatsapp: '+91 98765 43210',
    email: 'support@chovique.com',
    support_hours: 'Mon - Sat: 10:00 AM - 8:00 PM | Sunday: 11:00 AM - 6:00 PM',
    address: '42, MG Road, Indiranagar, Bangalore, Karnataka 560038',
  });
  const [updatingContact, setUpdatingContact] = useState(false);

  useEffect(() => {
    adminService.getContactInfo().then((res) => {
      if (res) {
        setSupportContactData({
          phone: res.phone || '+91 98765 43210',
          whatsapp: res.whatsapp || res.phone || '+91 98765 43210',
          email: res.email || 'support@chovique.com',
          support_hours: res.support_hours || 'Mon - Sat: 10:00 AM - 8:00 PM | Sunday: 11:00 AM - 6:00 PM',
          address: res.address || '42, MG Road, Indiranagar, Bangalore, Karnataka 560038',
        });
      }
    }).catch(() => { });
  }, []);

  const handleUpdateSupportContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingContact(true);
    try {
      await adminService.updateContactInfo(supportContactData);
      alert('Customer Support details updated successfully!');
    } catch (err: any) {
      alert(err?.message || 'Failed to update Customer Support details.');
    } finally {
      setUpdatingContact(false);
    }
  };


  // Trigger file select dialog
  const triggerFileSelect = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  /**
   * Handle CSV file upload for bulk offline sales import.
   * Sends the raw CSV file to the backend as multipart/form-data.
   * All CSV parsing is handled server-side.
   */
  const handleFileUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setImporting(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await adminService.importOfflineSales(formData);
      setImportSuccess(true);
      console.log(`Imported ${result.imported} sales records, skipped ${result.skipped}.`);
      // Refresh offline sales list from backend
      adminService.getOfflineSales()
        .then((sales) => setOfflineSales(sales))
        .catch(() => { });
      setTimeout(() => setImportSuccess(false), 4000);
    } catch (err) {
      console.error('CSV upload error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to upload CSV file.';
      alert(msg);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle manual sales entry - Add to local basket
  const handleAddToBasket = (e: React.FormEvent) => {
    e.preventDefault();
    setSaleBasket(prev => [
      ...prev,
      {
        productName: manualSale.productName,
        quantity: manualSale.quantity,
        totalPrice: manualSale.totalPrice,
      }
    ]);
    // Reset selection quantity
    const selectedProd = products.find(p => p.name === manualSale.productName);
    const price = selectedProd ? selectedProd.price : 0;
    setManualSale(prev => ({
      ...prev,
      quantity: 1,
      totalPrice: price,
    }));
  };

  // Remove item from local basket
  const handleRemoveFromBasket = (index: number) => {
    setSaleBasket(prev => prev.filter((_, idx) => idx !== index));
  };

  // Handle manual batch sales logging — calls adminService.addOfflineSale for each basket item
  const handleLogTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saleBasket.length === 0) {
      alert('Please add at least one product to the basket first.');
      return;
    }

    try {
      for (const item of saleBasket) {
        const created = await adminService.addOfflineSale({
          product_name: item.productName,
          quantity: item.quantity,
          total_price: item.totalPrice,
          payment_method: manualSale.paymentMethod,
        });
        addOfflineSale({
          productName: created.productName,
          quantity: created.quantity,
          totalPrice: created.totalPrice,
          paymentMethod: created.paymentMethod,
        });
      }
      setSaleBasket([]);
      setSaleAddedSuccess(true);
      setTimeout(() => setSaleAddedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to log transaction:', err);
      const msg = err instanceof Error ? err.message : 'Failed to log sales.';
      alert(msg);
    }
  };

  // Specific Customer Inspection Details
  const getCustomerOrders = (customerEmail: string) => {
    const nameToMatch = inspectedCustomer ? inspectedCustomer.name.toLowerCase() : '';
    return orders.filter((o: any) =>
      o.shippingAddress.name.toLowerCase() === nameToMatch ||
      o.shippingAddress.phone.includes('98765') // Fallback matching
    );
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)' }}>
      {/* Sidebar navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Admin Content box */}
      <div className="admin-workspace">
        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--cream)', margin: 0 }}>
                Products Catalog
              </h1>
              <Button
                variant="gold"
                glow
                onClick={() => setShowAddProductForm(!showAddProductForm)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {showAddProductForm ? <X size={16} /> : <Plus size={16} />}
                {showAddProductForm ? 'Cancel Creation' : 'Add Product'}
              </Button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: showAddProductForm ? (isMobileGrid ? '1fr' : '1.4fr 1.1fr') : '1fr',
                gap: '40px',
                alignItems: 'flex-start',
              }}
            >
              {/* Product list Table */}
              <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)', overflowX: 'auto', background: 'transparent' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Weight</th>
                      <th>Price</th>
                      <th>Available Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((prod) => {
                      const displayStock = prod.stock !== undefined ? prod.stock : (productMetrics[prod.id]?.stock ?? 0);
                      return (
                        <tr key={prod.id}>
                          <td>
                            <img
                              src={getImageUrl(prod.image)}
                              alt={prod.name}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1548907040-4d42b52115ca?auto=format&fit=crop&w=600&q=80';
                              }}
                              style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                            />
                          </td>
                          <td>{prod.name}</td>
                          <td style={{ textTransform: 'capitalize', color: 'var(--beige)' }}>
                            {categoriesList.find(c => c.slug === prod.category || c.name.toLowerCase().includes(prod.category))?.name || (
                              prod.category === 'dark' ? 'Dark Chocolate' :
                              prod.category === 'milk' ? 'Milk Chocolate' :
                              prod.category === 'white' ? 'White Chocolate' :
                              prod.category === 'gift' ? 'Gift Hamper' :
                              prod.category === 'beverage' ? 'Beverage' : prod.category
                            )}
                          </td>
                          <td>{prod.weight}</td>
                          <td>₹{prod.price}</td>
                          <td>
                            <span
                              style={{
                                fontWeight: 700,
                                color: displayStock < 10 ? 'var(--rose-gold)' : 'var(--cream)',
                              }}
                            >
                              {displayStock} units
                            </span>
                          </td>
                          <td>
                            <button onClick={() => {
                              setEditingProduct(prod);
                              setEditingProductImageFiles([]);
                              setEditingProductImagePreviews([]);
                            }} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px' }}>
                              <Edit2 size={14} />
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${prod.name}?`)) {
                                  deleteProduct(prod.id);
                                }
                              }}
                              style={{ color: 'var(--rose-gold)', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Add Product Form */}
              <AnimatePresence>
                {showAddProductForm && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="glass-panel"
                    style={{
                      padding: '30px',
                      border: '1px solid var(--gold)',
                      background: 'transparent',
                    }}
                  >
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--cream)', marginBottom: '20px' }}>
                      Create New Chocolate
                    </h3>
                    <form onSubmit={handleAddProduct}>
                      <Input
                        label="Chocolate Name"
                        required
                        value={newProd.name}
                        onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                      />

                      <Select
                        label="Category"
                        options={dynamicCategoryOptions}
                        value={newProd.category}
                        onChange={(e) => setNewProd({ ...newProd, category: e.target.value as any })}
                      />

                      <Select
                        label="Badge / Section Tag"
                        options={[
                          { value: '', label: 'None (Standard Product)' },
                          { value: 'New', label: 'New (Shows in New Arrivals section)' },
                          { value: 'Bestseller', label: 'Bestseller (Shows in Bestsellers section)' },
                          { value: 'Premium', label: 'Premium (Shows in Popular / Premium section)' },
                          { value: 'Gift Hamper', label: 'Gift Hamper (Shows in Gift Hampers section)' },
                          { value: 'Signature', label: 'Signature (Shows in Signature Collection)' },
                          { value: 'Limited', label: 'Limited Edition' },
                        ]}
                        value={newProd.badge || ''}
                        onChange={(e) => setNewProd({ ...newProd, badge: e.target.value as any })}
                      />


                      <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1fr 1fr', gap: '15px' }}>
                        <Input
                          label="Price (₹)"
                          type="number"
                          required
                          value={newProd.price || ''}
                          onChange={(e) => setNewProd({ ...newProd, price: parseFloat(e.target.value) })}
                        />
                        <Input
                          label="Weight"
                          placeholder="e.g. 150g"
                          required
                          value={newProd.weight}
                          onChange={(e) => setNewProd({ ...newProd, weight: e.target.value })}
                        />
                      </div>

                      {/* File Upload image field */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '15px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--beige)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Product Images (Max 10MB each)
                        </label>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                          {newProd.imagePreviewUrls.length > 0 ? (
                            newProd.imagePreviewUrls.map((url, idx) => (
                              <img
                                key={idx}
                                src={url}
                                alt={`Preview ${idx + 1}`}
                                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--gold)' }}
                              />
                            ))
                          ) : (
                            <div style={{
                              width: '50px',
                              height: '50px',
                              borderRadius: '4px',
                              border: '1px dashed var(--glass-border)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--grey-light)',
                              fontSize: '0.7rem'
                            }}>
                              No files
                            </div>
                          )}
                          <div style={{ flexGrow: 1 }}>
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/jpg, image/webp"
                              multiple
                              ref={imageInputRef}
                              onChange={handleImageUpload}
                              style={{ display: 'none' }}
                            />
                            <Button
                              variant="glass"
                              type="button"
                              onClick={() => imageInputRef.current?.click()}
                              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', fontSize: '0.8rem' }}
                            >
                              <UploadCloud size={14} />
                              Choose Image
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Input
                        label="Initial Stock Units"
                        type="number"
                        required
                        min={0}
                        value={newProd.stock}
                        onChange={(e) => setNewProd({ ...newProd, stock: parseInt(e.target.value) || 0 })}
                      />

                      <Input
                        label="Ingredients"
                        placeholder="Ghanaian Cocoa Mass..."
                        value={newProd.ingredients}
                        onChange={(e) => setNewProd({ ...newProd, ingredients: e.target.value })}
                      />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '15px' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--beige)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Product Description
                        </label>
                        <textarea
                          rows={3}
                          value={newProd.description}
                          onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                          style={{
                            padding: '12px',
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--cream)',
                            borderRadius: '4px',
                            resize: 'none',
                            outline: 'none',
                          }}
                        />
                      </div>

                      {productAddedSuccess && (
                        <div style={{ padding: '10px', background: 'rgba(46,204,113,0.1)', color: '#2ecc71', borderRadius: '4px', marginBottom: '15px', fontSize: '0.85rem' }}>
                          ✓ Chocolate catalog item created successfully!
                        </div>
                      )}

                      <Button variant="gold" fullWidth type="submit" disabled={isCreatingProduct} glow>
                        {isCreatingProduct ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                            Creating Product...
                          </span>
                        ) : (
                          'Create Product'
                        )}
                      </Button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--cream)', margin: 0 }}>
                Categories
              </h1>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button variant="secondary" onClick={fetchCategories} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                  <Loader2 size={14} style={{ ...(categoriesLoading ? { animation: 'spin 1s linear infinite' } : {}) }} />
                  Refresh
                </Button>
                <Button
                  variant="gold"
                  glow
                  onClick={() => setShowAddCategoryForm(!showAddCategoryForm)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {showAddCategoryForm ? <X size={16} /> : <Plus size={16} />}
                  {showAddCategoryForm ? 'Cancel' : 'Add Category'}
                </Button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: showAddCategoryForm ? (isMobileGrid ? '1fr' : '1.4fr 1fr') : '1fr', gap: '40px', alignItems: 'flex-start' }}>
              {/* Category List Table */}
              <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)', overflowX: 'auto', background: 'transparent' }}>
                {categoriesLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gold)' }}>
                    <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : categoriesList.length === 0 ? (
                  <p style={{ color: 'var(--beige)', textAlign: 'center', padding: '40px', opacity: 0.7 }}>
                    No categories yet. Add your first category!
                  </p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Sort Order</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoriesList.map((cat) => (
                        <tr key={cat.id}>
                          <td style={{ color: 'var(--cream)', fontWeight: 600 }}>{cat.name}</td>
                          <td style={{ color: 'var(--beige)', textAlign: 'center' }}>{cat.sort_order}</td>
                          <td>
                            <button
                              onClick={() => handleToggleCategoryStatus(cat)}
                              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, background: cat.is_active ? 'rgba(90,190,90,0.1)' : 'rgba(255,80,80,0.1)', color: cat.is_active ? '#6fbf6f' : '#f07070', border: `1px solid ${cat.is_active ? 'rgba(90,190,90,0.3)' : 'rgba(255,80,80,0.3)'}`, cursor: 'pointer', transition: 'all 0.2s ease' }}
                              title={cat.is_active ? 'Click to deactivate' : 'Click to activate'}
                            >
                              {cat.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                              {cat.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => {
                                  setEditingCategory({ ...cat });
                                  setEditCategoryImageFile(null);
                                  setEditCategoryImagePreview('');
                                }}
                                style={{ color: 'var(--gold)', padding: '6px', borderRadius: '4px', background: 'rgba(200,160,60,0.08)', transition: 'background 0.2s' }}
                                title="Edit category"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                style={{ color: 'var(--rose-gold)', padding: '6px', borderRadius: '4px', background: 'rgba(183,110,121,0.08)', transition: 'background 0.2s' }}
                                title="Delete category"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Add Category Form */}
              {showAddCategoryForm && (
                <div className="glass-panel" style={{ padding: '28px', border: '1px solid var(--glass-border)', background: 'transparent' }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--gold)', marginBottom: '24px', margin: '0 0 24px 0' }}>
                    {categorySuccess ? (
                      <span style={{ color: '#6fbf6f', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={18} /> Category Created!
                      </span>
                    ) : 'New Category'}
                  </h2>
                  <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Input
                      label="Category Name *"
                      placeholder="e.g. Dark Chocolate"
                      value={newCategory.name}
                      onChange={(e) => {
                        const slug = e.target.value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
                        setNewCategory((p) => ({ ...p, name: e.target.value, slug }));
                      }}
                      required
                    />
                    <Input
                      label="Slug (auto-generated)"
                      placeholder="dark-chocolate"
                      value={newCategory.slug}
                      onChange={(e) => setNewCategory((p) => ({ ...p, slug: e.target.value }))}
                    />
                    <div>
                      <label style={{ fontSize: '0.85rem', color: 'var(--beige)', display: 'block', marginBottom: '6px' }}>Description</label>
                      <textarea
                        placeholder="Optional short description..."
                        value={newCategory.description}
                        onChange={(e) => setNewCategory((p) => ({ ...p, description: e.target.value }))}
                        rows={2}
                        style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'var(--cream)', padding: '10px', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}
                      />
                    </div>
                    <Input
                      label="Sort Order"
                      type="number"
                      value={String(newCategory.sort_order)}
                      onChange={(e) => setNewCategory((p) => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))}
                    />
                    <div>
                      <label style={{ fontSize: '0.85rem', color: 'var(--beige)', display: 'block', marginBottom: '8px' }}>Category Image</label>
                      <input
                        ref={categoryImageRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setCategoryImageFile(file);
                          if (file) setCategoryImagePreview(URL.createObjectURL(file));
                          else setCategoryImagePreview('');
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => categoryImageRef.current?.click()}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'rgba(255,255,255,0.04)', border: '1px dashed var(--glass-border)', borderRadius: '4px', color: 'var(--beige)', cursor: 'pointer', width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
                      >
                        <ImagePlus size={16} style={{ color: 'var(--gold)' }} />
                        {categoryImageFile ? categoryImageFile.name : 'Upload Image (optional)'}
                      </button>
                      {categoryImagePreview && (
                        <img src={categoryImagePreview} alt="preview" style={{ marginTop: '10px', width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--glass-border)' }} />
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--beige)' }}>Active</label>
                      <button
                        type="button"
                        onClick={() => setNewCategory((p) => ({ ...p, is_active: !p.is_active }))}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', color: newCategory.is_active ? '#6fbf6f' : 'var(--beige)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                      >
                        {newCategory.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                        {newCategory.is_active ? 'Yes' : 'No'}
                      </button>
                    </div>
                    <Button variant="gold" type="submit" style={{ marginTop: '8px' }}>
                      <Plus size={16} /> Create Category
                    </Button>
                  </form>
                </div>
              )}
            </div>

            {/* Edit Category Modal */}
            {editingCategory && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div className="glass-panel" style={{ padding: '32px', maxWidth: '500px', width: '100%', border: '1px solid var(--glass-border)', borderRadius: '8px', background: 'var(--dark-chocolate)', maxHeight: '90vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--gold)', margin: 0 }}>Edit Category</h2>
                    <button onClick={() => { setEditingCategory(null); setEditCategoryImageFile(null); setEditCategoryImagePreview(''); }} style={{ color: 'var(--rose-gold)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <X size={20} />
                    </button>
                  </div>
                  <form onSubmit={handleEditCategorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Input
                      label="Name *"
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory((p) => p ? { ...p, name: e.target.value } : p)}
                      required
                    />
                    <Input
                      label="Slug"
                      value={editingCategory.slug}
                      onChange={(e) => setEditingCategory((p) => p ? { ...p, slug: e.target.value } : p)}
                    />
                    <div>
                      <label style={{ fontSize: '0.85rem', color: 'var(--beige)', display: 'block', marginBottom: '6px' }}>Description</label>
                      <textarea
                        value={editingCategory.description || ''}
                        onChange={(e) => setEditingCategory((p) => p ? { ...p, description: e.target.value } : p)}
                        rows={2}
                        style={{ width: '100%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'var(--cream)', padding: '10px', fontSize: '0.9rem', resize: 'vertical', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}
                      />
                    </div>
                    <Input
                      label="Sort Order"
                      type="number"
                      value={String(editingCategory.sort_order)}
                      onChange={(e) => setEditingCategory((p) => p ? { ...p, sort_order: parseInt(e.target.value) || 0 } : p)}
                    />
                    <div>
                      <label style={{ fontSize: '0.85rem', color: 'var(--beige)', display: 'block', marginBottom: '8px' }}>Category Image</label>
                      {editingCategory.image_url && !editCategoryImagePreview && (
                        <img src={editingCategory.image_url} alt="current" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--glass-border)', marginBottom: '8px' }} />
                      )}
                      {editCategoryImagePreview && (
                        <img src={editCategoryImagePreview} alt="new preview" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--gold)', marginBottom: '8px' }} />
                      )}
                      <input
                        ref={editCategoryImageRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setEditCategoryImageFile(file);
                          if (file) setEditCategoryImagePreview(URL.createObjectURL(file));
                          else setEditCategoryImagePreview('');
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => editCategoryImageRef.current?.click()}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'rgba(255,255,255,0.04)', border: '1px dashed var(--glass-border)', borderRadius: '4px', color: 'var(--beige)', cursor: 'pointer', width: '100%', justifyContent: 'center', fontSize: '0.82rem' }}
                      >
                        <ImagePlus size={14} style={{ color: 'var(--gold)' }} />
                        {editCategoryImageFile ? editCategoryImageFile.name : 'Change Image'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--beige)' }}>Active</label>
                      <button
                        type="button"
                        onClick={() => setEditingCategory((p) => p ? { ...p, is_active: !p.is_active } : p)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', color: editingCategory.is_active ? '#6fbf6f' : 'var(--beige)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                      >
                        {editingCategory.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                        {editingCategory.is_active ? 'Yes' : 'No'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <Button variant="secondary" type="button" onClick={() => { setEditingCategory(null); setEditCategoryImageFile(null); setEditCategoryImagePreview(''); }} style={{ flex: 1 }}>
                        Cancel
                      </Button>
                      <Button variant="gold" type="submit" style={{ flex: 1 }}>
                        <Check size={16} /> Save Changes
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* REWARD SETTINGS TAB */}
        {activeTab === 'reward-settings' && (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--cream)', marginBottom: '35px' }}>
              Customer Rewards & Coins System
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1fr 1fr', gap: '30px', alignItems: 'flex-start' }}>
              {/* Rules Configuration Form */}
              <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--gold)', marginBottom: '20px' }}>
                  System Earning & Redemption Rules
                </h3>

                <form onSubmit={handleSaveRewardSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', border: '1px solid var(--glass-border)' }}>
                    <span style={{ color: 'var(--cream)', fontSize: '0.9rem', fontWeight: 600 }}>Enable Reward System</span>
                    <input
                      type="checkbox"
                      checked={rewardSettingsForm.reward_system_enabled}
                      onChange={(e) => setRewardSettingsForm({ ...rewardSettingsForm, reward_system_enabled: e.target.checked })}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--gold)', cursor: 'pointer' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--gold)', marginBottom: '6px' }}>
                      ₹ Spent per 1 Coin Earned
                    </label>
                    <Input
                      type="number"
                      value={rewardSettingsForm.spend_per_coin}
                      onChange={(e) => setRewardSettingsForm({ ...rewardSettingsForm, spend_per_coin: Number(e.target.value) })}
                      required
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--grey-light)' }}>
                      Example: 10 means customer earns 1 coin for every ₹10 spent.
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--gold)', marginBottom: '6px' }}>
                      Coins Needed for ₹1 Discount
                    </label>
                    <Input
                      type="number"
                      value={rewardSettingsForm.coins_per_rupee}
                      onChange={(e) => setRewardSettingsForm({ ...rewardSettingsForm, coins_per_rupee: Number(e.target.value) })}
                      required
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--grey-light)' }}>
                      Example: 10 means 10 coins = ₹1 discount value.
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--gold)', marginBottom: '6px' }}>
                      Maximum Order Redemption Limit (%)
                    </label>
                    <Input
                      type="number"
                      value={rewardSettingsForm.max_redemption_percentage}
                      onChange={(e) => setRewardSettingsForm({ ...rewardSettingsForm, max_redemption_percentage: Number(e.target.value) })}
                      required
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--grey-light)' }}>
                      Example: 20 means coins can pay up to max 20% of order value.
                    </span>
                  </div>

                  {rewardSettingsSaved && (
                    <div style={{ padding: '10px', background: 'rgba(46,204,113,0.1)', color: '#2ecc71', borderRadius: '4px', fontSize: '0.85rem' }}>
                      ✓ Reward system parameters updated successfully!
                    </div>
                  )}

                  <Button variant="gold" type="submit" disabled={isSavingRewardSettings} glow style={{ marginTop: '10px' }}>
                    {isSavingRewardSettings ? 'Saving Settings...' : 'Save Reward Rules'}
                  </Button>
                </form>
              </div>

              {/* Manual Customer Coin Adjustment Tool */}
              <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--gold)', marginBottom: '20px' }}>
                  Manual Customer Coin Adjustment
                </h3>

                <form onSubmit={handleAdjustCoinsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--gold)', marginBottom: '6px' }}>
                      Customer User ID
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. 303e18e4-3915-4e0e-8e4f-872769238882"
                      value={adjustCoinForm.user_id}
                      onChange={(e) => setAdjustCoinForm({ ...adjustCoinForm, user_id: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--gold)', marginBottom: '6px' }}>
                      Coins Adjustment (+ or -)
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 100 or -50"
                      value={adjustCoinForm.coins}
                      onChange={(e) => setAdjustCoinForm({ ...adjustCoinForm, coins: Number(e.target.value) })}
                      required
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--grey-light)' }}>
                      Enter positive value to credit coins (+100) or negative to deduct (-50).
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--gold)', marginBottom: '6px' }}>
                      Reason / Audit Log Note
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Customer goodwill / refund resolution"
                      value={adjustCoinForm.reason}
                      onChange={(e) => setAdjustCoinForm({ ...adjustCoinForm, reason: e.target.value })}
                      required
                    />
                  </div>

                  {adjustCoinsSuccess && (
                    <div style={{ padding: '10px', background: 'rgba(46,204,113,0.1)', color: '#2ecc71', borderRadius: '4px', fontSize: '0.85rem' }}>
                      ✓ Manual coin adjustment recorded successfully!
                    </div>
                  )}

                  <Button variant="gold" type="submit" disabled={isAdjustingCoins} glow style={{ marginTop: '10px' }}>
                    {isAdjustingCoins ? 'Processing Adjustment...' : 'Submit Coin Adjustment'}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--cream)', marginBottom: '35px' }}>
              Inventory Management
            </h1>

            <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Weight Config</th>
                      <th>Price Config</th>
                      <th>Available Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((prod) => {
                      const displayStock = prod.stock !== undefined ? prod.stock : (productMetrics[prod.id]?.stock ?? 0);
                      return (
                        <tr key={prod.id}>
                          <td>{prod.name}</td>
                          <td>
                            {editingId === prod.id ? (
                              <input
                                type="text"
                                value={editWeight}
                                onChange={(e) => setEditWeight(e.target.value)}
                                style={{
                                  padding: '6px',
                                  background: 'rgba(0,0,0,0.3)',
                                  border: '1px solid var(--gold)',
                                  color: 'white',
                                  borderRadius: '4px',
                                  width: '90px',
                                }}
                              />
                            ) : (
                              prod.weight
                            )}
                          </td>
                          <td>
                            {editingId === prod.id ? (
                              <input
                                type="number"
                                value={editPrice}
                                onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                                style={{
                                  padding: '6px',
                                  background: 'rgba(0,0,0,0.3)',
                                  border: '1px solid var(--gold)',
                                  color: 'white',
                                  borderRadius: '4px',
                                  width: '90px',
                                }}
                              />
                            ) : (
                              `₹${prod.price}`
                            )}
                          </td>
                          <td>
                            {editingId === prod.id ? (
                              <input
                                type="number"
                                value={editStock}
                                onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                                style={{
                                  padding: '6px',
                                  background: 'rgba(0,0,0,0.3)',
                                  border: '1px solid var(--gold)',
                                  color: 'white',
                                  borderRadius: '4px',
                                  width: '90px',
                                }}
                              />
                            ) : (
                              <span style={{ fontWeight: 700, color: displayStock < 10 ? 'var(--rose-gold)' : 'var(--cream)' }}>
                                {displayStock} units
                              </span>
                            )}
                          </td>

                          <td>
                            {editingId === prod.id ? (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <Button
                                  variant="gold"
                                  size="sm"
                                  onClick={() => handleSaveInventory(prod.id)}
                                >
                                  Save
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => setEditingId(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingId(prod.id);
                                  setEditPrice(prod.price);
                                  setEditWeight(prod.weight);
                                  setEditStock(displayStock);


                                }}
                                style={{ color: 'var(--gold)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Edit2 size={14} />
                                Adjust
                              </button>
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

        {/* OFFLINE SALES TAB */}
        {activeTab === 'offline-sales' && (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--cream)', marginBottom: '35px' }}>
              Boutique Offline Sales Ledger
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1.2fr 1fr', gap: '40px', alignItems: 'flex-start' }}>
              {/* Sales ledger list */}
              <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)', overflowX: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)' }}>
                    Ledger Entries
                  </h3>
                  {/* File Upload Hidden form */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUploadChange}
                    accept=".csv, .txt, .xlsx"
                    style={{ display: 'none' }}
                  />
                  <Button variant="glass" size="sm" onClick={triggerFileSelect} disabled={importing}>
                    <UploadCloud size={16} />
                    {importing ? 'Parsing CSV...' : 'Import CSV Sheet'}
                  </Button>
                </div>

                {importSuccess && (
                  <div style={{ padding: '12px', background: 'rgba(46,204,113,0.1)', color: '#2ecc71', borderRadius: '4px', marginBottom: '15px', fontSize: '0.85rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <CheckCircle size={16} /> File upload parsed! Boutique sales ledger synchronized.
                  </div>
                )}

                <div className="admin-table-wrapper" style={{ overflowY: 'auto', maxHeight: '450px' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Receipt ID</th>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Payment</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {offlineSales.map((sale) => (
                        <tr key={sale.id}>
                          <td style={{ fontSize: '0.8rem', color: 'var(--gold)' }}>{sale.id}</td>
                          <td>{sale.productName}</td>
                          <td>{sale.quantity}</td>
                          <td>{sale.paymentMethod}</td>
                          <td style={{ fontWeight: 600 }}>₹{sale.totalPrice}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Manual Entry Form */}
              <div className="glass-panel" style={{ padding: '30px', border: '1px solid var(--glass-border)', background: 'rgba(26,13,0,0.4)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--cream)', marginBottom: '20px' }}>
                  Record Offline Sale
                </h3>

                {/* Form to add item to basket */}
                <form onSubmit={handleAddToBasket} style={{ marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px dashed var(--glass-border)' }}>
                  <Select
                    label="Select Product Sold"
                    value={manualSale.productName}
                    options={products.map((p) => ({ value: p.name, label: p.name }))}
                    onChange={(e) => {
                      const prodName = e.target.value;
                      const selectedProd = products.find((p) => p.name === prodName);
                      const price = selectedProd ? selectedProd.price * manualSale.quantity : 0;
                      setManualSale({ ...manualSale, productName: prodName, totalPrice: price });
                    }}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1.2fr 1fr', gap: '15px', alignItems: 'end', marginBottom: '15px' }}>
                    <Input
                      label="Quantity"
                      type="number"
                      value={manualSale.quantity}
                      min={1}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value) || 1;
                        const selectedProd = products.find((p) => p.name === manualSale.productName);
                        const price = selectedProd ? selectedProd.price * qty : 0;
                        setManualSale({ ...manualSale, quantity: qty, totalPrice: price });
                      }}
                      style={{ marginBottom: 0 }}
                    />
                    <Button variant="secondary" type="submit" style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      Add to Basket
                    </Button>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--beige)', textAlign: 'right' }}>
                    Item Total: <strong style={{ color: 'var(--gold)' }}>₹{manualSale.totalPrice}</strong>
                  </div>
                </form>

                {/* Basket List & Final Submission */}
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--cream)', marginBottom: '12px' }}>
                    Basket Items ({saleBasket.length})
                  </h4>
                  {saleBasket.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--grey-light)', fontStyle: 'italic', marginBottom: '20px' }}>
                      No items added yet. Use the selector above.
                    </p>
                  ) : (
                    <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {saleBasket.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '4px', fontSize: '0.85rem' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--cream)' }}>{item.productName}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--grey-light)' }}>Qty: {item.quantity} × ₹{item.totalPrice / item.quantity}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <strong style={{ color: 'var(--gold)' }}>₹{item.totalPrice}</strong>
                            <button type="button" onClick={() => handleRemoveFromBasket(idx)} style={{ color: 'var(--rose-gold)', fontSize: '0.75rem' }}>Remove</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: '15px' }} />

                  <form onSubmit={handleLogTransaction}>
                    <Select
                      label="Payment Method"
                      value={manualSale.paymentMethod}
                      options={[
                        { value: 'Cash', label: 'Cash payment' },
                        { value: 'Card', label: 'Card Swiped' },
                        { value: 'UPI', label: 'UPI / Scan code' },
                      ]}
                      onChange={(e) => setManualSale({ ...manualSale, paymentMethod: e.target.value })}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '15px 0 20px 0' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--beige)' }}>Total Transaction Amount:</span>
                      <strong style={{ fontSize: '1.2rem', color: 'var(--gold)' }}>
                        ₹{saleBasket.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString()}
                      </strong>
                    </div>

                    {saleAddedSuccess && (
                      <div style={{ padding: '10px', background: 'rgba(46,204,113,0.1)', color: '#2ecc71', borderRadius: '4px', marginBottom: '15px', fontSize: '0.85rem' }}>
                        ✓ Offline sales transaction logged successfully!
                      </div>
                    )}

                    <Button variant="gold" fullWidth type="submit" glow disabled={saleBasket.length === 0}>
                      Log Transaction
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COUPONS TAB */}
        {activeTab === 'coupons' && (
          <div>
            <span className="section-label">Promotions</span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--cream)', marginBottom: '35px' }}>
              Coupons & Discounts
            </h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'stretch' }}>
              {/* Create Coupon Form */}
              <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '20px' }}>Create New Coupon</h3>
                <form onSubmit={handleAddCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <Input label="Coupon Code (e.g. SUMMER10)" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} required />
                    <Input label="Coupon Name" value={newCoupon.name} onChange={e => setNewCoupon({...newCoupon, name: e.target.value})} required />
                  </div>
                  <Input label="Description" value={newCoupon.description} onChange={e => setNewCoupon({...newCoupon, description: e.target.value})} required />
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.85rem', color: 'var(--beige)' }}>Discount Type</label>
                    <select value={newCoupon.discount_type} onChange={e => setNewCoupon({...newCoupon, discount_type: e.target.value})} style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }}>
                      <option value="PERCENTAGE">Percentage (%)</option>
                      <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                      <option value="FREE_SHIPPING">Free Shipping</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    {newCoupon.discount_type === 'PERCENTAGE' && (
                      <Input label="Discount Percent (%)" type="number" min={1} max={100} value={newCoupon.discount_percent} onChange={e => setNewCoupon({...newCoupon, discount_percent: parseFloat(e.target.value) || 0})} required />
                    )}
                    {newCoupon.discount_type === 'FIXED_AMOUNT' && (
                      <Input label="Discount Amount (₹)" type="number" min={1} value={newCoupon.discount_amount} onChange={e => setNewCoupon({...newCoupon, discount_amount: parseFloat(e.target.value) || 0})} required />
                    )}
                    {newCoupon.discount_type !== 'FREE_SHIPPING' && (
                      <Input label="Maximum Discount (Optional)" type="number" min={0} value={newCoupon.maximum_discount_amount} onChange={e => setNewCoupon({...newCoupon, maximum_discount_amount: parseFloat(e.target.value) || 0})} />
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <Input label="Minimum Order Value" type="number" min={0} value={newCoupon.minimum_order_amount} onChange={e => setNewCoupon({...newCoupon, minimum_order_amount: parseFloat(e.target.value) || 0})} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--beige)' }}>Eligibility Rule</label>
                      <select value={newCoupon.eligibility_rule} onChange={e => setNewCoupon({...newCoupon, eligibility_rule: e.target.value, eligibility_value: ''})} style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }}>
                        <option value="ALL_USERS">All Users</option>
                        <option value="FIRST_ORDER">First Order Only</option>
                        <option value="INACTIVE_CUSTOMER">Inactive Customers (180+ days)</option>
                        <option value="MIN_LIFETIME_SPEND">Min Lifetime Spend</option>
                        <option value="SPECIFIC_USERS">Specific Users</option>
                      </select>
                    </div>
                  </div>

                  {(newCoupon.eligibility_rule === 'MIN_LIFETIME_SPEND' || newCoupon.eligibility_rule === 'SPECIFIC_USERS') && (
                     <Input label={newCoupon.eligibility_rule === 'MIN_LIFETIME_SPEND' ? "Minimum Spend Amount (₹)" : "User IDs (comma separated)"} value={newCoupon.eligibility_value} onChange={e => setNewCoupon({...newCoupon, eligibility_value: e.target.value})} required />
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--beige)' }}>Applicability</label>
                      <select value={newCoupon.applicability} onChange={e => setNewCoupon({...newCoupon, applicability: e.target.value, applicable_ids: ''})} style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px' }}>
                        <option value="ENTIRE_STORE">Entire Store</option>
                        <option value="SPECIFIC_PRODUCTS">Specific Products</option>
                        <option value="SPECIFIC_CATEGORIES">Specific Categories</option>
                      </select>
                    </div>
                    {newCoupon.applicability !== 'ENTIRE_STORE' && (
                       <Input label="Applicable IDs (comma separated)" value={newCoupon.applicable_ids} onChange={e => setNewCoupon({...newCoupon, applicable_ids: e.target.value})} required />
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <Input label="Usage Limit (Total)" type="number" min={0} value={newCoupon.usage_limit} onChange={e => setNewCoupon({...newCoupon, usage_limit: parseInt(e.target.value) || 0})} />
                    <Input label="Limit Per User" type="number" min={1} value={newCoupon.per_user_usage_limit} onChange={e => setNewCoupon({...newCoupon, per_user_usage_limit: parseInt(e.target.value) || 1})} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <Input label="Start Date (Optional)" type="date" value={newCoupon.start_at || ''} onChange={e => setNewCoupon({...newCoupon, start_at: e.target.value})} />
                    <Input label="Expiry Date (Required)" type="date" value={newCoupon.expires_at || ''} onChange={e => setNewCoupon({...newCoupon, expires_at: e.target.value})} required />
                  </div>
                  
                  <p style={{ fontSize: '0.75rem', color: 'var(--grey-light)', margin: '-5px 0 5px 0' }}>
                    Discount is dynamically computed during checkout.
                  </p>
                  <Button variant="gold" fullWidth type="submit" glow>Create Coupon</Button>
                </form>
              </div>

              {/* Coupons List */}
              <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '20px' }}>Active &amp; Past Coupons</h3>
                {couponsList.length === 0 ? (
                  <p style={{ color: 'var(--beige)', fontSize: '0.9rem' }}>No coupons found.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {couponsList.map((c: any) => {
                      const isExpired = c.expires_at ? new Date(c.expires_at) < new Date() : false;
                      const isInactive = !c.is_active || isExpired;
                      return (
                        <div key={c.id || c.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--gold)' }}>{c.code}</span>
                              {isInactive ? (
                                <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(255,0,0,0.2)', color: '#ff6b6b', borderRadius: '4px', fontWeight: 700 }}>
                                  {isExpired ? 'INACTIVE (EXPIRED)' : 'INACTIVE'}
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(46,204,113,0.2)', color: '#2ecc71', borderRadius: '4px', fontWeight: 700 }}>
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--beige)', marginTop: '4px' }}>{c.description}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 600, marginTop: '4px' }}>
                              {c.discount_type === 'PERCENTAGE' ? `${c.discount_percent}% OFF` : c.discount_type === 'FIXED_AMOUNT' ? `₹${c.discount_amount} OFF` : 'FREE SHIPPING'}
                              {c.usage_count !== undefined && <span style={{color: 'var(--grey-light)', marginLeft: '10px'}}>(Used: {c.usage_count})</span>}
                            </div>
                            {c.expires_at && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--grey-light)', marginTop: '4px' }}>
                                Expires: {new Date(c.expires_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={() => setEditingCoupon({ ...c })}
                              style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: '4px', cursor: 'pointer', padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Edit Coupon"
                            >
                              <Edit2 size={14} /> Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteCoupon(c.code)}
                              style={{ background: 'rgba(255,0,0,0.15)', border: '1px solid #ff6b6b', color: '#ff6b6b', borderRadius: '4px', cursor: 'pointer', padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Delete Coupon"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Edit Coupon Modal */}
            {editingCoupon && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '30px', border: '1px solid var(--gold)', background: 'rgba(20,10,0,0.95)' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--gold)', marginBottom: '20px' }}>
                    Edit Coupon: {editingCoupon.code}
                  </h3>
                  <form onSubmit={handleUpdateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <Input 
                      label="Description" 
                      value={editingCoupon.description || ''} 
                      onChange={e => setEditingCoupon({...editingCoupon, description: e.target.value})}
                      required
                    />
                    <Input 
                      label="Discount Percent (%)" 
                      type="number"
                      min={1}
                      max={100}
                      value={editingCoupon.discount_percent || 0} 
                      onChange={e => setEditingCoupon({...editingCoupon, discount_percent: parseFloat(e.target.value) || 0})}
                      required
                    />
                    <Input 
                      label="Expiry Date (Required)" 
                      type="date"
                      value={editingCoupon.expires_at ? editingCoupon.expires_at.slice(0, 10) : ''} 
                      onChange={e => setEditingCoupon({...editingCoupon, expires_at: e.target.value})}
                      required
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                      <input 
                        type="checkbox"
                        id="coupon-active-check"
                        checked={editingCoupon.is_active ?? true}
                        onChange={e => setEditingCoupon({...editingCoupon, is_active: e.target.checked})}
                      />
                      <label htmlFor="coupon-active-check" style={{ color: 'var(--cream)', fontSize: '0.9rem', cursor: 'pointer' }}>
                        Active Status (Check to enable coupon)
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '15px' }}>
                      <Button variant="gold" type="submit" style={{ flex: 1 }}>Save Changes</Button>
                      <button 
                        type="button"
                        onClick={() => setEditingCoupon(null)}
                        style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--grey-mid)', color: 'var(--cream)', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* REVENUE TAB */}
        {activeTab === 'revenue' && (
          <div>
            <span className="section-label">Enterprise</span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--cream)', marginBottom: '35px' }}>
              Revenue Analytics
            </h1>
            
            <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '20px' }}>Sales Over Time</h3>
              {dashboardStats?.monthly_revenue ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
                  {dashboardStats.monthly_revenue.map((m: any, i: number) => (
                    <div key={i} style={{ padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                      <div style={{ color: 'var(--beige)', fontSize: '0.9rem', marginBottom: '8px' }}>{m.month}</div>
                      <div style={{ color: 'var(--gold)', fontSize: '1.2rem', fontWeight: 'bold' }}>₹{m.revenue.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--beige)' }}>Loading revenue data...</p>
              )}
            </div>
          </div>
        )}

        {/* SALES COMPARISON TAB */}
        {activeTab === 'sales-comparison' && (
          <div>
            <span className="section-label">Enterprise</span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--cream)', marginBottom: '35px' }}>
              Top Products & Sales
            </h1>
            
            <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '20px' }}>Top Selling Products</h3>
              {dashboardStats?.top_products ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {dashboardStats.top_products.map((p: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: 'var(--cream)' }}>{p.product_name}</span>
                      <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{p.units_sold} units</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--beige)' }}>Loading product sales data...</p>
              )}
            </div>
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <div>
            <span className="section-label">Access & Orders</span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--cream)', marginBottom: '35px' }}>
              Customer directory & Inspector
            </h1>

            {/* Split layout: Customers Directory List & Inspector Panel */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1.2fr 1fr', gap: '30px', alignItems: 'flex-start' }}>

              {/* Customer Inspection List */}
              <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '15px' }}>
                  Interactive Customer Directory
                </h3>
                <p style={{ color: 'var(--beige)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  Click a customer profile card to inspect their complete order history, spend metrics, and verify stock availability.
                </p>

                <div style={{ marginBottom: '20px' }}>
                  <Input
                    placeholder="Search by name, email, or order ID..."
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(() => {
                    const query = customerSearchQuery.trim().toLowerCase();
                    const filtered = systemUsers.filter(u => u.role === 'customer').filter(cust => {
                      if (!query) return true;
                      const nameMatch = cust.name.toLowerCase().includes(query);
                      const emailMatch = cust.email.toLowerCase().includes(query);

                      // Match order ID
                      const custOrders = orders.filter((o: any) =>
                        o.shippingAddress.name.toLowerCase() === cust.name.toLowerCase()
                      );
                      const orderIdMatch = custOrders.some((o: any) => o.id.toLowerCase().includes(query));

                      return nameMatch || emailMatch || orderIdMatch;
                    });

                    if (filtered.length === 0) {
                      return (
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--grey-light)', fontSize: '0.9rem' }}>
                          No matching customers or order numbers found.
                        </div>
                      );
                    }

                    return filtered.map((cust) => {
                      // Get this specific customer's orders
                      const customerOrders = orders.filter((o: any) =>
                        o.shippingAddress.name.toLowerCase() === cust.name.toLowerCase()
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: 'var(--chocolate-brown)',
                              color: 'var(--gold)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 600,
                              fontSize: '0.85rem',
                              border: '1px solid var(--gold)',
                            }}>
                              {cust.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 style={{ margin: 0, color: 'var(--cream)', fontSize: '1rem', fontWeight: 600 }}>{cust.name}</h4>
                              <span style={{ fontSize: '0.75rem', color: 'var(--grey-light)' }}>{cust.email}</span>
                            </div>
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
                    });
                  })()}
                </div>
              </div>

              {/* Inspected Customer Detail Card */}
              <AnimatePresence>
                {inspectedCustomer ? (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
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
                        background: 'transparent',
                        border: 'none',
                      }}
                    >
                      <X size={20} />
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'var(--chocolate-brown)',
                        color: 'var(--gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '1rem',
                        border: '2px solid var(--gold)',
                      }}>
                        {inspectedCustomer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--cream)', margin: 0 }}>
                          {inspectedCustomer.name}
                        </h2>
                        <p style={{ color: 'var(--beige)', fontSize: '0.8rem', margin: 0 }}>{inspectedCustomer.email}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Orders list */}
                      <div>
                        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold)', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                          Customer Order History
                        </h4>

                        {getCustomerOrders(inspectedCustomer.email).length === 0 ? (
                          <p style={{ color: 'var(--grey-light)', fontSize: '0.85rem', fontStyle: 'italic' }}>No orders found for this customer.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                            {getCustomerOrders(inspectedCustomer.email).map((ord: any) => (
                              <div
                                key={ord.id}
                                style={{
                                  padding: '10px 14px',
                                  background: 'rgba(0,0,0,0.15)',
                                  borderRadius: '6px',
                                  borderLeft: '3px solid var(--gold)',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <div>
                                  <span style={{ fontWeight: 700, color: 'var(--cream)', fontSize: '0.85rem' }}>{ord.id}</span>
                                  <span style={{ fontSize: '0.7rem', color: 'var(--grey-light)', marginLeft: '8px' }}>{ord.date}</span>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--grey-light)', marginTop: '2px' }}>
                                    Status: <span style={{ color: ord.status === 'Delivered' ? '#2ecc71' : 'var(--gold)', fontWeight: 600 }}>{ord.status}</span>
                                  </div>
                                </div>
                                <span style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '0.85rem' }}>₹{ord.total.toLocaleString('en-IN')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Purchased products & stock statuses */}
                      <div>
                        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold)', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                          Items Bought & Stock Status
                        </h4>

                        {getCustomerOrders(inspectedCustomer.email).length === 0 ? (
                          <p style={{ color: 'var(--grey-light)', fontSize: '0.85rem', fontStyle: 'italic' }}>No products purchased.</p>
                        ) : (
                          <div className="admin-table-wrapper" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                            <table className="admin-table" style={{ fontSize: '0.8rem' }}>
                              <thead>
                                <tr>
                                  <th>Item</th>
                                  <th>Qty</th>
                                  <th>In-Stock</th>
                                </tr>
                              </thead>
                              <tbody>
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
                                      <td>{data.qty}</td>
                                      <td>
                                        <span style={{
                                          color: data.low ? 'var(--rose-gold)' : '#2ecc71',
                                          fontWeight: 700
                                        }}>
                                          {data.available} available
                                        </span>
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
                  </motion.div>
                ) : (
                  <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', border: '1px dashed var(--glass-border)', color: 'var(--grey-light)', fontSize: '0.9rem' }}>
                    Select a customer card from directory to inspect detailed information.
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* HOMEPAGE CMS & BANNER MANAGEMENT TAB */}
        {activeTab === 'home-mgmt' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <span className="section-label">Homepage CMS</span>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--cream)', margin: 0 }}>
                  Hero Banners &amp; Homepage Management
                </h1>
              </div>
              <Button variant="gold" glow onClick={() => setShowAddBannerModal(!showAddBannerModal)}>
                {showAddBannerModal ? <X size={16} /> : <Plus size={16} />}
                {showAddBannerModal ? 'Close Form' : 'Add Hero Slide'}
              </Button>
            </div>

            {/* Expandable Add Banner Form */}
            <AnimatePresence>
              {showAddBannerModal && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: '30px' }}>
                  <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--gold)', background: 'rgba(26,13,0,0.85)', borderRadius: '12px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--cream)', marginBottom: '16px', fontSize: '1.3rem' }}>
                      Add New Hero Banner Slide
                    </h3>
                    <form onSubmit={handleCreateNewBanner} style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1fr 1fr', gap: '16px' }}>
                      <Input label="Main Heading / Title" required placeholder="Handcrafted Chocolate Masterpieces" value={newBannerData.title} onChange={(e) => setNewBannerData({ ...newBannerData, title: e.target.value })} />
                      <Input label="Subtitle Description" placeholder="Made with Ghanaian cocoa mass..." value={newBannerData.subtitle} onChange={(e) => setNewBannerData({ ...newBannerData, subtitle: e.target.value })} />
                      <Input label="Category Tag (e.g. Artisanal Series)" placeholder="Artisanal Series" value={newBannerData.tag} onChange={(e) => setNewBannerData({ ...newBannerData, tag: e.target.value })} />
                      <Input label="Button Label (CTA)" placeholder="Explore Collection" value={newBannerData.buttonText} onChange={(e) => setNewBannerData({ ...newBannerData, buttonText: e.target.value })} />
                      <Input label="Target Link URL" placeholder="/products" value={newBannerData.link} onChange={(e) => setNewBannerData({ ...newBannerData, link: e.target.value })} />
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--beige)' }}>Banner Image File:</span>
                        <input ref={newBannerFileInputRef} type="file" accept="image/*" onChange={(e) => setNewBannerImageFile(e.target.files?.[0] || null)} style={{ marginTop: '6px', background: 'rgba(0,0,0,0.3)', color: 'var(--cream)', padding: '6px', width: '100%', borderRadius: '4px' }} />
                      </div>
                      {bannerCreateError && (
                        <p style={{ gridColumn: isMobileGrid ? 'span 1' : 'span 2', color: 'var(--rose-gold)', fontSize: '0.85rem', margin: 0 }}>{bannerCreateError}</p>
                      )}
                      <div style={{ gridColumn: isMobileGrid ? 'span 1' : 'span 2', display: 'flex', gap: '12px', marginTop: '10px' }}>
                        <Button variant="gold" type="submit" glow disabled={isCreatingBanner}>{isCreatingBanner ? 'Creating Slide...' : 'Create Hero Slide'}</Button>
                        <Button variant="glass" type="button" onClick={() => setShowAddBannerModal(false)}>Cancel</Button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Banner Slides List & Preview */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1fr 2fr', gap: '24px', marginBottom: '40px' }}>
              {/* Slide selector list */}
              <div className="glass-panel" style={{ padding: '20px', border: '1px solid var(--glass-border)' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--cream)', marginBottom: '16px', fontSize: '1.1rem' }}>Active Hero Slides ({banners?.length || 0})</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {banners?.map((b, idx) => (
                    <div
                      key={b.id || idx}
                      onClick={() => setSelectedSlideIdx(idx)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        background: selectedSlideIdx === idx ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.03)',
                        border: selectedSlideIdx === idx ? '1px solid var(--gold)' : '1px solid var(--glass-border)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600 }}>Slide {idx + 1}</span>
                        <p style={{ margin: '2px 0 0 0', color: 'var(--cream)', fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{b.title}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingBanner(b); }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', fontSize: '0.8rem' }}
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteBanner(b.id); }}
                        style={{ color: 'var(--rose-gold)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slide Details & Image Upload */}
              {selectedBanner ? (
                <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontSize: '1.2rem', margin: 0 }}>Slide {selectedSlideIdx + 1}: {selectedBanner.title}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--beige)' }}>{selectedBanner.tag}</span>
                  </div>
                  <p style={{ color: 'var(--cream)', fontSize: '0.9rem', marginBottom: '16px' }}>{selectedBanner.subtitle}</p>
                  
                  {selectedBanner.image && (
                    <div style={{ marginBottom: '20px', borderRadius: '8px', overflow: 'hidden', height: '200px', border: '1px solid var(--glass-border)' }}>
                      <img src={selectedBanner.image} alt={selectedBanner.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}

                  <input ref={bannerFileRef} type="file" accept="image/*" onChange={handleBannerFileUpload} style={{ display: 'none' }} />
                  <Button variant="gold" glow onClick={() => bannerFileRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UploadCloud size={16} />
                    Replace Slide Image
                  </Button>
                </div>
              ) : (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--beige)' }}>
                  No hero banners available. Click "Add Hero Slide" above to create one.
                </div>
              )}
            </div>

            {/* Platform Counter Stats Manager */}
            <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)', marginBottom: '30px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '10px' }}>
                Platform Counter Stats
              </h3>
              <p style={{ color: 'var(--beige)', fontSize: '0.85rem', marginBottom: '16px' }}>
                Configure animated stats counters displayed on the homepage counter bar.
              </p>
              <form onSubmit={handleSaveSiteStatsSubmit} style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1fr 1fr 1fr 1fr', gap: '16px', alignItems: 'flex-end' }}>
                <Input label="Happy Customers" type="number" value={siteStats.happy_customers} onChange={(e) => setSiteStats({ ...siteStats, happy_customers: parseInt(e.target.value) || 0 })} />
                <Input label="Unique Flavors" type="number" value={siteStats.unique_flavors} onChange={(e) => setSiteStats({ ...siteStats, unique_flavors: parseInt(e.target.value) || 0 })} />
                <Input label="Countries Shipped" type="number" value={siteStats.countries_shipped} onChange={(e) => setSiteStats({ ...siteStats, countries_shipped: parseInt(e.target.value) || 0 })} />
                <Input label="5-Star Reviews %" type="number" value={siteStats.five_star_reviews_percent} onChange={(e) => setSiteStats({ ...siteStats, five_star_reviews_percent: parseInt(e.target.value) || 0 })} />
                <div style={{ gridColumn: isMobileGrid ? 'span 1' : 'span 4', display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <Button variant="gold" type="submit" glow disabled={isSavingStats} style={{ height: '42px' }}>
                    {isSavingStats ? 'Saving Stats...' : statsSavedSuccess ? '✓ Counter Stats Saved!' : 'Save Counter Stats'}
                  </Button>
                </div>
              </form>
            </div>

            {/* Instagram Reels Showcase Manager */}
            <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)', margin: 0 }}>
                    Instagram Reels Showcase ({cmsReels.length})
                  </h3>
                  <p style={{ color: 'var(--beige)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                    Manage video reels displayed in the homepage Instagram section.
                  </p>
                </div>
                <Button variant="gold" size="sm" glow onClick={() => setShowAddReelModal(!showAddReelModal)}>
                  {showAddReelModal ? 'Close Form' : 'Add Reel'}
                </Button>
              </div>

              {showAddReelModal && (
                <form onSubmit={handleCreateReelSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid var(--gold)' }}>
                  <Input label="Caption / Title" required placeholder="Pouring our signature glaze... #chovique" value={newReelData.title} onChange={(e) => setNewReelData({ ...newReelData, title: e.target.value })} />
                  <Input label="Likes Display" placeholder="14.2K" value={newReelData.likes} onChange={(e) => setNewReelData({ ...newReelData, likes: e.target.value })} />
                  <Input label="Views Display" placeholder="124K views" value={newReelData.views} onChange={(e) => setNewReelData({ ...newReelData, views: e.target.value })} />
                  <Input label="Video URL" placeholder="https://..." value={newReelData.video_url} onChange={(e) => setNewReelData({ ...newReelData, video_url: e.target.value })} />
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--beige)' }}>Or Upload Video File:</span>
                    <input type="file" accept="video/*" onChange={(e) => setNewReelVideoFile(e.target.files?.[0] || null)} style={{ marginTop: '4px', color: 'var(--cream)', fontSize: '0.8rem' }} />
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', marginTop: '6px' }}>
                    <Button variant="gold" type="submit" size="sm" glow disabled={isCreatingReel}>{isCreatingReel ? 'Publishing...' : 'Publish Reel'}</Button>
                    <Button variant="secondary" type="button" size="sm" onClick={() => setShowAddReelModal(false)}>Cancel</Button>
                  </div>
                </form>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                {cmsReels.map((reel) => (
                  <div key={reel.id} style={{ padding: '16px', position: 'relative', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <button onClick={() => handleDeleteReelSubmit(reel.id, reel.title || '')} style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 5, background: 'rgba(231,76,60,0.85)', color: 'white', border: 'none', borderRadius: '50%', width: '26px', height: '26px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={14} />
                    </button>
                    <p style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '0.85rem', margin: '0 0 6px 0', paddingRight: '28px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reel.title}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>{reel.likes} Likes • {reel.views}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* HELP & COMPLAINTS PANEL */}
        {activeTab === 'complaints' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <span className="section-label">Support Helpdesk</span>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--cream)', margin: 0 }}>
                  Customer Support Ledger
                </h1>
              </div>
            </div>

            {/* Support Ticket Summary Counters */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Complaints</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0' }}>{tickets.length}</h3>
              </div>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>Pending Resolution</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0', color: 'var(--rose-gold)' }}>
                  {tickets.filter(t => t.status === 'Pending').length}
                </h3>
              </div>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '1px' }}>Resolved Issues</span>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '8px 0 0 0', color: '#2ecc71' }}>
                  {tickets.filter(t => t.status === 'Resolved').length}
                </h3>
              </div>
            </div>

            {/* Support Ticket Directory List */}
            <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--cream)', marginBottom: '20px' }}>
                Support Complaints Log
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {tickets.length === 0 ? (
                  <p style={{ color: 'var(--grey-light)', fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>
                    No customer complaints registered.
                  </p>
                ) : (
                  tickets.map((t) => {
                    const isPending = t.status === 'Pending';
                    return (
                      <div
                        key={t.id}
                        style={{
                          padding: '20px',
                          background: 'rgba(0,0,0,0.15)',
                          borderRadius: '8px',
                          borderLeft: isPending ? '4px solid var(--gold)' : '4px solid #2ecc71',
                          borderTop: '1px solid var(--glass-border)',
                          borderRight: '1px solid var(--glass-border)',
                          borderBottom: '1px solid var(--glass-border)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 700 }}>
                              {t.id} · {t.category}
                            </span>
                            <h4 style={{ margin: '4px 0 0 0', color: 'var(--cream)', fontSize: '1.1rem' }}>
                              Customer: {t.customerName} ({t.customerId})
                            </h4>
                          </div>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              fontWeight: 600,
                              background: isPending ? 'rgba(201, 168, 76, 0.15)' : 'rgba(46, 204, 113, 0.15)',
                              color: isPending ? 'var(--gold)' : '#2ecc71',
                            }}
                          >
                            {t.status}
                          </span>
                        </div>

                        <p style={{ fontSize: '0.9rem', color: 'var(--beige)', lineHeight: '1.5', margin: '0 0 15px 0' }}>
                          {t.description}
                        </p>

                        {!isPending && t.adminNotes && (
                          <div
                            style={{
                              padding: '12px',
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid var(--glass-border)',
                              borderRadius: '4px',
                              fontSize: '0.85rem',
                              color: 'var(--cream)',
                              marginBottom: '10px',
                            }}
                          >
                            <span style={{ color: 'var(--gold)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                              Admin Resolution Notes:
                            </span>
                            {t.adminNotes}
                          </div>
                        )}

                        {!isPending && t.customerResolutionFeedback && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: t.customerResolutionFeedback === 'Resolved' ? '#2ecc71' : 'var(--rose-gold)', marginTop: '8px' }}>
                            <span style={{ fontWeight: 600 }}>Customer Feedback:</span>
                            <span>{t.customerResolutionFeedback === 'Resolved' ? 'Confirmed Resolved ✓' : 'Reported Unresolved ✗'}</span>
                          </div>
                        )}

                        {isPending && (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const input = e.currentTarget.elements.namedItem('notes') as HTMLTextAreaElement;
                              const notes = input.value;
                              resolveSupportTicket(t.id, notes);
                              alert(`Ticket ${t.id} resolved and customer notified.`);
                            }}
                            style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}
                          >
                            <div style={{ marginBottom: '10px' }}>
                              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--grey-light)', marginBottom: '5px' }}>
                                Resolution Notes (Optional)
                              </label>
                              <textarea
                                name="notes"
                                placeholder="Enter details of how the issue was resolved (e.g. coupon code sent, refund processed)..."
                                rows={2}
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  background: 'rgba(0,0,0,0.3)',
                                  border: '1px solid var(--glass-border)',
                                  borderRadius: '4px',
                                  color: 'var(--cream)',
                                  fontSize: '0.85rem',
                                  outline: 'none',
                                  resize: 'none',
                                }}
                              />
                            </div>
                            <Button variant="gold" size="sm" type="submit" glow>
                              Resolve & Notify Customer
                            </Button>
                          </form>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ATELIER TESTIMONIALS TAB */}
        {activeTab === 'testimonials' && (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--cream)', marginBottom: '35px' }}>
              Testimonials & Reviews Moderation Hub
            </h1>

            {/* Testimonial Status Filter Tabs */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              {['all', 'pending', 'approved', 'rejected'].map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusFilterChange(st)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    background: testimonialStatusFilter === st ? 'var(--gold)' : 'rgba(255,255,255,0.05)',
                    color: testimonialStatusFilter === st ? 'var(--dark-chocolate)' : 'var(--cream)',
                    border: testimonialStatusFilter === st ? '1px solid var(--gold)' : '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                >
                  {st} Testimonials
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1fr 1fr', gap: '30px', alignItems: 'flex-start' }}>
              {/* Testimonials List */}
              <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '20px' }}>
                  Customer Testimonials ({testimonialsList.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '550px', overflowY: 'auto' }}>
                  {testimonialsList.length === 0 ? (
                    <p style={{ color: 'var(--beige)', fontStyle: 'italic' }}>No testimonials found in this category.</p>
                  ) : (
                    testimonialsList.map((t, idx) => {
                      const st = t.status || (t.is_active ? 'approved' : 'pending');
                      return (
                        <div
                          key={t.id || idx}
                          style={{
                            padding: '16px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '4px', color: 'var(--gold)' }}>
                              {Array.from({ length: t.rating || t.stars || 5 }).map((_, i) => (
                                <Star key={i} size={14} fill="currentColor" />
                              ))}
                            </div>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                background: st === 'approved' ? 'rgba(90,190,90,0.15)' : st === 'rejected' ? 'rgba(250,90,90,0.15)' : 'rgba(240,190,60,0.15)',
                                color: st === 'approved' ? '#6fbf6f' : st === 'rejected' ? '#f07070' : '#e0b040',
                                border: `1px solid ${st === 'approved' ? '#6fbf6f' : st === 'rejected' ? '#f07070' : '#e0b040'}`,
                              }}
                            >
                              {st}
                            </span>
                          </div>
                          <p style={{ color: 'var(--cream)', fontSize: '0.9rem', fontStyle: 'italic', margin: 0 }}>
                            "{t.text}"
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 600 }}>
                              {t.author} {t.title ? `— ${t.title}` : ''}
                            </span>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              {st !== 'approved' && t.id && (
                                <button
                                  onClick={() => handleApproveTestimonial(t.id)}
                                  style={{ background: 'rgba(90,190,90,0.2)', border: '1px solid #6fbf6f', color: '#6fbf6f', borderRadius: '4px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                >
                                  Approve
                                </button>
                              )}
                              {st !== 'rejected' && t.id && (
                                <button
                                  onClick={() => handleRejectTestimonial(t.id)}
                                  style={{ background: 'rgba(240,160,60,0.2)', border: '1px solid #e09040', color: '#e09040', borderRadius: '4px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                                >
                                  Reject
                                </button>
                              )}
                              {t.id && (
                                <button
                                  onClick={() => handleDeleteTestimonial(t.id)}
                                  style={{ color: 'var(--rose-gold)', background: 'none', border: 'none', cursor: 'pointer', padding: '3px' }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Add New Testimonial Form & Story Video Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--gold)', background: 'rgba(26,13,0,0.4)' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '20px' }}>
                    Add Atelier Testimonial
                  </h3>
                  <form onSubmit={handleAddTestimonial}>
                    <Input
                      label="Author Name"
                      required
                      value={newTestimonial.author}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, author: e.target.value })}
                    />
                    <Input
                      label="Author Title / Role"
                      placeholder="e.g. Food Critic, Mumbai"
                      value={newTestimonial.title}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, title: e.target.value })}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '15px' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--beige)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Testimonial Quote Text
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={newTestimonial.text}
                        onChange={(e) => setNewTestimonial({ ...newTestimonial, text: e.target.value })}
                        style={{
                          padding: '12px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid var(--glass-border)',
                          color: 'var(--cream)',
                          borderRadius: '4px',
                          outline: 'none',
                          resize: 'none',
                        }}
                      />
                    </div>
                    <Button variant="gold" fullWidth type="submit" disabled={uploadingTestimonial} glow>
                      {uploadingTestimonial ? 'Creating...' : 'Create Testimonial'}
                    </Button>
                  </form>
                </div>

                {/* Our Story Crafting Video Upload & Manage */}
                <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '10px' }}>
                    Our Story Process Video
                  </h3>
                  <p style={{ color: 'var(--beige)', fontSize: '0.85rem', marginBottom: '16px' }}>
                    Upload, update, or reset the crafting process video displayed on Our Story page.
                  </p>
                  <form onSubmit={handleUploadStoryVideo}>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setStoryVideoFile(e.target.files?.[0] || null)}
                      style={{ marginBottom: '15px', color: 'var(--cream)', fontSize: '0.85rem' }}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <Button variant="gold" fullWidth type="submit" disabled={uploadingStoryVideo} glow>
                        {uploadingStoryVideo ? 'Uploading...' : 'Upload Video'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Site-wide Product Reviews Moderation */}
            <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)', marginTop: '30px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '20px' }}>
                Site-Wide Product Reviews Moderation ({reviewsList.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                {reviewsList.length === 0 ? (
                  <p style={{ color: 'var(--beige)', fontStyle: 'italic' }}>No product reviews submitted yet.</p>
                ) : (
                  reviewsList.map((rev) => (
                    <div
                      key={rev.id}
                      style={{
                        padding: '14px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '6px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '16px',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.85rem' }}>★ {rev.rating}</span>
                          <span style={{ color: 'var(--cream)', fontWeight: 600, fontSize: '0.9rem' }}>{rev.author}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--grey-light)' }}>• {rev.date || 'Recent'}</span>
                        </div>
                        <p style={{ color: 'var(--beige)', fontSize: '0.85rem', margin: 0, fontStyle: 'italic' }}>
                          "{rev.text}"
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteReview(rev.id)}
                        style={{ color: 'var(--rose-gold)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}
                        title="Delete Review & Recalculate Rating"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* CONTACT MESSAGES & CUSTOMER SUPPORT MGMT TAB */}
        {activeTab === 'contact-messages' && (
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--cream)', marginBottom: '35px' }}>
              Contact Form Messages &amp; Customer Support Settings
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: isMobileGrid ? '1fr' : '1.3fr 1fr', gap: '30px', alignItems: 'flex-start' }}>
              {/* Messages Table */}
              <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '20px' }}>
                  Received Customer Inquiries
                </h3>
                <div className="admin-table-wrapper" style={{ overflowY: 'auto', maxHeight: '550px' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Subject</th>
                        <th>Message</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contactMessages.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', color: 'var(--beige)', fontStyle: 'italic', padding: '30px' }}>
                            No customer contact messages received yet.
                          </td>
                        </tr>
                      ) : (
                        contactMessages.map((msg) => (
                          <tr key={msg.id}>
                            <td style={{ fontSize: '0.8rem', color: 'var(--gold)', whiteSpace: 'nowrap' }}>{msg.created_at}</td>
                            <td style={{ fontWeight: 600, color: 'var(--cream)' }}>{msg.name}</td>
                            <td>
                              <a href={`mailto:${msg.email}`} style={{ color: 'var(--gold)', textDecoration: 'none' }}>
                                {msg.email}
                              </a>
                            </td>
                            <td>{msg.phone || '—'}</td>
                            <td>
                              <span style={{ background: 'rgba(201, 168, 76, 0.15)', color: 'var(--gold)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                {msg.subject || 'General'}
                              </span>
                            </td>
                            <td style={{ maxWidth: '250px', fontSize: '0.85rem', color: 'var(--beige)', lineHeight: 1.4 }}>
                              {msg.message}
                            </td>
                            <td>
                              <button
                                onClick={() => handleDeleteContactMessage(msg.id)}
                                style={{ color: 'var(--rose-gold)', background: 'none', border: 'none', cursor: 'pointer' }}
                                title="Delete message"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Customer Support Info Editor Panel */}
              <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--gold)', background: 'rgba(26,13,0,0.4)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '10px' }}>
                  Update Customer Support Info
                </h3>
                <p style={{ color: 'var(--beige)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  Post and update the contact phone, WhatsApp, email, and support hours displayed on the Contact Page.
                </p>

                <form onSubmit={handleUpdateSupportContact}>
                  <Input
                    label="Customer Support Phone"
                    required
                    value={supportContactData.phone}
                    onChange={(e) => setSupportContactData({ ...supportContactData, phone: e.target.value })}
                  />

                  <Input
                    label="WhatsApp Support Number"
                    required
                    value={supportContactData.whatsapp}
                    onChange={(e) => setSupportContactData({ ...supportContactData, whatsapp: e.target.value })}
                  />

                  <Input
                    label="Customer Support Email"
                    type="email"
                    required
                    value={supportContactData.email}
                    onChange={(e) => setSupportContactData({ ...supportContactData, email: e.target.value })}
                  />

                  <Input
                    label="Support Hours"
                    placeholder="Mon - Sat: 10:00 AM - 8:00 PM"
                    required
                    value={supportContactData.support_hours}
                    onChange={(e) => setSupportContactData({ ...supportContactData, support_hours: e.target.value })}
                  />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--beige)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Atelier Address
                    </label>
                    <textarea
                      rows={2}
                      value={supportContactData.address}
                      onChange={(e) => setSupportContactData({ ...supportContactData, address: e.target.value })}
                      style={{
                        padding: '10px',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--cream)',
                        borderRadius: '4px',
                        outline: 'none',
                        resize: 'none',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>

                  <Button variant="gold" fullWidth type="submit" disabled={updatingContact} glow>
                    {updatingContact ? 'Saving Details...' : 'Update Customer Support Details'}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}
        {/* EDIT PRODUCT MODAL */}
        {editingProduct && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div className="glass-panel" style={{ padding: '30px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ color: 'var(--cream)', marginBottom: '20px' }}>Edit Product</h3>
              <form onSubmit={handleEditProductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <Input label="Name" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                <Input label="Price (₹)" type="number" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} />
                <Input label="Stock Quantity" type="number" value={editingProduct.stock} onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})} />
                <Select
                  label="Category"
                  options={dynamicCategoryOptions}
                  value={editingProduct.category}
                  onChange={e => setEditingProduct({...editingProduct, category: e.target.value as any})}
                />
                
                <Select
                  label="Badge / Section Tag"
                  value={editingProduct.badge || ''}
                  onChange={e => setEditingProduct({...editingProduct, badge: e.target.value})}
                  options={[
                    { label: 'None (Standard Product)', value: '' },
                    { label: 'New (Shows in New Arrivals section)', value: 'New' },
                    { label: 'Bestseller (Shows in Bestsellers section)', value: 'Bestseller' },
                    { label: 'Premium (Shows in Popular / Premium section)', value: 'Premium' },
                    { label: 'Gift Hamper (Shows in Gift Hampers section)', value: 'Gift Hamper' },
                    { label: 'Signature (Shows in Signature Collection)', value: 'Signature' },
                    { label: 'Limited Edition', value: 'Limited Edition' },
                  ]}
                />
                <Input label="Ingredients" placeholder="e.g. Cocoa Mass, Sugar..." value={editingProduct.ingredients || ''} onChange={e => setEditingProduct({...editingProduct, ingredients: e.target.value})} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--beige)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Product Description
                  </label>
                  <textarea
                    rows={3}
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    style={{
                      padding: '10px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--cream)',
                      borderRadius: '4px',
                      outline: 'none',
                      resize: 'vertical',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--cream)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Product Images (Optional)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                    {editingProductImagePreviews.length > 0 ? (
                      editingProductImagePreviews.map((preview, idx) => (
                        <img key={idx} src={preview} alt={`Preview ${idx + 1}`} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                      ))
                    ) : (
                      editingProduct.images?.length ? (
                        editingProduct.images.map((imgUrl, idx) => (
                          <img key={idx} src={imgUrl} alt={`Current ${idx + 1}`} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                        ))
                      ) : (
                        <img src={editingProduct.image} alt="Current" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                      )
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length) {
                          setEditingProductImageFiles(files);
                          setEditingProductImagePreviews(files.map(f => URL.createObjectURL(f)));
                        }
                      }}
                      style={{ fontSize: '0.8rem', color: 'var(--cream)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <Button variant="text" type="button" onClick={() => {
                    setEditingProduct(null);
                    setEditingProductImageFiles([]);
                    setEditingProductImagePreviews([]);
                  }}>Cancel</Button>
                  <Button variant="gold" type="submit" disabled={isUpdatingProduct}>
                    {isUpdatingProduct ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        Saving...
                      </span>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT BANNER MODAL */}
        {editingBanner && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div className="glass-panel" style={{ padding: '30px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ color: 'var(--cream)', marginBottom: '20px' }}>Edit Banner</h3>
              <form onSubmit={handleEditBannerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <Input label="Title" value={editingBanner.title} onChange={e => setEditingBanner({...editingBanner, title: e.target.value})} />
                <Input label="Subtitle" value={editingBanner.subtitle || ''} onChange={e => setEditingBanner({...editingBanner, subtitle: e.target.value})} />
                <Input label="Button Text" value={editingBanner.buttonText || ''} onChange={e => setEditingBanner({...editingBanner, buttonText: e.target.value})} />
                <Input label="Link URL" value={editingBanner.link || ''} onChange={e => setEditingBanner({...editingBanner, link: e.target.value})} />
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <Button variant="text" type="button" onClick={() => setEditingBanner(null)}>Cancel</Button>
                  <Button variant="gold" type="submit">Save Changes</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
