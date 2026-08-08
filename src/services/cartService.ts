/**
 * Cart Service — backend-persistent cart + coupon validation.
 *
 * FastAPI endpoints:
 *   GET    /cart              → CartResponse (persistent server-side cart)
 *   POST   /cart              → CartResponse (add item: { product_id, quantity })
 *   PATCH  /cart/{product_id} → CartResponse (update quantity: { quantity })
 *   DELETE /cart/{product_id} → CartResponse (remove item)
 *   DELETE /cart              → CartResponse (clear cart)
 *   POST   /coupons/validate  → CouponValidationResponse
 *
 * NOTE: The React context manages cart state locally for instant UI updates.
 * These functions are used to sync with the backend (e.g. after login or on
 * checkout). For full persistence, call syncCart() after login and placeOrder().
 */

import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/api';
import type { CouponValidationResponse } from '../types';

/** Shape of a single cart item returned from the backend */
export interface BackendCartItem {
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
    category: string;
    weight?: string;
  };
}

/** Shape of the full cart response from the backend */
export interface BackendCartResponse {
  items: BackendCartItem[];
  total: number;
}

export const cartService = {
  /**
   * Fetch the server-side persistent cart for the authenticated user.
   */
  getCart: (): Promise<BackendCartResponse> =>
    apiGet<BackendCartResponse>('/cart'),

  /**
   * Add a product to the backend cart.
   */
  addToCart: (productId: string, quantity = 1): Promise<BackendCartResponse> =>
    apiPost<BackendCartResponse>('/cart', { product_id: productId, quantity }),

  /**
   * Update quantity of an item already in the backend cart.
   */
  updateQuantity: (productId: string, quantity: number): Promise<BackendCartResponse> =>
    apiPatch<BackendCartResponse>(`/cart/${productId}`, { quantity }),

  /**
   * Remove a single item from the backend cart.
   */
  removeFromCart: (productId: string): Promise<BackendCartResponse> =>
    apiDelete<BackendCartResponse>(`/cart/${productId}`),

  /**
   * Clear all items from the backend cart.
   */
  clearCart: (): Promise<BackendCartResponse> =>
    apiDelete<BackendCartResponse>('/cart'),

  /**
   * Sync a guest cart to the backend cart.
   */
  syncCart: (items: { product_id: string; quantity: number }[]): Promise<BackendCartResponse> =>
    apiPost<BackendCartResponse>('/cart/sync', { items }),

  /**
   * Validate a promo/coupon code server-side.
   * Removes ALL hardcoded coupon logic from the frontend.
   *
   * Backend response includes:
   *   valid: boolean
   *   discount_percent: number   (e.g. 40 for 40% off)
   *   discount_amount?: number   (flat discount, if applicable)
   *   message: string            (user-facing message)
   */
  validateCoupon: (code: string): Promise<CouponValidationResponse> =>
    apiPost<CouponValidationResponse>('/coupons/validate', { code }),

  getAvailableCoupons: (): Promise<any[]> =>
    apiGet<any[]>('/coupons/available'),
};
