/**
 * Admin Service — user management, offline sales, CSV import, banners,
 * testimonials, reels, and site-wide order/ticket views.
 * All calls go directly to the FastAPI backend.
 */

import { BASE_URL, apiDelete, apiGet, apiPatch, apiPost, apiPostFormData, apiPut } from '../lib/api';
import type {
  Banner,
  Testimonial,
  InstagramReel,
  OfflineSale,
  Order,
  SupportTicket,
  SystemUser,
  ImportSalesResponse,
  ResolveTicketPayload,
  CustomerDetailsResponse,
  Review,
} from '../types';

/** Payload for /admin/offline-sales POST — matches backend OfflineSalePayload */
export interface AdminOfflineSalePayload {
  product_name: string;
  quantity: number;
  total_price: number;
  payment_method: string;
}

/** Payload for /admin/orders/{id}/status PATCH */
export interface UpdateOrderStatusPayload {
  status?: string;
  payment_status?: string;
}

export interface AdminNotification {
  id: string;
  admin_id?: string | null;
  type: string;
  title: string;
  message: string;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AdminNotificationListResponse {
  items: AdminNotification[];
  total: number;
  page: number;
  limit: number;
  unread_count: number;
}

export interface AdminProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  created_at: string;
  last_login_at?: string | null;
}

export interface UpdateAdminProfilePayload {
  full_name: string;
  email: string;
  phone: string;
  address: string;
}

export interface ActivityLogItem {
  id: string;
  admin_id?: string | null;
  admin_name?: string | null;
  admin_email?: string | null;
  action: string;
  module: string;
  description: string;
  ip_address?: string | null;
  user_agent?: string | null;
  status: string;
  created_at: string;
}

export interface ActivityLogListResponse {
  items: ActivityLogItem[];
  total: number;
  page: number;
  limit: number;
}

/** Dashboard stats shape from /admin/stats */
export interface DashboardStats {
  total_sales: number;
  total_orders: number;
  total_customers: number;
  total_products: number;
  low_stock_products_count: number;
  pending_tickets_count: number;
  total_units_sold: number;
  total_inventory_stock: number;
  total_online_revenue: number;
  total_offline_revenue: number;
  admin_count: number;
  reward_coins_issued?: number;
  monthly_revenue: { month: string; online_revenue: number; offline_revenue: number; total: number }[];
  top_products: { name: string; units_sold: number; stock: number; revenue: number }[];
}

export interface AuditLogEntry {
  id: string;
  action: string;
  user_name?: string;
  user_email?: string;
  resource?: string;
  details?: string;
  created_at: string;
}

