import React, { useState, useEffect } from 'react';
import {
  FileClock,
  Search,
  RefreshCw,
  Loader2,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { adminService, ActivityLogItem } from '../../services/adminService';
import { EmptyState } from '../../components/ui/EmptyState';
import { Pagination } from '../../components/ui/Pagination';
import { Button } from '../../components/ui/Button';
import { AuditLogDetailModal } from '../../components/AuditLogDetailModal';

const formatActionLabel = (action?: string | null): string => {
  if (!action) return 'Activity Event';
  const act = action.trim().toUpperCase();
  const MAPPING: Record<string, string> = {
    'LOGGED_IN': 'Logged In',
    'LOGIN': 'Logged In',
    'LOGGED_OUT': 'Logged Out',
    'LOGOUT': 'Logged Out',
    'LOGIN_FAILED': 'Login Failed',
    'CREATE_PRODUCT': 'Product Created',
    'CREATED PRODUCT': 'Product Created',
    'UPDATE_PRODUCT': 'Product Updated',
    'UPDATED PRODUCT': 'Product Updated',
    'DELETE_PRODUCT': 'Product Deleted',
    'DELETED PRODUCT': 'Product Deleted',
    'CREATE_COUPON': 'Coupon Created',
    'CREATED COUPON': 'Coupon Created',
    'UPDATE_COUPON': 'Coupon Updated',
    'UPDATED COUPON': 'Coupon Updated',
    'DELETE_COUPON': 'Coupon Deleted',
    'DELETED COUPON': 'Coupon Deleted',
    'CREATE_ADMIN': 'Admin Created',
    'UPDATE_ADMIN': 'Admin Updated',
    'DISABLE_ADMIN': 'Admin Disabled',
    'UPDATE_ORDER': 'Order Updated',
    'UPDATED ORDER STATUS': 'Order Status Updated',
    'PLACE_ORDER': 'Order Placed',
    'UPDATE_CUSTOMER': 'Customer Updated',
    'UPDATE_SETTINGS': 'Settings Updated',
    'PLATFORM_SETTINGS_UPDATED': 'Platform Settings Updated',
    'UPDATE_ADMIN_PROFILE': 'Profile Updated',
    'UPDATED_PROFILE': 'Profile Updated',
    'CHANGE_ADMIN_PASSWORD': 'Password Changed',
    'CHANGED_PASSWORD': 'Password Changed',
    'OFFLINE SALE RECORDED': 'Offline Sale Recorded',
  };
  if (MAPPING[act]) return MAPPING[act];
  return act.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

export const ActivityLogsView: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // Filters State
  const [search, setSearch] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchLogs = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await adminService.getActivityLogs({
        page,
        limit: 15,
        module: selectedModule,
        action: selectedAction,
        status: selectedStatus,
        search: search.trim(),
        start_date: startDate ? new Date(startDate).toISOString() : undefined,
        end_date: endDate ? new Date(endDate + 'T23:59:59').toISOString() : undefined,
      });

      setLogs(res.items);
      setTotal(res.total);
      setCurrentPage(page);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [selectedModule, selectedAction, selectedStatus, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1);
  };

  return (
    <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', paddingBottom: '48px', color: '#f5efe6' }}>
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <span style={{ color: 'rgba(201, 168, 76, 0.85)', fontSize: '0.78rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            — AUDIT &amp; SECURITY
          </span>
          <h1 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '2.4rem', color: '#f5efe6', fontWeight: 700, margin: 0 }}>
            Activity Logs
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
            Immutable audit record of all administrative operations and changes
          </p>
        </div>

        <button
          onClick={() => fetchLogs(currentPage)}
          disabled={isLoading}
          style={{
            padding: '10px 18px',
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
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /> Refresh Logs
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div
        style={{
          background: 'rgba(20, 16, 13, 0.85)',
          border: '1px solid rgba(201, 168, 76, 0.2)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Top Row: Search & Filters */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ flex: '1 1 300px', display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user, action, details..."
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  background: 'rgba(10, 8, 6, 0.8)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  color: '#f5efe6',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <Search size={16} color="rgba(201, 168, 76, 0.7)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
            <button
              type="submit"
              style={{
                padding: '10px 16px',
                background: 'rgba(201, 168, 76, 0.15)',
                border: '1px solid rgba(201, 168, 76, 0.3)',
                borderRadius: '8px',
                color: '#c9a84c',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Search
            </button>
          </form>

          {/* Action Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Action:</span>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'rgba(10, 8, 6, 0.8)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '6px',
                color: '#f5efe6',
                fontSize: '0.82rem',
                outline: 'none',
              }}
            >
              <option value="all">All Actions</option>
              <option value="LOGGED_IN">Logged In</option>
              <option value="LOGGED_OUT">Logged Out</option>
              <option value="CREATE_ADMIN">Admin Created</option>
              <option value="UPDATED_PROFILE">Profile Updated</option>
              <option value="CHANGED_PASSWORD">Password Changed</option>
              <option value="CREATE_PRODUCT">Product Created</option>
              <option value="UPDATE_PRODUCT">Product Updated</option>
              <option value="DELETE_PRODUCT">Product Deleted</option>
              <option value="CREATE_COUPON">Coupon Created</option>
              <option value="UPDATE_COUPON">Coupon Updated</option>
              <option value="DELETE_COUPON">Coupon Deleted</option>
              <option value="UPDATE_ORDER">Order Status Updated</option>
              <option value="PLATFORM_SETTINGS_UPDATED">Platform Settings Updated</option>
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'rgba(10, 8, 6, 0.8)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '6px',
                color: '#f5efe6',
                fontSize: '0.82rem',
                outline: 'none',
              }}
            >
              <option value="all">All Status</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        {/* Date Filter Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={15} color="#c9a84c" />
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Start Date:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                padding: '6px 10px',
                background: 'rgba(10, 8, 6, 0.8)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '6px',
                color: '#f5efe6',
                fontSize: '0.8rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>End Date:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                padding: '6px 10px',
                background: 'rgba(10, 8, 6, 0.8)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '6px',
                color: '#f5efe6',
                fontSize: '0.8rem',
              }}
            />
          </div>

          {(startDate || endDate || search) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSearch('');
                setSelectedModule('all');
                setSelectedAction('all');
                setSelectedStatus('all');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#c9a84c',
                fontSize: '0.78rem',
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline',
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Production Audit Action Details Modal */}
      <AuditLogDetailModal
        logId={selectedLog?.id || null}
        initialLog={selectedLog ? {
          id: selectedLog.id,
          created_at: selectedLog.created_at,
          user_name: selectedLog.admin_name || 'Admin User',
          user_email: selectedLog.admin_email || '',
          user_role: selectedLog.user_role || 'Admin',
          action: selectedLog.action,
          status: selectedLog.status,
          description: selectedLog.description,
          details: selectedLog.description,
        } : null}
        onClose={() => setSelectedLog(null)}
        role="admin"
      />

      {/* Main Read-Only Logs Table */}
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
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>Loading activity logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '60px 20px' }}>
            <EmptyState
              title="No Activity Logs Found"
              description="No audit activity logs match your filter criteria."
              icon={<FileClock size={48} color="#c9a84c" />}
            />
          </div>
        ) : (
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(10, 8, 6, 0.9)', borderBottom: '1px solid rgba(201, 168, 76, 0.2)', color: '#c9a84c' }}>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>DATE &amp; TIME</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>USER</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>ROLE</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>ACTION</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>STATUS</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700, textAlign: 'right' }}>DETAILS</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      transition: 'background 0.2s ease',
                    }}
                  >
                    {/* Timestamp */}
                    <td style={{ padding: '16px 20px', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem' }}>
                      {log.created_at}
                    </td>

                    {/* Admin User */}
                    <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 700, color: '#f5efe6' }}>
                        {log.admin_name || 'System Admin'}
                      </div>
                      {log.admin_email && (
                        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
                          {log.admin_email}
                        </div>
                      )}
                    </td>

                    {/* Role */}
                    <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(201, 168, 76, 0.15)', color: '#c9a84c', textTransform: 'capitalize' }}>
                        {log.user_role || log.role || 'Admin'}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ padding: '16px 20px', whiteSpace: 'nowrap', fontWeight: 600, color: '#f5efe6' }}>
                      {formatActionLabel(log.action)}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: log.status === 'SUCCESS' ? '#2ecc71' : '#e74c3c' }}>
                        {log.status}
                      </span>
                    </td>

                    {/* Details View Button */}
                    <td style={{ padding: '16px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <Button variant="secondary" size="sm" onClick={() => setSelectedLog(log)}>
                        View Details
                      </Button>
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
            onPageChange={(page) => fetchLogs(page)}
          />
        </div>
      )}
    </div>
  );
};

export default ActivityLogsView;
