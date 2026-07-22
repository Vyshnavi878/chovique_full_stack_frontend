/**
 * User Service — profile management, avatar upload, and address book.
 * Falls back to demo localStorage store when backend is unreachable.
 *
 * FastAPI endpoints expected:
 *   PATCH  /users/me                        → User
 *   POST   /users/me/avatar                 → { avatar_url: string }  (multipart/form-data)
 *   GET    /users/me/addresses              → CustomerAddress[]
 *   POST   /users/me/addresses              → CustomerAddress
 *   DELETE /users/me/addresses/{id}         → 204
 *   PATCH  /users/me/addresses/{id}/default → CustomerAddress
 *   GET    /users/me/coupons               → UserCoupon[]
 */

import { apiGet, apiPatch, apiPost, apiDelete, apiPostFormData } from '../lib/api';
import { withDemoFallback } from '../lib/demoMode';
import {
  demoGetAddresses,
  demoAddAddress,
  demoDeleteAddress,
  demoSetDefaultAddress,
} from '../lib/demoStore';
import type {
  User,
  CustomerAddress,
  UserCoupon,
  ProfileUpdatePayload,
  AvatarUploadResponse,
} from '../types';

export const userService = {
  /**
   * Update authenticated user's profile fields.
   * Demo fallback: updates the demo user in localStorage.
   */
  updateProfile: (payload: ProfileUpdatePayload): Promise<User> =>
    withDemoFallback(
      () => apiPatch<User>('/users/me', payload),
      async () => {
        // Demo mode: profile update is handled purely in context state
        // (providers.tsx updateUserProfile updates React state without calling this)
        throw new Error('Profile update not supported in demo mode.');
      }
    ),

  /**
   * Upload a new avatar image (multipart/form-data).
   * Demo fallback: convert file to base64 dataURL and store in localStorage.
   */
  uploadAvatar: (formData: FormData): Promise<AvatarUploadResponse> =>
    withDemoFallback(
      () => apiPostFormData<AvatarUploadResponse>('/users/me/avatar', formData),
      async () => {
        const file = formData.get('avatar') as File | null;
        if (!file) return { avatar_url: '' };
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const avatar_url = e.target?.result as string;
            localStorage.setItem('chovique_demo_avatar', avatar_url);
            resolve({ avatar_url });
          };
          reader.readAsDataURL(file);
        });
      }
    ),

  /** Fetch all saved addresses for the authenticated user */
  getAddresses: (): Promise<CustomerAddress[]> =>
    withDemoFallback(
      () => apiGet<CustomerAddress[]>('/users/me/addresses'),
      () => demoGetAddresses()
    ),

  /** Add a new address */
  addAddress: (payload: Omit<CustomerAddress, 'id'>): Promise<CustomerAddress> =>
    withDemoFallback(
      () => apiPost<CustomerAddress>('/users/me/addresses', payload),
      () => demoAddAddress(payload)
    ),

  /** Remove an address by ID */
  deleteAddress: (id: string): Promise<void> =>
    withDemoFallback(
      () => apiDelete<void>(`/users/me/addresses/${id}`),
      () => demoDeleteAddress(id)
    ),

  /** Set an address as the default shipping address */
  setDefaultAddress: (id: string): Promise<CustomerAddress> =>
    withDemoFallback(
      () => apiPatch<CustomerAddress>(`/users/me/addresses/${id}/default`, {}),
      () => demoSetDefaultAddress(id)
    ),

  /**
   * Fetch coupons/promo codes available to the authenticated user.
   * Demo fallback: returns a pre-seeded coupon list.
   */
  getCoupons: (): Promise<UserCoupon[]> =>
    withDemoFallback(
      () => apiGet<UserCoupon[]>('/users/me/coupons'),
      async () => [
        { code: 'CHOVIQUE10', desc: '10% off your order', exp: '2026-12-31', discountPercent: 10 },
        { code: 'NEWUSER50', desc: '₹50 flat off for new users', exp: '2026-12-31', discountPercent: 5 },
        { code: 'FESTIVE25', desc: '25% off festive collection', exp: '2026-12-31', discountPercent: 25 },
      ]
    ),
};
