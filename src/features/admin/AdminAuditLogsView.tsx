import React, { useState, useEffect } from 'react';
import { Search, Calendar, Download, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { adminService, SuperadminAuditLogRecord, SuperadminAuditLogListResponse } from '../../services/adminService';
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
    'MAINTENANCE_MODE_ENABLED': 'Maintenance Mode Enabled',
    'MAINTENANCE_MODE_DISABLED': 'Maintenance Mode Disabled',
    'UPDATE_ADMIN_PROFILE': 'Admin Profile Updated',
    'UPDATED_PROFILE': 'Admin Profile Updated',
    'CHANGE_ADMIN_PASSWORD': 'Admin Password Changed',
    'CHANGED_PASSWORD': 'Admin Password Changed',
    'OFFLINE SALE RECORDED': 'Offline Sale Recorded',
  };
  if (MAPPING[act]) return MAPPING[act];
  return act.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

export const AdminAuditLogsView: React.FC = () => {
  const [logsData, setLogsData] = useState<SuperadminAuditLogListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;
  const [selectedLog, setSelectedLog] = useState<SuperadminAuditLogRecord | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getSuperadminAuditLogs({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        action: actionFilter !== 'ALL' ? actionFilter : undefined,
        module: moduleFilter !== 'ALL' ? moduleFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search || undefined,
        page,
        limit,
      });
      if (res) setLogsData(res);
    } catch (err: any) {
      setError(err?.detail || err?.message || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [dateFrom, dateTo, actionFilter, moduleFilter, statusFilter, search, page]);

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setActionFilter('ALL');
    setModuleFilter('ALL');
    setStatusFilter('ALL');
    setSearch('');
    setPage(1);
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      await adminService.exportSuperadminAuditLogsCsv({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        action: actionFilter !== 'ALL' ? actionFilter : undefined,
        module: moduleFilter !== 'ALL' ? moduleFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        search: search || undefined,
      });
    } catch (err) {
      console.error('Failed to export audit logs CSV:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: '#c9a84c', margin: 0, fontWeight: 700 }}>
            Audit Logs
          </h1>
          <p style={{ color: 'var(--beige)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Track system activities, admin actions, and security audit history.
          </p>
        </div>
        <Button variant="secondary" onClick={handleExportCsv} disabled={exporting}>
          <Download size={16} /> {exporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </div>

      <div className="glass-panel" style={{ padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(201, 168, 76, 0.25)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#14100d', border: '1px solid rgba(201, 168, 76, 0.4)', borderRadius: '6px', padding: '6px 12px', minWidth: '220px' }}>
            <Search size={16} color="#c9a84c" />
            <input
              type="text"
              placeholder="Search user, action, details..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ background: 'transparent', border: 'none', color: '#f5efe6', fontSize: '0.82rem', width: '100%', outline: 'none' }}
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            style={{ background: '#14100d', color: '#f5efe6', border: '1px solid rgba(201, 168, 76, 0.4)', borderRadius: '6px', padding: '6px 12px', fontSize: '0.82rem', outline: 'none', cursor: 'pointer' }}
          >
            <option value="ALL">All Actions</option>
            <option value="Login">Login</option>
            <option value="Logout">Logout</option>
            <option value="Created Product">Created Product</option>
            <option value="Updated Product">Updated Product</option>
            <option value="Deleted Product">Deleted Product</option>
            <option value="Updated Order Status">Updated Order Status</option>
            <option value="Created Coupon">Created Coupon</option>
            <option value="Offline Sale Recorded">Offline Sale Recorded</option>
          </select>

          <select
            value={moduleFilter}
            onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
            style={{ background: '#14100d', color: '#f5efe6', border: '1px solid rgba(201, 168, 76, 0.4)', borderRadius: '6px', padding: '6px 12px', fontSize: '0.82rem', outline: 'none', cursor: 'pointer' }}
          >
            <option value="ALL">All Modules</option>
            <option value="products">Products</option>
            <option value="orders">Orders</option>
            <option value="coupons">Coupons</option>
            <option value="customers">Customers</option>
            <option value="offline sales">Offline Sales</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ background: '#14100d', color: '#f5efe6', border: '1px solid rgba(201, 168, 76, 0.4)', borderRadius: '6px', padding: '6px 12px', fontSize: '0.82rem', outline: 'none', cursor: 'pointer' }}
          >
            <option value="ALL">All Status</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILURE">FAILURE</option>
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={15} color="#c9a84c" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              style={{ background: '#14100d', color: '#f5efe6', colorScheme: 'dark', border: '1px solid rgba(201, 168, 76, 0.4)', borderRadius: '6px', padding: '5px 8px', fontSize: '0.8rem', cursor: 'pointer' }}
            />
            <span style={{ color: 'var(--beige)', fontSize: '0.8rem' }}>to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              style={{ background: '#14100d', color: '#f5efe6', colorScheme: 'dark', border: '1px solid rgba(201, 168, 76, 0.4)', borderRadius: '6px', padding: '5px 8px', fontSize: '0.8rem', cursor: 'pointer' }}
            />
          </div>

          <Button variant="secondary" size="sm" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </div>
      </div>

      <AuditLogDetailModal
        logId={selectedLog?.id || null}
        initialLog={selectedLog}
        onClose={() => setSelectedLog(null)}
        role="admin"
      />

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.4)', color: 'var(--beige)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '14px 16px', fontWeight: 600 }}>DATE & TIME</th>
              <th style={{ padding: '14px 16px', fontWeight: 600 }}>USER</th>
              <th style={{ padding: '14px 16px', fontWeight: 600 }}>ROLE</th>
              <th style={{ padding: '14px 16px', fontWeight: 600 }}>ACTION</th>
              <th style={{ padding: '14px 16px', fontWeight: 600 }}>STATUS</th>
              <th style={{ padding: '14px 16px', fontWeight: 600, textAlign: 'right' }}>DETAILS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'var(--beige)' }}>
                  <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 8px' }} />
                  Loading audit logs...
                </td>
              </tr>
            ) : !logsData || logsData.items.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                  No audit log records found matching search filters.
                </td>
              </tr>
            ) : (
              logsData.items.map((log: SuperadminAuditLogRecord) => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 16px', color: '#f5efe6' }}>{log.created_at}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--cream)', fontWeight: 600 }}>
                    {log.user_name || 'System Process'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(201, 168, 76, 0.15)', color: '#c9a84c', textTransform: 'capitalize' }}>
                      {log.user_role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#f5efe6' }}>{formatActionLabel(log.action)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: log.status === 'SUCCESS' ? '#2ecc71' : '#e74c3c' }}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <Button variant="secondary" size="sm" onClick={() => setSelectedLog(log)}>
                      View Details
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