export const adminService = {
  /** Fetch admin dashboard analytics stats with optional date range parameters. */
  getStats: (params?: { preset?: string; start_date?: string; end_date?: string }): Promise<DashboardStats> => {
    const query = new URLSearchParams();
    if (params?.preset) query.append('preset', params.preset);
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    const qs = query.toString();
    return apiGet<DashboardStats>(`/admin/stats${qs ? `?${qs}` : ''}`);
  },

  /** Specific dashboard endpoints using PostgreSQL aggregations */
  getDashboardSummary: (params?: { preset?: string; start_date?: string; end_date?: string }) => {
    const query = new URLSearchParams();
    if (params?.preset) query.append('preset', params.preset);
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    const qs = query.toString();
    return apiGet<any>(`/admin/dashboard/summary${qs ? `?${qs}` : ''}`);
  },

  getSalesChart: (params?: { preset?: string; start_date?: string; end_date?: string }) => {
    const query = new URLSearchParams();
    if (params?.preset) query.append('preset', params.preset);
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    const qs = query.toString();
    return apiGet<{ timeframe: string; points: { date: string; sales: number; orders_count: number }[] }>(`/admin/dashboard/sales-chart${qs ? `?${qs}` : ''}`);
  },

  getTopProducts: (limit: number = 5) => apiGet<any>(`/admin/dashboard/top-products?limit=${limit}`),
  getRecentOrders: (limit: number = 5) => apiGet<any>(`/admin/dashboard/recent-orders?limit=${limit}`),
  getLowStockProducts: (threshold: number = 10, limit: number = 10) => apiGet<any>(`/admin/dashboard/low-stock-products?threshold=${threshold}&limit=${limit}`),

  /** Fetch recent audit logs. */
  getAuditLogs: (limit: number = 50): Promise<AuditLogEntry[]> =>
    apiGet<AuditLogEntry[]>(`/admin/audit-logs?limit=${limit}`),

  /** Fetch all registered users. */
  getUsers: (): Promise<SystemUser[]> =>
    apiGet<SystemUser[]>('/admin/users'),

  /** Fetch paginated customers with optional search */
  getCustomers: (params?: { page?: number; limit?: number; search?: string }): Promise<{ customers: any[]; total: number }> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.search) query.append('search', params.search);
    const qs = query.toString();
    return apiGet<{ customers: any[]; total: number }>(`/admin/customers${qs ? `?${qs}` : ''}`);
  },

  /** Fetch customer details with real backend order calculation */
  getCustomerDetails: (userId: string): Promise<CustomerDetailsResponse> =>
    apiGet<CustomerDetailsResponse>(`/admin/customers/${userId}`),

  /** Generate business reports (sales, orders, products, customers, coupons, reward_coins) */
  getReport: (params: {
    report_type: string;
    start_date: string;
    end_date: string;
    page?: number;
    limit?: number;
  }): Promise<any> => {
    const query = new URLSearchParams();
    query.append('report_type', params.report_type);
    query.append('start_date', params.start_date);
    query.append('end_date', params.end_date);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    return apiGet<any>(`/admin/reports?${query.toString()}`);
  },

  /** Download report Excel file */
  downloadExcelReport: async (params: { report_type: string; start_date: string; end_date: string }): Promise<void> => {
    const url = `${BASE_URL}/admin/reports/${params.report_type}/export/excel?start_date=${params.start_date}&end_date=${params.end_date}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to download report Excel.');
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${params.report_type}_report_${params.start_date}_to_${params.end_date}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  },

  /** Download report PDF file */
  downloadPdfReport: async (params: { report_type: string; start_date: string; end_date: string }): Promise<void> => {
    const url = `${BASE_URL}/admin/reports/${params.report_type}/export/pdf?start_date=${params.start_date}&end_date=${params.end_date}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to download report PDF.');
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${params.report_type}_report_${params.start_date}_to_${params.end_date}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  },

  /** Download report CSV file */
  downloadCsvReport: async (params: { report_type: string; start_date: string; end_date: string }): Promise<void> => {
    const url = `${BASE_URL}/admin/reports/${params.report_type}/export/csv?start_date=${params.start_date}&end_date=${params.end_date}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to download report CSV.');
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${params.report_type}_report_${params.start_date}_to_${params.end_date}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  /** Get admin notifications */
  getAdminNotifications: (params?: { type?: string; is_read?: boolean; page?: number; limit?: number }): Promise<AdminNotificationListResponse> => {
    const q = new URLSearchParams();
    if (params?.type && params.type !== 'all') q.set('type', params.type);
    if (params?.is_read !== undefined) q.set('is_read', String(params.is_read));
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return apiGet<AdminNotificationListResponse>(`/admin/notifications?${q.toString()}`);
  },

  /** Get unread notification count */
  getAdminUnreadCount: (): Promise<{ unread_count: number }> =>
    apiGet<{ unread_count: number }>('/admin/notifications/unread-count'),

  /** Mark single notification as read */
  markNotificationAsRead: (id: string): Promise<AdminNotification> =>
    apiPatch<AdminNotification>(`/admin/notifications/${id}/read`, {}),

  /** Mark all notifications as read */
  markAllNotificationsAsRead: (): Promise<{ message: string; updated_count: number }> =>
    apiPost<{ message: string; updated_count: number }>('/admin/notifications/read-all', {}),

  /** Get current admin profile */
  getAdminProfile: (): Promise<AdminProfile> =>
    apiGet<AdminProfile>('/admin/profile'),

  /** Update current admin profile */
  updateAdminProfile: (payload: UpdateAdminProfilePayload): Promise<AdminProfile> =>
    apiPut<AdminProfile>('/admin/profile', payload),

  /** Change admin password */
  changeAdminPassword: (payload: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }): Promise<{ message: string }> =>
    apiPost<{ message: string }>('/admin/change-password', payload),

  /** Get immutable admin activity logs */
  getActivityLogs: (params?: {
    page?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
    module?: string;
    action?: string;
    status?: string;
    search?: string;
  }): Promise<ActivityLogListResponse> => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.start_date) q.set('start_date', params.start_date);
    if (params?.end_date) q.set('end_date', params.end_date);
    if (params?.module && params.module !== 'all') q.set('module', params.module);
    if (params?.action && params.action !== 'all') q.set('action', params.action);
    if (params?.status && params.status !== 'all') q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    return apiGet<ActivityLogListResponse>(`/admin/activity-logs?${q.toString()}`);
  },

  /** Secure admin logout */
  adminLogout: (): Promise<{ message: string }> =>
    apiPost<{ message: string }>('/admin/logout', {}),

  /** Update customer profile details */
  updateCustomer: (userId: string, payload: any): Promise<CustomerDetailsResponse> =>
    apiPatch<CustomerDetailsResponse>(`/admin/customers/${userId}`, payload),

  /** Delete a customer account */
  deleteCustomer: (userId: string): Promise<void> =>
    apiDelete<void>(`/admin/customers/${userId}`),

  /** Create a new administrator user (superadmin action). */
  createAdmin: (payload: {
    full_name: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<SystemUser> =>
    apiPost<SystemUser>('/admin/users', payload),

  /** Delete or revoke a user account (superadmin action). */
  deleteUser: (userId: string): Promise<void> =>
    apiDelete<void>(`/admin/users/${userId}`),

  /** Promote an admin to superadmin. */
  promoteAdmin: (userId: string): Promise<SystemUser> =>
    apiPost<SystemUser>(`/admin/users/${userId}/promote`, {}),

  /** Demote a superadmin to admin. */
  demoteAdmin: (userId: string): Promise<SystemUser> =>
    apiPost<SystemUser>(`/admin/users/${userId}/demote`, {}),

  /** Fetch all orders site-wide (supports optional status and payment_status query params). */
  getAllOrders: (params?: { status?: string; payment_status?: string }): Promise<Order[]> => {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.payment_status && params.payment_status !== 'ALL') query.append('payment_status', params.payment_status);
    const queryString = query.toString();
    return apiGet<Order[]>(`/admin/orders${queryString ? `?${queryString}` : ''}`);
  },

  /** Update an order's status. */
  updateOrderStatus: (orderId: string, payload: UpdateOrderStatusPayload): Promise<Order> =>
    apiPatch<Order>(`/admin/orders/${orderId}/status`, payload),

  /** Fetch all support tickets site-wide. */
  getAllTickets: (): Promise<SupportTicket[]> =>
    apiGet<SupportTicket[]>('/admin/tickets'),

  /** Theme Management */
  getThemes: (): Promise<any[]> =>
    apiGet<any[]>('/theme/'),
  
  saveTheme: (payload: { name: string; properties_json: string }): Promise<any> =>
    apiPost<any>('/theme/', payload),
    
  deleteTheme: (themeId: string): Promise<void> =>
    apiDelete<void>(`/theme/${themeId}`),
    
  setActiveTheme: (themeId: string): Promise<void> =>
    apiPut<void>(`/theme/${themeId}/active`, {}),

  /** Resolve a support ticket (admin action). */
  resolveTicket: (ticketId: string, payload: ResolveTicketPayload): Promise<SupportTicket> =>
    apiPost<SupportTicket>(`/admin/tickets/${ticketId}/resolve`, payload),

  /** Fetch all offline (POS) sales records. */
  getOfflineSales: (): Promise<OfflineSale[]> =>
    apiGet<OfflineSale[]>('/admin/offline-sales'),

  /** Manually log a single offline sale. */
  addOfflineSale: (payload: AdminOfflineSalePayload): Promise<OfflineSale> =>
    apiPost<OfflineSale>('/admin/offline-sales', payload),

  /**
   * Upload a CSV file for bulk offline sales import.
   * All parsing is done server-side.
   */
  importOfflineSales: (formData: FormData): Promise<ImportSalesResponse> =>
    apiPostFormData<ImportSalesResponse>('/admin/offline-sales/import', formData),

  /**
   * Create a new hero banner slide (multipart/form-data upload to Cloudinary).
   */
  createBanner: (formData: FormData): Promise<Banner> =>
    apiPostFormData<Banner>('/admin/banners', formData),

  /**
   * Create a new testimonial with avatar upload to Cloudinary.
   */
  createTestimonial: (formData: FormData): Promise<Testimonial> =>
    apiPostFormData<Testimonial>('/admin/testimonials', formData),

  /**
   * Create a new Instagram reel entry with video upload to Cloudinary.
   */
  createReel: (formData: FormData): Promise<InstagramReel> =>
    apiPostFormData<InstagramReel>('/admin/reels', formData),

  /**
   * Delete an Instagram reel entry.
   */
  deleteReel: (reelId: string): Promise<void> =>
    apiDelete<void>(`/admin/reels/${reelId}`),

  /**
   * Fetch all testimonials for admin moderation (supports status filter).
   */
  adminGetTestimonials: (status?: string): Promise<Testimonial[]> =>
    apiGet<Testimonial[]>(`/admin/testimonials${status ? `?status=${status}` : ''}`),

  /**
   * Approve, reject, or update status of a testimonial.
   */
  updateTestimonialStatus: (testimonialId: string, status: string): Promise<Testimonial> =>
    apiPatch<Testimonial>(`/admin/testimonials/${testimonialId}/status`, { status }),

  /**
   * Delete a customer testimonial.
   */
  deleteTestimonial: (testimonialId: string): Promise<void> =>
    apiDelete<void>(`/admin/testimonials/${testimonialId}`),

  /**
   * Get all product reviews site-wide (admin moderation).
   */
  adminGetReviews: (): Promise<Review[]> =>
    apiGet<Review[]>('/admin/reviews'),

  /**
   * Delete a product review and recalculate product rating.
   */
  adminDeleteReview: (reviewId: string): Promise<void> =>
    apiDelete<void>(`/admin/reviews/${reviewId}`),

  /**
   * Update homepage site stats (happy customers, flavors, etc.).
   */
  updateSiteStats: (payload: {
    happy_customers: number;
    unique_flavors: number;
    countries_shipped: number;
    five_star_reviews_percent: number;
  }): Promise<any> =>
    apiPatch<any>('/admin/config/stats', payload),

  /**
   * Upload a banner image for a hero slide (superadmin action).
   */
  uploadBannerImage: (
    bannerId: string,
    formData: FormData
  ): Promise<{ image_url: string }> =>
    apiPostFormData<{ image_url: string }>(`/admin/banners/${bannerId}/image`, formData),

  /**
   * Delete a hero banner slide (superadmin action).
   */
  deleteBanner: (bannerId: string): Promise<void> =>
    apiDelete<void>(`/admin/banners/${bannerId}`),

  /**
   * Update an administrator user's password (superadmin action).
   */
  updateAdminPassword: (
    userId: string,
    password: string
  ): Promise<{ message: string }> =>
    apiPatch<{ message: string }>(`/admin/users/${userId}/password`, { password }),

  /**
   * Update an administrator's profile details (name, email) — superadmin action.
   */
  updateAdmin: (
    userId: string,
    payload: { full_name?: string; email?: string }
  ): Promise<SystemUser> =>
    apiPatch<SystemUser>(`/admin/users/${userId}`, payload),

  /**
   * Fetch all contact form submissions (admin view).
   */
  getContactMessages: (): Promise<{ id: string; name: string; email: string; phone?: string; subject?: string; message: string; created_at: string }[]> =>
    apiGet<any[]>('/admin/contact-messages'),

  /**
   * Delete a contact form submission.
   */
  deleteContactMessage: (messageId: string): Promise<void> =>
    apiDelete<void>(`/admin/contact-messages/${messageId}`),

  /**
   * Upload video for Our Story crafting process.
   */
  uploadStoryVideo: (formData: FormData): Promise<{ video_url: string }> =>
    apiPostFormData<{ video_url: string }>('/admin/story-video', formData),

  /**
   * Get Our Story video URL.
   */
  getStoryVideo: (): Promise<{ video_url: string }> =>
    apiGet<{ video_url: string }>('/home/story-video'),

  /**
   * Delete / Reset Our Story video URL.
   */
  deleteStoryVideo: (): Promise<{ video_url: string }> =>
    apiDelete<{ video_url: string }>('/admin/story-video'),

  /**
   * Fetch site contact info (phone, whatsapp, email, support_hours, address).
   */
  getContactInfo: (): Promise<{ email: string; phone: string; whatsapp: string; support_hours: string; address: string }> =>
    apiGet<any>('/home/contact'),

  /**
   * Update site contact info (admin action).
   */
  updateContactInfo: (payload: {
    email?: string;
    phone?: string;
    whatsapp?: string;
    support_hours?: string;
    address?: string;
  }): Promise<any> =>
    apiPatch<any>('/admin/config/contact', payload),

  // ======================================================
  // Coupons
  // ======================================================

  getCoupons: (): Promise<any[]> => apiGet<any[]>('/admin/coupons'),
  
  createCoupon: (payload: {
    code: string;
    description: string;
    discount_percent?: number;
    discount_amount?: number;
    expires_at?: string;
    is_active?: boolean;
  }): Promise<any> => apiPost<any>('/admin/coupons', payload),
  
  updateCoupon: (code: string, payload: any): Promise<any> =>
    apiPatch<any>(`/admin/coupons/${code}`, payload),

  deleteCoupon: (code: string): Promise<void> =>
    apiDelete<void>(`/admin/coupons/${code}`),

  updateBanner: (id: string, payload: any): Promise<any> =>
    apiPatch<any>(`/admin/banners/${id}`, payload),

  // ======================================================
  // Theme & Platform Configs
  // ======================================================

  getTheme: (): Promise<any> => apiGet<any>('/admin/config/theme'),
  updateTheme: (payload: any): Promise<any> => apiPatch<any>('/admin/config/theme', payload),

  getPlatformConfig: (): Promise<any> => apiGet<any>('/admin/config/platform'),
  updatePlatformConfig: (payload: any): Promise<any> => apiPatch<any>('/admin/config/platform', payload),

  // ======================================================
  // Products
  // ======================================================

  updateProductStock: (productId: string, stock: number): Promise<any> =>
    apiPatch<any>(`/admin/products/${productId}/stock`, { stock }),

  // ======================================================
  // Super Admin Enterprise Overview
  // ======================================================

  getSuperadminOverview: (
    timeframe = '7days',
    startDate?: string,
    endDate?: string
  ): Promise<SuperadminOverviewResponse> => {
    const q = new URLSearchParams();
    if (timeframe) q.set('timeframe', timeframe);
    if (startDate) q.set('start_date', startDate);
    if (endDate) q.set('end_date', endDate);
    return apiGet<SuperadminOverviewResponse>(`/superadmin/overview?${q.toString()}`);
  },

  /** Super Admin Revenue Analytics */
  getRevenueAnalytics: (
    preset = 'month',
    dateFrom?: string,
    dateTo?: string
  ): Promise<SuperadminRevenueResponse> => {
    const q = new URLSearchParams();
    if (preset) q.set('preset', preset);
    if (dateFrom) q.set('date_from', dateFrom);
    if (dateTo) q.set('date_to', dateTo);
    return apiGet<SuperadminRevenueResponse>(`/superadmin/analytics/revenue?${q.toString()}`);
  },

  exportRevenueAnalyticsCsv: async (
    preset = 'month',
    dateFrom?: string,
    dateTo?: string
  ): Promise<void> => {
    const q = new URLSearchParams();
    if (preset) q.set('preset', preset);
    if (dateFrom) q.set('date_from', dateFrom);
    if (dateTo) q.set('date_to', dateTo);
    
    const url = `${BASE_URL}/superadmin/analytics/revenue/export?${q.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to download revenue analytics CSV.');
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `revenue_analytics_${preset}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  /** Super Admin Sales Analytics & Ledgers */
  getSalesAnalytics: (params?: {
    search?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }): Promise<ProductSalesPerformanceResponse> => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.date_from) q.set('date_from', params.date_from);
    if (params?.date_to) q.set('date_to', params.date_to);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return apiGet<ProductSalesPerformanceResponse>(`/superadmin/analytics/sales?${q.toString()}`);
  },

  getOnlineSalesLedger: (params?: {
    search?: string;
    status?: string;
    payment_method?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }): Promise<OnlineLedgerResponse> => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.status) q.set('status', params.status);
    if (params?.payment_method) q.set('payment_method', params.payment_method);
    if (params?.date_from) q.set('date_from', params.date_from);
    if (params?.date_to) q.set('date_to', params.date_to);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return apiGet<OnlineLedgerResponse>(`/superadmin/analytics/sales/online?${q.toString()}`);
  },

  getOfflineSalesLedger: (params?: {
    search?: string;
    payment_method?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }): Promise<OfflineLedgerResponse> => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.payment_method) q.set('payment_method', params.payment_method);
    if (params?.date_from) q.set('date_from', params.date_from);
    if (params?.date_to) q.set('date_to', params.date_to);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return apiGet<OfflineLedgerResponse>(`/superadmin/analytics/sales/offline?${q.toString()}`);
  },

  exportSalesAnalyticsCsv: async (
    tab: 'products' | 'online' | 'offline' = 'products',
    search?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<void> => {
    const q = new URLSearchParams();
    q.set('tab', tab);
    if (search) q.set('search', search);
    if (dateFrom) q.set('date_from', dateFrom);
    if (dateTo) q.set('date_to', dateTo);

    const url = `${BASE_URL}/superadmin/analytics/sales/export?${q.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to download sales analytics CSV.');
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `sales_analytics_${tab}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  /** Super Admin Admin Management */
  getSuperadminAdmins: (params?: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<AdminListResponse> => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.role) q.set('role', params.role);
    if (params?.status) q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return apiGet<AdminListResponse>(`/superadmin/admins?${q.toString()}`);
  },

  getSuperadminAdminById: (adminId: string): Promise<AdminUserRecord> =>
    apiGet<AdminUserRecord>(`/superadmin/admins/${adminId}`),

  createSuperadminAdmin: (payload: {
    full_name: string;
    email: string;
    phone?: string;
    role: string;
    password: string;
    confirm_password: string;
    status: string;
  }): Promise<AdminUserRecord> =>
    apiPost<AdminUserRecord>('/superadmin/admins', payload),

  updateSuperadminAdmin: (
    adminId: string,
    payload: {
      full_name?: string;
      email?: string;
      phone?: string;
      role?: string;
      status?: string;
    }
  ): Promise<AdminUserRecord> =>
    apiPut<AdminUserRecord>(`/superadmin/admins/${adminId}`, payload),

  updateSuperadminAdminStatus: (
    adminId: string,
    status: 'active' | 'inactive'
  ): Promise<AdminUserRecord> =>
    apiPatch<AdminUserRecord>(`/superadmin/admins/${adminId}/status`, { status }),

  updateSuperadminAdminPassword: (
    adminId: string,
    payload: {
      new_password: string;
      confirm_password: string;
    }
  ): Promise<AdminUserRecord> =>
    apiPatch<AdminUserRecord>(`/superadmin/admins/${adminId}/password`, payload),

  deleteSuperadminAdmin: (adminId: string): Promise<{ message: string }> =>
    apiDelete<{ message: string }>(`/superadmin/admins/${adminId}`),

  /** Super Admin Audit Logs */
  getSuperadminAuditLogs: (params?: {
    date_from?: string;
    date_to?: string;
    user_id?: string;
    action?: string;
    module?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<SuperadminAuditLogListResponse> => {
    const q = new URLSearchParams();
    if (params?.date_from) q.set('date_from', params.date_from);
    if (params?.date_to) q.set('date_to', params.date_to);
    if (params?.user_id) q.set('user_id', params.user_id);
    if (params?.action) q.set('action', params.action);
    if (params?.module) q.set('module', params.module);
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    return apiGet<SuperadminAuditLogListResponse>(`/superadmin/audit-logs?${q.toString()}`);
  },

  getSuperadminAuditLogById: (logId: string): Promise<SuperadminAuditLogRecord> =>
    apiGet<SuperadminAuditLogRecord>(`/superadmin/audit-logs/${logId}`),

  exportSuperadminAuditLogsCsv: async (params?: {
    date_from?: string;
    date_to?: string;
    user_id?: string;
    action?: string;
    module?: string;
    status?: string;
    search?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.date_from) q.set('date_from', params.date_from);
    if (params?.date_to) q.set('date_to', params.date_to);
    if (params?.user_id) q.set('user_id', params.user_id);
    if (params?.action) q.set('action', params.action);
    if (params?.module) q.set('module', params.module);
    if (params?.status) q.set('status', params.status);
    if (params?.search) q.set('search', params.search);

    const url = `${BASE_URL}/superadmin/audit-logs/export?${q.toString()}`;
    const response = await fetch(url, { method: 'GET', credentials: 'include' });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to download audit logs CSV.');
    }
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  /** Superadmin Theme Builder */
  getSuperadminThemes: (): Promise<SuperadminThemeListResponse> =>
    apiGet<SuperadminThemeListResponse>('/superadmin/themes'),

  getSuperadminThemeById: (themeId: string): Promise<SuperadminThemeRecord> =>
    apiGet<SuperadminThemeRecord>(`/superadmin/themes/${themeId}`),

  createSuperadminTheme: (payload: ThemeCreatePayload): Promise<SuperadminThemeRecord> =>
    apiPost<SuperadminThemeRecord>('/superadmin/themes', payload),

  updateSuperadminTheme: (themeId: string, payload: ThemeUpdatePayload): Promise<SuperadminThemeRecord> =>
    apiPut<SuperadminThemeRecord>(`/superadmin/themes/${themeId}`, payload),

  previewSuperadminTheme: (themeId: string): Promise<SuperadminThemeRecord> =>
    apiPost<SuperadminThemeRecord>(`/superadmin/themes/${themeId}/preview`, {}),

  applySuperadminTheme: (themeId: string): Promise<SuperadminThemeRecord> =>
    apiPost<SuperadminThemeRecord>(`/superadmin/themes/${themeId}/apply`, {}),

  resetSuperadminTheme: (): Promise<SuperadminThemeRecord> =>
    apiPost<SuperadminThemeRecord>('/superadmin/themes/reset', {}),

  deleteSuperadminTheme: (themeId: string): Promise<{ message: string }> =>
    apiDelete<{ message: string }>(`/superadmin/themes/${themeId}`),
};

export interface KPICardData {
  current_value: number;
  previous_value: number;
  percentage_change: number;
  comparison_label: string;
}

export interface KPICardWithComparison {
  current_value: number;
  previous_value: number;
  percentage_change: number;
  comparison_label: string;
}

export interface RevenueTrendDataPoint {
  date: string;
  online_revenue: number;
  offline_revenue: number;
  total_revenue: number;
}

export interface RevenueBySource {
  online_revenue: number;
  online_percentage: number;
  offline_revenue: number;
  offline_percentage: number;
}

export interface PaymentMethodRevenue {
  method: string;
  amount: number;
  percentage: number;
}

export interface RevenueSummaryRow {
  date: string;
  online_orders: number;
  online_revenue: number;
  offline_sales: number;
  offline_revenue: number;
  total_revenue: number;
  avg_order_value: number;
}

export interface SuperadminRevenueResponse {
  preset: string;
  date_from: string;
  date_to: string;
  display_range: string;
  total_income: KPICardWithComparison;
  online_revenue: KPICardWithComparison;
  offline_revenue: KPICardWithComparison;
  avg_order_value: KPICardWithComparison;
  revenue_trend: RevenueTrendDataPoint[];
  revenue_by_source: RevenueBySource;
  revenue_by_payment_method: PaymentMethodRevenue[];
  summary_rows: RevenueSummaryRow[];
}

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
}

export interface SalesSourceData {
  online_revenue: number;
  online_percentage: number;
  offline_revenue: number;
  offline_percentage: number;
}

export interface TopSellingProductOverview {
  id: string;
  name: string;
  image_url?: string | null;
  units_sold: number;
  revenue: number;
}

export interface RecentActivityItem {
  id: string;
  action: string;
  description: string;
  timestamp: string;
  user_name?: string | null;
}

export interface SuperadminOverviewResponse {
  total_revenue: KPICardData;
  total_orders: KPICardData;
  total_customers: KPICardData;
  active_admins: KPICardData;
  revenue_trend: RevenueTrendPoint[];
  sales_source: SalesSourceData;
  top_selling_products: TopSellingProductOverview[];
  recent_activities: RecentActivityItem[];
}

export interface SalesKPICard {
  total_units_sold: number;
  total_units_prev: number;
  units_pct_change: number;
  total_revenue: number;
  total_revenue_prev: number;
  revenue_pct_change: number;
  online_revenue: number;
  online_revenue_prev: number;
  online_pct_change: number;
  offline_revenue: number;
  offline_revenue_prev: number;
  offline_pct_change: number;
  top_selling_chocolate?: string | null;
  comparison_label: string;
}

export interface ProductSalesPerformanceItem {
  id: string;
  name: string;
  category_name: string;
  image_url?: string | null;
  price: number;
  online_units: number;
  offline_units: number;
  total_units: number;
  total_revenue: number;
  stock_available: number;
}

export interface ProductSalesPerformanceResponse {
  kpis: SalesKPICard;
  products: ProductSalesPerformanceItem[];
  total: number;
  page: number;
  limit: number;
}

export interface OnlineLedgerItem {
  id: string;
  order_id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  product_summary: string;
  quantity: number;
  payment_method: string;
  amount: number;
  order_status: string;
}

export interface OnlineLedgerResponse {
  items: OnlineLedgerItem[];
  total: number;
  page: number;
  limit: number;
}

export interface OfflineLedgerItem {
  id: string;
  receipt_id: string;
  created_at: string;
  product_name: string;
  quantity: number;
  payment_method: string;
  amount: number;
}

export interface OfflineLedgerResponse {
  items: OfflineLedgerItem[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminUserRecord {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role: string;
  is_active: boolean;
  status: string;
  created_at: string;
  last_login_at?: string | null;
}

export interface AdminListResponse {
  items: AdminUserRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface SuperadminAuditLogRecord {
  id: string;
  user_id?: string | null;
  user_name: string;
  user_email?: string | null;
  user_role: string;
  action: string;
  module: string;
  entity_type?: string | null;
  entity_id?: string | null;
  ip_address: string;
  user_agent?: string | null;
  request_method: string;
  endpoint: string;
  status: string;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export interface SuperadminAuditLogListResponse {
  items: SuperadminAuditLogRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface SuperadminThemeRecord {
  id: string;
  name: string;
  description?: string | null;
  primary_brand_color: string;
  background_color: string;
  luxury_gold_color: string;
  secondary_accent_color: string;
  text_color: string;
  surface_color: string;
  is_active: boolean;
  is_preset: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface SuperadminThemeListResponse {
  items: SuperadminThemeRecord[];
  active_theme_id?: string | null;
}

export interface ThemeCreatePayload {
  name: string;
  description?: string;
  primary_brand_color: string;
  background_color: string;
  luxury_gold_color: string;
  secondary_accent_color: string;
  text_color: string;
  surface_color: string;
}

export interface ThemeUpdatePayload {
  name?: string;
  description?: string;
  primary_brand_color: string;
  background_color: string;
  luxury_gold_color: string;
  secondary_accent_color: string;
  text_color: string;
  surface_color: string;
}


// ─── Platform Settings ───────────────────────────────────────────────────────

export interface PlatformSettingsRecord {
  id: string;

  // Store Config
  store_front_name: string;
  support_email: string;
  support_phone: string;
  store_address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  base_currency: string;
  timezone: string;
  business_status: string;

  // Payment & Shipping
  cod_enabled: boolean;
  gst_rate: number;
  platform_fee: number;
  standard_shipping_charge: number;
  free_shipping_min_order: number;
  maximum_cod_order_value: number;

  // Customer & Order
  customer_registration_enabled: boolean;
  guest_checkout_enabled: boolean;
  minimum_order_value: number;
  order_cancellation_enabled: boolean;
  cancellation_time_limit: number;
  return_refund_enabled: boolean;

  // System & Security
  maintenance_mode: boolean;
  admin_session_timeout: number;
  max_login_attempts: number;
  account_lockout_duration: number;
  require_admin_password_change: boolean;

  updated_at: string;
  updated_by?: string | null;
}

export type PlatformSettingsUpdatePayload = Omit<
  PlatformSettingsRecord,
  'id' | 'updated_at' | 'updated_by'
>;

export interface MaintenanceModeResponse {
  maintenance_mode: boolean;
  message: string;
}

// Extend adminService object
Object.assign(adminService, {
  getPlatformSettings: (): Promise<PlatformSettingsRecord> =>
    apiGet<PlatformSettingsRecord>('/superadmin/platform-settings'),

  updatePlatformSettings: (payload: PlatformSettingsUpdatePayload): Promise<PlatformSettingsRecord> =>
    apiPut<PlatformSettingsRecord>('/superadmin/platform-settings', payload),

  toggleMaintenanceMode: (enable: boolean): Promise<MaintenanceModeResponse> =>
    apiPost<MaintenanceModeResponse>('/superadmin/platform-settings/maintenance-mode', {
      enable,
      confirmed: true,
    }),

  resetPlatformSettings: (): Promise<PlatformSettingsRecord> =>
    apiPost<PlatformSettingsRecord>('/superadmin/platform-settings/reset', {}),
});


// ─── Superadmin Notifications ────────────────────────────────────────────────

export interface SuperadminNotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'SECURITY' | 'ADMIN_MANAGEMENT' | 'PLATFORM_SYSTEM' | 'BUSINESS';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  is_read: boolean;
  read_at?: string | null;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  related_user_id?: string | null;
  related_user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  created_at: string;
}

export interface SuperadminNotificationListResponse {
  items: SuperadminNotificationItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  unread_count: number;
}

export interface SuperadminNotificationQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  severity?: string;
  is_read?: boolean;
  date_from?: string;
  date_to?: string;
  search?: string;
}

Object.assign(adminService, {
  getSuperadminNotifications: (
    params?: SuperadminNotificationQueryParams
  ): Promise<SuperadminNotificationListResponse> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.category) query.append('category', params.category);
    if (params?.severity) query.append('severity', params.severity);
    if (params?.is_read !== undefined) query.append('is_read', params.is_read.toString());
    if (params?.date_from) query.append('date_from', params.date_from);
    if (params?.date_to) query.append('date_to', params.date_to);
    if (params?.search) query.append('search', params.search);

    const qStr = query.toString();
    return apiGet<SuperadminNotificationListResponse>(
      `/superadmin/notifications${qStr ? `?${qStr}` : ''}`
    );
  },

  getSuperadminUnreadCount: (): Promise<{ unread_count: number }> =>
    apiGet<{ unread_count: number }>('/superadmin/notifications/unread-count'),

  getSuperadminNotificationById: (
    id: string
  ): Promise<SuperadminNotificationItem> =>
    apiGet<SuperadminNotificationItem>(`/superadmin/notifications/${id}`),

  markSuperadminNotificationAsRead: (
    id: string
  ): Promise<SuperadminNotificationItem> =>
    apiPatch<SuperadminNotificationItem>(`/superadmin/notifications/${id}/read`, {}),

  markAllSuperadminNotificationsAsRead: (): Promise<{ unread_count: number }> =>
    apiPatch<{ unread_count: number }>('/superadmin/notifications/read-all', {}),

  deleteSuperadminNotification: (
    id: string
  ): Promise<{ message: string }> =>
    apiDelete<{ message: string }>(`/superadmin/notifications/${id}`),
});

