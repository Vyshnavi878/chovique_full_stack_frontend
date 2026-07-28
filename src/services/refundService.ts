/**
 * Refund Service — refund management (admin only).
 *
 * FastAPI endpoints (require admin or superadmin role):
 *   POST /refunds              → RefundResponse
 *   GET  /refunds/order/{id}   → RefundResponse[]
 */

import { apiGet, apiPost } from '../lib/api';

export interface InitiateRefundPayload {
  order_id: string;
  amount?: number;       // If omitted, full refund
  reason?: string;
}

export interface RefundResponse {
  id: string;
  order_id: string;
  amount: number;
  status: 'Pending' | 'Processed' | 'Failed';
  reason?: string;
  performed_by_admin_id?: string;
  created_at: string;
}

export const refundService = {
  /**
   * Initiate a full or partial refund for an order.
   */
  initiateRefund: (payload: InitiateRefundPayload): Promise<RefundResponse> =>
    apiPost<RefundResponse>('/refunds', payload),

  /**
   * Get refund history for a specific order.
   */
  getOrderRefunds: (orderId: string): Promise<RefundResponse[]> =>
    apiGet<RefundResponse[]>(`/refunds/order/${orderId}`),
};
