/**
 * Inventory Service — stock management (admin only).
 *
 * FastAPI endpoints (require admin or superadmin role):
 *   POST /inventory/update         → Product (updated with new stock)
 *   GET  /inventory/low-stock      → Product[] (products below threshold)
 *   GET  /inventory/logs/{id}      → InventoryLog[]
 */

import { apiGet, apiPost } from '../lib/api';
import type { Product } from '../types';

export interface StockUpdatePayload {
  product_id: string;
  new_stock: number;
  reason?: string;
}

export interface InventoryLog {
  id: string;
  product_id: string;
  previous_stock: number;
  new_stock: number;
  change: number;
  reason?: string;
  performed_by_id?: string;
  created_at: string;
}

export const inventoryService = {
  /**
   * Update stock level for a product.
   */
  updateStock: (payload: StockUpdatePayload): Promise<Product> =>
    apiPost<Product>('/inventory/update', payload),

  /**
   * Get products with stock below the threshold (default: 10).
   */
  getLowStock: (threshold = 10): Promise<Product[]> =>
    apiGet<Product[]>(`/inventory/low-stock?threshold=${threshold}`),

  /**
   * Get inventory change history for a specific product.
   */
  getInventoryLogs: (productId: string): Promise<InventoryLog[]> =>
    apiGet<InventoryLog[]>(`/inventory/logs/${productId}`),
};
