/**
 * Admin Service — user management, offline sales, CSV import, banners,
 * testimonials, reels, and site-wide order/ticket views.
 * All calls go directly to the FastAPI backend.
 */

import { apiDelete, apiGet, apiPatch, apiPost, apiPostFormData } from '../lib/api';
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
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
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
  /** Fetch admin dashboard analytics stats. */
  getStats: (): Promise<DashboardStats> =>
    apiGet<DashboardStats>('/admin/stats'),

  /** Fetch recent audit logs. */
  getAuditLogs: (limit: number = 50): Promise<AuditLogEntry[]> =>
    apiGet<AuditLogEntry[]>(`/admin/audit-logs?limit=${limit}`),

  /** Fetch all registered users. */
  getUsers: (): Promise<SystemUser[]> =>
    apiGet<SystemUser[]>('/admin/users'),

  /** Create a new administrator user (superadmin action). */
  createAdmin: (payload: {
    full_name: string;
    email: string;
    password: string;
  }): Promise<SystemUser> =>
    apiPost<SystemUser>('/admin/users', payload),

  /** Delete or revoke a user account (superadmin action). */
  deleteUser: (userId: string): Promise<void> =>
    apiDelete<void>(`/admin/users/${userId}`),

  /** Fetch all orders site-wide. */
  getAllOrders: (): Promise<Order[]> =>
    apiGet<Order[]>('/admin/orders'),

  /** Update an order's status. */
  updateOrderStatus: (orderId: string, payload: UpdateOrderStatusPayload): Promise<Order> =>
    apiPatch<Order>(`/admin/orders/${orderId}/status`, payload),

  /** Fetch all support tickets site-wide. */
  getAllTickets: (): Promise<SupportTicket[]> =>
    apiGet<SupportTicket[]>('/admin/tickets'),

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
   * Delete a customer testimonial.
   */
  deleteTestimonial: (testimonialId: string): Promise<void> =>
    apiDelete<void>(`/admin/testimonials/${testimonialId}`),

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
};


