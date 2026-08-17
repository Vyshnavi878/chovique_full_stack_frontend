/**
 * Notification Service — fetch, mark-read, and delete user notifications.
 * All calls go directly to the FastAPI backend. No demo fallbacks.
 *
 * FastAPI endpoints:
 *   GET    /users/me/notifications           → SupportNotification[]
 *   PATCH  /users/me/notifications/{id}/read → SupportNotification
 *   DELETE /users/me/notifications/{id}      → 204
 */

import { apiGet, apiPatch, apiPost, apiDelete } from '../lib/api';
import type { SupportNotification } from '../types';

export const notificationService = {
  /** Fetch all notifications for the authenticated user */
  getNotifications: (): Promise<SupportNotification[]> =>
    apiGet<SupportNotification[]>('/users/me/notifications'),

  /** Get unread notification count for the authenticated user */
  getUnreadCount: (): Promise<{ unread_count: number }> =>
    apiGet<{ unread_count: number }>('/users/me/notifications/unread-count'),

  /** Mark a single notification as read */
  markAsRead: (id: string): Promise<SupportNotification> =>
    apiPatch<SupportNotification>(`/users/me/notifications/${id}/read`, {}),

  /** Mark all notifications as read */
  markAllAsRead: (): Promise<{ message: string; updated_count: number }> =>
    apiPost<{ message: string; updated_count: number }>('/users/me/notifications/read-all', {}),

  /** Delete (dismiss) a notification */
  deleteNotification: (id: string): Promise<void> =>
    apiDelete<void>(`/users/me/notifications/${id}`),
};
