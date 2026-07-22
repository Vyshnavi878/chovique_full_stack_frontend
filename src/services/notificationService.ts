/**
 * Notification Service — fetch, mark-read, and delete user notifications.
 * Falls back to demo localStorage store when backend is unreachable.
 *
 * FastAPI endpoints expected:
 *   GET    /users/me/notifications           → SupportNotification[]
 *   PATCH  /users/me/notifications/{id}/read → SupportNotification
 *   DELETE /users/me/notifications/{id}      → 204
 */

import { apiGet, apiPatch, apiDelete } from '../lib/api';
import { withDemoFallback } from '../lib/demoMode';
import { demoGetNotifications, demoDeleteNotification } from '../lib/demoStore';
import type { SupportNotification } from '../types';

export const notificationService = {
  /** Fetch all notifications for the authenticated user */
  getNotifications: (): Promise<SupportNotification[]> =>
    withDemoFallback(
      () => apiGet<SupportNotification[]>('/users/me/notifications'),
      () => demoGetNotifications()
    ),

  /** Mark a single notification as read */
  markAsRead: (id: string): Promise<SupportNotification> =>
    withDemoFallback(
      () => apiPatch<SupportNotification>(`/users/me/notifications/${id}/read`, {}),
      async () => {
        const notifs = await demoGetNotifications();
        const found = notifs.find((n) => n.id === id);
        if (!found) throw new Error('Notification not found');
        const updated = notifs.map((n) => (n.id === id ? { ...n, read: true } : n));
        localStorage.setItem('chovique_demo_notifications', JSON.stringify(updated));
        return { ...found, read: true };
      }
    ),

  /** Delete (dismiss) a notification */
  deleteNotification: (id: string): Promise<void> =>
    withDemoFallback(
      () => apiDelete<void>(`/users/me/notifications/${id}`),
      () => demoDeleteNotification(id)
    ),
};
