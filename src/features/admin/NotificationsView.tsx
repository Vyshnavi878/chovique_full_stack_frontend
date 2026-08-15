import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  ShoppingBag,
  AlertTriangle,
  Users,
  Tag,
  MessageSquare,
  Coins,
  AlertCircle,
  ExternalLink,
  Loader2,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { adminService, AdminNotification } from '../../services/adminService';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';

interface NotificationsViewProps {
  onNavigateTab: (tab: string, entityId?: string) => void;
}

type CategoryTab = 'all' | 'orders' | 'alerts' | 'customers' | 'system';

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onNavigateTab }) => {
  const [activeCategory, setActiveCategory] = useState<CategoryTab>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchNotifications = async (page = 1) => {
    setIsLoading(true);
    try {
      let isReadVal: boolean | undefined = undefined;
      if (readFilter === 'unread') isReadVal = false;
      if (readFilter === 'read') isReadVal = true;

      const res = await adminService.getAdminNotifications({
        type: activeCategory === 'all' ? undefined : activeCategory,
        is_read: isReadVal,
        page,
        limit: 15,
      });

      setNotifications(res.items);
      setTotal(res.total);
      setUnreadCount(res.unread_count);
      setCurrentPage(page);
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1);
  }, [activeCategory, readFilter]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await adminService.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      window.dispatchEvent(new CustomEvent('notification_updated'));
      setActionSuccess('Notification marked as read');
      setTimeout(() => setActionSuccess(null), 2500);
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await adminService.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('notification_updated'));
      setActionSuccess('All notifications marked as read');
      setTimeout(() => setActionSuccess(null), 2500);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleViewRecord = (notif: AdminNotification) => {
    if (!notif.is_read) {
      handleMarkAsRead(notif.id);
    }
    switch (notif.type) {
      case 'new_order':
      case 'payment_failure':
        onNavigateTab('orders', notif.related_entity_id || undefined);
        break;
      case 'low_stock':
        onNavigateTab('products', notif.related_entity_id || undefined);
        break;
      case 'new_customer':
        onNavigateTab('customers', notif.related_entity_id || undefined);
        break;
      case 'coupon_usage':
        onNavigateTab('coupons', notif.related_entity_id || undefined);
        break;
      case 'support_message':
        onNavigateTab('contact-messages', notif.related_entity_id || undefined);
        break;
      case 'reward_adjustment':
        onNavigateTab('reward-settings', notif.related_entity_id || undefined);
        break;
      default:
        break;
    }
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, { label: string; bg: string; color: string }> = {
      new_order: { label: 'New Order', bg: 'rgba(46, 204, 113, 0.15)', color: '#2ecc71' },
      payment_failure: { label: 'Payment Failed', bg: 'rgba(231, 76, 60, 0.15)', color: '#e74c3c' },
      low_stock: { label: 'Low Stock Alert', bg: 'rgba(241, 196, 15, 0.15)', color: '#f1c40f' },
      new_customer: { label: 'New Customer', bg: 'rgba(52, 152, 219, 0.15)', color: '#3498db' },
      coupon_usage: { label: 'Coupon Used', bg: 'rgba(155, 89, 182, 0.15)', color: '#9b59b6' },
      support_message: { label: 'Customer Support', bg: 'rgba(230, 126, 34, 0.15)', color: '#e67e22' },
      reward_adjustment: { label: 'Reward Adjustment', bg: 'rgba(201, 168, 76, 0.15)', color: '#c9a84c' },
    };

    const style = labels[type] || { label: type, bg: 'rgba(201, 168, 76, 0.12)', color: '#c9a84c' };
    return (
      <span
        style={{
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '0.75rem',
          fontWeight: 700,
          background: style.bg,
          color: style.color,
          border: `1px solid ${style.color}40`,
        }}
      >
        {style.label}
      </span>
    );
  };

  const categoryTabs: { id: CategoryTab; label: string }[] = [
    { id: 'all', label: 'All Notifications' },
    { id: 'orders', label: 'Orders' },
    { id: 'alerts', label: 'Alerts' },
    { id: 'customers', label: 'Customers' },
    { id: 'system', label: 'System' },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', paddingBottom: '48px', color: '#f5efe6' }}>
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <span style={{ color: 'rgba(201, 168, 76, 0.85)', fontSize: '0.78rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            — ADMIN CENTER
          </span>
          <h1 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '2.4rem', color: '#f5efe6', fontWeight: 700, margin: 0 }}>
            Notifications
          </h1>
        </div>

        {/* Global Action Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => fetchNotifications(currentPage)}
            disabled={isLoading}
            style={{
              padding: '10px 16px',
              background: 'rgba(20, 16, 13, 0.85)',
              border: '1px solid rgba(201, 168, 76, 0.3)',
              borderRadius: '8px',
              color: '#c9a84c',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              style={{
                padding: '10px 18px',
                background: 'linear-gradient(135deg, #c9a84c 0%, #e5c875 50%, #c9a84c 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#0f0c0a',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(201, 168, 76, 0.25)',
              }}
            >
              <CheckCheck size={16} /> Mark all as read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* Action Success Toast Banner */}
      {actionSuccess && (
        <div
          style={{
            marginBottom: '20px',
            padding: '12px 18px',
            background: 'rgba(46, 204, 113, 0.12)',
            border: '1px solid rgba(46, 204, 113, 0.3)',
            borderRadius: '8px',
            color: '#2ecc71',
            fontSize: '0.88rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Check size={16} /> {actionSuccess}
        </div>
      )}

      {/* Category Tabs & Filter Toolbar */}
      <div
        style={{
          background: 'rgba(20, 16, 13, 0.85)',
          border: '1px solid rgba(201, 168, 76, 0.2)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        {/* Categories */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {categoryTabs.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: isActive ? '1px solid #c9a84c' : '1px solid transparent',
                  background: isActive ? 'rgba(201, 168, 76, 0.15)' : 'transparent',
                  color: isActive ? '#f5efe6' : 'rgba(255,255,255,0.6)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Read / Unread Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={14} /> Status:
          </span>
          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value as any)}
            style={{
              padding: '6px 12px',
              background: 'rgba(10, 8, 6, 0.8)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px',
              color: '#f5efe6',
              fontSize: '0.82rem',
              outline: 'none',
            }}
          >
            <option value="all">All Status</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </select>
        </div>
      </div>

      {/* Main List / Table Container */}
      <div
        style={{
          background: 'rgba(20, 16, 13, 0.85)',
          border: '1px solid rgba(201, 168, 76, 0.2)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#c9a84c' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '60px 20px' }}>
            <EmptyState
              title="No Notifications Found"
              description="You have no notifications matching the selected filter."
              icon={<Bell size={48} color="#c9a84c" />}
            />
          </div>
        ) : (
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(10, 8, 6, 0.9)', borderBottom: '1px solid rgba(201, 168, 76, 0.2)', color: '#c9a84c' }}>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>NOTIFICATION</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>TYPE</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>DATE &amp; TIME</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>STATUS</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700, textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notif) => (
                  <tr
                    key={notif.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      background: notif.is_read ? 'transparent' : 'rgba(201, 168, 76, 0.04)',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    {/* Title & Message */}
                    <td style={{ padding: '16px 20px', maxWidth: '400px' }}>
                      <div style={{ fontWeight: notif.is_read ? 600 : 700, color: '#f5efe6', marginBottom: '4px' }}>
                        {notif.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>
                        {notif.message}
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                      {getTypeBadge(notif.type)}
                    </td>

                    {/* Date */}
                    <td style={{ padding: '16px 20px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                      {new Date(notif.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                      {notif.is_read ? (
                        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={14} color="rgba(255,255,255,0.3)" /> Read
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: '#c9a84c', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c9a84c' }} /> Unread
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '16px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        {!notif.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(201, 168, 76, 0.12)',
                              border: '1px solid rgba(201, 168, 76, 0.3)',
                              borderRadius: '6px',
                              color: '#c9a84c',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Mark as read
                          </button>
                        )}

                        <button
                          onClick={() => handleViewRecord(notif)}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '6px',
                            color: '#f5efe6',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          View Related <ExternalLink size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {total > 15 && (
        <div style={{ marginTop: '24px' }}>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(total / 15)}
            totalItems={total}
            itemsPerPage={15}
            onPageChange={(page) => fetchNotifications(page)}
          />
        </div>
      )}
    </div>
  );
};

export default NotificationsView;
