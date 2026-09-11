import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Loader2,
  Filter,
  RefreshCw,
  Trash2,
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
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const [selectedNotifIds, setSelectedNotifIds] = useState<string[]>([]);
  const [isBatchDeleting, setIsBatchDeleting] = useState<boolean>(false);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedNotifIds(notifications.map((n) => n.id));
    } else {
      setSelectedNotifIds([]);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedNotifIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedNotifIds.length === 0) return;
    setIsBatchDeleting(true);
    try {
      await Promise.all(selectedNotifIds.map((id) => adminService.deleteNotification(id)));
      setNotifications((prev) => prev.filter((n) => !selectedNotifIds.includes(n.id)));
      setTotal((prev) => Math.max(0, prev - selectedNotifIds.length));
      window.dispatchEvent(new CustomEvent('notification_updated'));
      setActionSuccess(`Deleted ${selectedNotifIds.length} selected notification(s)`);
      setSelectedNotifIds([]);
      setTimeout(() => setActionSuccess(null), 2500);
    } catch (err) {
      console.error('Failed batch delete:', err);
      setNotifications((prev) => prev.filter((n) => !selectedNotifIds.includes(n.id)));
      setSelectedNotifIds([]);
    } finally {
      setIsBatchDeleting(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await adminService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      window.dispatchEvent(new CustomEvent('notification_updated'));
      setActionSuccess('Notification deleted');
      setTimeout(() => setActionSuccess(null), 2500);
    } catch (err) {
      console.error('Failed to delete notification:', err);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
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
      case 'support':
        onNavigateTab('complaints', notif.related_entity_id || undefined);
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
      support: { label: 'Support Ticket', bg: 'rgba(230, 126, 34, 0.15)', color: '#e67e22' },
      reward_adjustment: { label: 'Reward Adjustment', bg: 'rgba(201, 168, 76, 0.15)', color: '#c9a84c' },
    };

    const style = labels[type] || { label: type ? type.replace(/_/g, ' ').toUpperCase() : 'General', bg: 'rgba(201, 168, 76, 0.12)', color: '#c9a84c' };
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
              padding: '10px 18px',
              background: 'rgba(201, 168, 76, 0.1)',
              border: '1px solid rgba(201, 168, 76, 0.3)',
              borderRadius: '8px',
              color: '#c9a84c',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>

          {selectedNotifIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isBatchDeleting}
              style={{
                padding: '10px 18px',
                background: 'rgba(231, 76, 60, 0.15)',
                border: '1px solid #e74c3c',
                borderRadius: '8px',
                color: '#e74c3c',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              <Trash2 size={16} /> {isBatchDeleting ? 'Deleting...' : `Delete Selected (${selectedNotifIds.length})`}
            </button>
          )}

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
                transition: 'all 0.2s ease',
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
        {/* Categories Dropdown or Tabs */}
        {isMobile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select
              value={activeCategory}
              onChange={(e) => {
                setActiveCategory(e.target.value as any);
                setCurrentPage(1);
              }}
              style={{
                padding: '6px 12px',
                background: 'rgba(10, 8, 6, 0.8)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '6px',
                color: '#f5efe6',
                fontSize: '0.82rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {categoryTabs.map((tab) => (
                <option key={tab.id} value={tab.id} style={{ background: '#14100d', color: '#f5efe6' }}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categoryTabs.map((tab) => {
              const isActive = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveCategory(tab.id);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '8px 16px',
                    background: isActive ? 'rgba(201, 168, 76, 0.15)' : 'transparent',
                    border: `1px solid ${isActive ? '#c9a84c' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '8px',
                    color: isActive ? '#c9a84c' : '#f5efe6',
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Read / Unread Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', fontWeight: 600 }}>
              <Filter size={14} /> Status Filter
            </div>
          )}
          <select
            value={readFilter}
            onChange={(e) => {
              setReadFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            style={{
              padding: '6px 12px',
              background: 'rgba(10, 8, 6, 0.8)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px',
              color: '#f5efe6',
              fontSize: '0.82rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all" style={{ background: '#14100d', color: '#f5efe6' }}>All Status</option>
            <option value="unread" style={{ background: '#14100d', color: '#f5efe6' }}>Unread Only</option>
            <option value="read" style={{ background: '#14100d', color: '#f5efe6' }}>Read Only</option>
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
            <table className="notifications-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(10, 8, 6, 0.9)', borderBottom: '1px solid rgba(201, 168, 76, 0.2)', color: '#c9a84c' }}>
                  <th style={{ padding: '16px 14px', width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={notifications.length > 0 && selectedNotifIds.length === notifications.length}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer', accentColor: '#c9a84c', width: '15px', height: '15px' }}
                    />
                  </th>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>NOTIFICATION</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>TYPE</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>DATE &amp; TIME</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>STATUS</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700, textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notif) => {
                  const isUnread = notif.is_read === false;
                  const notifTitle = notif.title || (notif.type ? notif.type.replace(/_/g, ' ').toUpperCase() : 'Notification');
                  const notifMsg = notif.message || '';

                  let dateDisplay = '';
                  if (notif.created_at) {
                    const dt = new Date(notif.created_at);
                    if (!isNaN(dt.getTime())) {
                      dateDisplay = dt.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                    }
                  }

                  return (
                    <tr
                      key={notif.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        background: selectedNotifIds.includes(notif.id)
                          ? 'rgba(201, 168, 76, 0.1)'
                          : isUnread
                          ? 'rgba(201, 168, 76, 0.04)'
                          : 'transparent',
                        transition: 'background 0.2s ease',
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '16px 14px', width: '40px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedNotifIds.includes(notif.id)}
                          onChange={() => handleToggleSelectOne(notif.id)}
                          style={{ cursor: 'pointer', accentColor: '#c9a84c', width: '15px', height: '15px' }}
                        />
                      </td>

                      {/* Title & Message */}
                      <td style={{ padding: '16px 20px', maxWidth: '400px' }}>
                        <div style={{ fontWeight: isUnread ? 700 : 600, color: '#f5efe6', marginBottom: '4px' }}>
                          {notifTitle}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>
                          {notifMsg}
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                        {getTypeBadge(notif.type)}
                      </td>

                      {/* Date & Time */}
                      <td style={{ padding: '16px 20px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>
                        {dateDisplay}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                        {!isUnread ? (
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
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          {isUnread && (
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
                                transition: 'all 0.2s ease',
                              }}
                            >
                              Mark as read
                            </button>
                          )}

                          <button
                            onClick={() => handleViewRecord(notif)}
                            style={{
                              padding: '6px 12px',
                              background: 'transparent',
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: '6px',
                              color: '#f5efe6',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            View
                          </button>

                          <button
                            onClick={() => handleDeleteNotification(notif.id)}
                            title="Delete Notification"
                            style={{
                              padding: '6px',
                              background: 'transparent',
                              border: 'none',
                              color: 'rgba(255, 255, 255, 0.45)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#e74c3c')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.45)')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

