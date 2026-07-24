/**
 * Admin Service — user management, offline sales, CSV import, banners,
 * and site-wide order/ticket views.
 * Falls back to demo localStorage store when backend is unreachable.
 *
 * FastAPI endpoints (all require admin or superadmin role):
 *   GET  /admin/stats                    → DashboardStatsResponse
 *   GET  /admin/users                    → SystemUser[]
 *   GET  /admin/orders                   → Order[]
 *   PATCH /admin/orders/{id}/status      → Order
 *   GET  /admin/tickets                  → SupportTicket[]
 *   POST /admin/tickets/{id}/resolve     → SupportTicket
 *   GET  /admin/offline-sales            → OfflineSale[]
 *   POST /admin/offline-sales            → OfflineSale
 *   POST /admin/offline-sales/import     → { imported, skipped, message } (multipart CSV)
 *   POST /admin/banners/{id}/image       → { image_url: string } (multipart)
 */

import { apiGet, apiPatch, apiPost, apiPostFormData } from '../lib/api';
import { withDemoFallback } from '../lib/demoMode';
import {
  demoGetOrders,
  demoGetTickets,
  demoGetOfflineSales,
  demoAddOfflineSale,
  demoImportOfflineSales,
} from '../lib/demoStore';
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

// Demo system users seeded in localStorage by demoAuth
const getDemoUsers = (): SystemUser[] => {
  try {
    const saved = localStorage.getItem('chovique_demo_users');
    if (!saved) return [];
    const users = JSON.parse(saved) as (SystemUser & { password: string })[];
    return users.map(({ password: _pw, ...u }) => u);
  } catch {
    return [];
  }
};

export const adminService = {
  /** Fetch admin dashboard analytics stats. */
  getStats: (): Promise<DashboardStats> =>
    apiGet<DashboardStats>('/admin/stats'),

  /** Fetch all registered users. Demo fallback: reads from demoAuth store. */
  getUsers: (): Promise<SystemUser[]> =>
    withDemoFallback(
      () => apiGet<SystemUser[]>('/admin/users'),
      async () => getDemoUsers()
    ),

  /** Fetch all orders site-wide. Demo fallback: reads demo orders store. */
  getAllOrders: (): Promise<Order[]> =>
    withDemoFallback(
      () => apiGet<Order[]>('/admin/orders'),
      () => demoGetOrders()
    ),

  /** Update an order's status. */
  updateOrderStatus: (orderId: string, payload: UpdateOrderStatusPayload): Promise<Order> =>
    apiPatch<Order>(`/admin/orders/${orderId}/status`, payload),

  /** Fetch all support tickets site-wide. Demo fallback: reads demo tickets store. */
  getAllTickets: (): Promise<SupportTicket[]> =>
    withDemoFallback(
      () => apiGet<SupportTicket[]>('/admin/tickets'),
      () => demoGetTickets()
    ),

  /** Resolve a support ticket (admin action). */
  resolveTicket: (ticketId: string, payload: ResolveTicketPayload): Promise<SupportTicket> =>
    withDemoFallback(
      () => apiPost<SupportTicket>(`/admin/tickets/${ticketId}/resolve`, payload),
      async () => {
        const tickets = await demoGetTickets();
        const updated = tickets.map((t) =>
          t.id === ticketId
            ? { ...t, status: 'Resolved' as const, adminNotes: payload.admin_notes ?? undefined }
            : t
        );
        localStorage.setItem('chovique_demo_tickets', JSON.stringify(updated));
        const found = updated.find((t) => t.id === ticketId);
        if (!found) throw new Error('Ticket not found');
        return found;
      }
    ),

  /** Fetch all offline (POS) sales records. */
  getOfflineSales: (): Promise<OfflineSale[]> =>
    withDemoFallback(
      () => apiGet<OfflineSale[]>('/admin/offline-sales'),
      () => demoGetOfflineSales()
    ),

  /** Manually log a single offline sale. */
  addOfflineSale: (payload: AdminOfflineSalePayload): Promise<OfflineSale> =>
    withDemoFallback(
      () => apiPost<OfflineSale>('/admin/offline-sales', payload),
      () => demoAddOfflineSale({
        product_name: payload.product_name,
        quantity: payload.quantity,
        total_price: payload.total_price,
        payment_method: payload.payment_method,
      })
    ),

  /**
   * Upload a CSV file for bulk offline sales import.
   * Demo fallback: returns success without actual parsing.
   */
  importOfflineSales: (formData: FormData): Promise<ImportSalesResponse> =>
    withDemoFallback(
      () => apiPostFormData<ImportSalesResponse>('/admin/offline-sales/import', formData),
      () => demoImportOfflineSales(formData)
    ),

  /**
   * Upload a banner image for a hero slide (superadmin action).
   * Demo fallback: converts file to base64 dataURL.
   */
  uploadBannerImage: (
    bannerId: string,
    formData: FormData
  ): Promise<{ image_url: string }> =>
    withDemoFallback(
      () => apiPostFormData<{ image_url: string }>(`/admin/banners/${bannerId}/image`, formData),
      async () => {
        const file = formData.get('image') as File | null;
        if (!file) return { image_url: '' };
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve({ image_url: e.target?.result as string });
          reader.readAsDataURL(file);
        });
      }
    ),
};
