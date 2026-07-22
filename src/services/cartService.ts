/**
 * Cart Service — coupon/promo code validation.
 *
 * FastAPI endpoints expected:
 *   POST /coupons/validate → CouponValidationResponse
 *
 * Note: Cart items (add/remove/quantity) are managed locally in React context
 * for performance. Only coupon validation requires a server round-trip because
 * coupon logic (discount rules, expiry, usage limits) must live in the backend.
 */

import { apiPost } from '../lib/api';
import type { CouponValidationResponse } from '../types';

export const cartService = {
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
};
