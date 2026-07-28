/**
 * Admin Service — user management, offline sales, CSV import, banners,
 * and site-wide order/ticket views.
 * All calls go directly to the FastAPI backend. No demo fallbacks.
 *
 * FastAPI endpoints (all require admin or superadmin role):
 *   GET   /admin/stats                    → DashboardStatsResponse
 *   GET   /admin/users                    → SystemUser[]
 *   GET   /admin/orders                   → Order[]
 *   PATCH /admin/orders/{id}/status       → Order
 *   GET   /admin/tickets                  → SupportTicket[]
 *   POST  /admin/tickets/{id}/resolve     → SupportTicket
 *   GET   /admin/offline-sales            → OfflineSale[]
 *   POST  /admin/offline-sales            → OfflineSale
 *   POST  /admin/offline-sales/import     → { imported, skipped, message } (multipart CSV)
 *   POST  /admin/banners/{id}/image       → { image_url: string } (multipart)
 */

import { apiDelete, apiGet, apiPatch, apiPost, apiPostFormData } from '../lib/api';
import type {
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
}

export const adminService = {
  /** Fetch admin dashboard analytics stats. */
  getStats: (): Promise<DashboardStats> =>
    apiGet<DashboardStats>('/admin/stats'),

  /** Fetch all registered users. */
  getUsers: (): Promise<SystemUser[]> =>
    apiGet<SystemUser[]>('/admin/users'),

  /** Create a new administrator user (superadmin action). */
  createAdmin: (payload: {
    full_name: string;
    email: string;
    password: string;
    scope?: string;
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
   * Upload a banner image for a hero slide (superadmin action).
   */
  uploadBannerImage: (
    bannerId: string,
    formData: FormData
  ): Promise<{ image_url: string }> =>
    apiPostFormData<{ image_url: string }>(`/admin/banners/${bannerId}/image`, formData),
};

