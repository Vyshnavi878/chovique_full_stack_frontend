/**
 * Notification Service — fetch, mark-read, and delete user notifications.
 * All calls go directly to the FastAPI backend. No demo fallbacks.
 *
 * FastAPI endpoints:
 *   GET    /users/me/notifications           → SupportNotification[]
 *   PATCH  /users/me/notifications/{id}/read → SupportNotification
 *   DELETE /users/me/notifications/{id}      → 204
 */

import { apiGet, apiPatch, apiDelete } from '../lib/api';
import type { SupportNotification } from '../types';

export const notificationService = {
  /** Fetch all notifications for the authenticated user */
  getNotifications: (): Promise<SupportNotification[]> =>
    apiGet<SupportNotification[]>('/users/me/notifications'),

  /** Mark a single notification as read */
  markAsRead: (id: string): Promise<SupportNotification> =>
    apiPatch<SupportNotification>(`/users/me/notifications/${id}/read`, {}),

  /** Delete (dismiss) a notification */
  deleteNotification: (id: string): Promise<void> =>
    apiDelete<void>(`/users/me/notifications/${id}`),
};
