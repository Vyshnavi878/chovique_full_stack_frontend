/**
 * User Service — profile management, avatar upload, and address book.
 * All calls go directly to the FastAPI backend. No demo fallbacks.
 *
 * FastAPI endpoints:
 *   PATCH  /users/me                        → User
 *   POST   /users/me/avatar                 → { avatar_url: string }  (multipart/form-data)
 *   GET    /users/me/addresses              → CustomerAddress[]
 *   POST   /users/me/addresses              → CustomerAddress
 *   DELETE /users/me/addresses/{id}         → 204
 *   PATCH  /users/me/addresses/{id}/default → CustomerAddress
 *   GET    /users/me/coupons               → UserCoupon[]
 */

import { apiGet, apiPatch, apiPost, apiPut, apiDelete, apiPostFormData } from '../lib/api';
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
   */
  updateProfile: (payload: ProfileUpdatePayload): Promise<User> =>
    apiPatch<User>('/users/me', payload),

  /**
   * Upload a new avatar image (multipart/form-data).
   */
  uploadAvatar: (formData: FormData): Promise<AvatarUploadResponse> =>
    apiPostFormData<AvatarUploadResponse>('/users/me/avatar', formData),

  /** Fetch all saved addresses for the authenticated user */
  getAddresses: (): Promise<CustomerAddress[]> =>
    apiGet<CustomerAddress[]>('/users/me/addresses'),

  /** Add a new address */
  addAddress: (payload: Omit<CustomerAddress, 'id'>): Promise<CustomerAddress> =>
    apiPost<CustomerAddress>('/users/me/addresses', payload),

  /** Update an existing address */
  updateAddress: (id: string, payload: Partial<Omit<CustomerAddress, 'id'>>): Promise<CustomerAddress> =>
    apiPut<CustomerAddress>(`/users/me/addresses/${id}`, payload),

  /** Remove an address by ID */
  deleteAddress: (id: string): Promise<void> =>
    apiDelete<void>(`/users/me/addresses/${id}`),

  /** Set an address as the default shipping address */
  setDefaultAddress: (id: string): Promise<CustomerAddress> =>
    apiPatch<CustomerAddress>(`/users/me/addresses/${id}/default`, {}),

  /**
   * Fetch coupons/promo codes available to the authenticated user.
   */
  getCoupons: (): Promise<UserCoupon[]> =>
    apiGet<UserCoupon[]>('/coupons/available'),

  /**
   * Fetch coupons used by the authenticated user.
   */
  getUsedCoupons: (): Promise<any[]> =>
    apiGet<any[]>('/coupons/used'),
};
