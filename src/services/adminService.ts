/**
 * Admin Service — user management, offline sales, CSV import, banners,
 * and site-wide order/ticket views.
 * Falls back to demo localStorage store when backend is unreachable.
 *
 * FastAPI endpoints expected:
 *   GET  /admin/users                    → SystemUser[]
 *   GET  /admin/orders                   → Order[]
 *   GET  /admin/tickets                  → SupportTicket[]
 *   GET  /admin/offline-sales            → OfflineSale[]
 *   POST /admin/offline-sales            → OfflineSale
 *   POST /admin/offline-sales/import     → { imported: number, skipped: number, message: string }  (multipart/form-data CSV)
 *   POST /admin/tickets/{id}/resolve     → SupportTicket
 *   POST /admin/banners/{id}/image       → { image_url: string }  (multipart/form-data)
 */

import { apiGet, apiPost, apiPostFormData } from '../lib/api';
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
  OfflineSalePayload,
  ImportSalesResponse,
  ResolveTicketPayload,
} from '../types';

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

  /** Fetch all support tickets site-wide. Demo fallback: reads demo tickets store. */
  getAllTickets: (): Promise<SupportTicket[]> =>
    withDemoFallback(
      () => apiGet<SupportTicket[]>('/admin/tickets'),
      () => demoGetTickets()
    ),

  /** Fetch all offline (POS) sales records. */
  getOfflineSales: (): Promise<OfflineSale[]> =>
    withDemoFallback(
      () => apiGet<OfflineSale[]>('/admin/offline-sales'),
      () => demoGetOfflineSales()
    ),

  /** Manually log a single offline sale. */
  addOfflineSale: (payload: OfflineSalePayload): Promise<OfflineSale> =>
    withDemoFallback(
      () => apiPost<OfflineSale>('/admin/offline-sales', payload),
      () => demoAddOfflineSale(payload)
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
   * Resolve a support ticket (admin action).
   * Demo fallback: updates ticket status in localStorage.
   */
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
