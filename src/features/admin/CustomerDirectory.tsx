import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  X,
  Loader2,
  User,
  Mail,
  Phone,
  Calendar,
  Award,
  ShoppingBag,
  AlertTriangle,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { SystemUser } from '../../types';
import { Pagination } from '../../components/ui/Pagination';

interface CustomerDirectoryProps {
  systemUsers?: SystemUser[];
  adminOrders?: any[];
  addToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
  onRefreshUsers?: () => void;
}

export const CustomerDirectory: React.FC<CustomerDirectoryProps> = ({
  adminOrders,
  addToast,
  onRefreshUsers,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersData, setCustomersData] = useState<any>(null);

  // Inspector & detail loading states
  const [customerDetails, setCustomerDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'coins' | 'tickets'>('profile');

  // Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'toggle_status' | 'delete';
    customer: any;
    title: string;
    message: string;
  } | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  // Fetch paginated customer directory & summary statistics from DB
  const fetchCustomersList = useCallback(async () => {
    setCustomersLoading(true);
    try {
      const res = await adminService.getCustomers({
        search: searchQuery.trim() || undefined,
        status: statusFilter,
        page,
        limit,
      });
      setCustomersData(res);

      if (res.items && res.items.length > 0) {
        if (!selectedCustomerId || !res.items.some((c: any) => c.id === selectedCustomerId)) {
          setSelectedCustomerId(res.items[0].id);
        }
      } else {
        setSelectedCustomerId(null);
        setCustomerDetails(null);
      }
    } catch (err: any) {
      console.error('Failed to fetch customers from database:', err);
      addToast('error', err?.detail || err?.message || 'Failed to load customers from database.', 'Error');
    } finally {
      setCustomersLoading(false);
    }
  }, [searchQuery, statusFilter, page, limit, selectedCustomerId, addToast]);

  useEffect(() => {
    fetchCustomersList();
  }, [fetchCustomersList]);

  // Fetch full details when selected customer changes
  useEffect(() => {
    if (!selectedCustomerId) return;
    setLoadingDetails(true);
    adminService
      .getCustomerDetails(selectedCustomerId)
      .then((details) => {
        setCustomerDetails(details);
      })
      .catch((err) => {
        console.error('Failed to load customer details:', err);
        setCustomerDetails(null);
      })
      .finally(() => {
        setLoadingDetails(false);
      });
  }, [selectedCustomerId]);

  const handleSelectCustomer = (cust: any) => {
    setSelectedCustomerId(cust.id);
  };

  // Initiate Toggle Active/Deactivate confirmation
  const initiateToggleStatus = (cust: any) => {
    const isCurrentlyActive = cust.is_active !== false;
    setConfirmDialog({
      type: 'toggle_status',
      customer: cust,
      title: isCurrentlyActive ? 'Deactivate Customer Account' : 'Activate Customer Account',
      message: isCurrentlyActive
        ? `Are you sure you want to deactivate ${cust.name}'s account? They will not be able to log in or place orders.`
        : `Are you sure you want to reactivate ${cust.name}'s account?`,
    });
  };



  // Execute confirmed action
  const executeConfirmAction = async () => {
    if (!confirmDialog) return;
    setIsConfirming(true);
    const { type, customer } = confirmDialog;

    try {
      if (type === 'toggle_status') {
        const newStatus = !(customer.is_active !== false);
        const updated = await adminService.updateCustomer(customer.id, { is_active: newStatus });
        setCustomerDetails(updated);
        addToast(
          'success',
          `Customer ${customer.name} is now ${newStatus ? 'Active' : 'Inactive'}.`,
          'Status Changed'
        );
      } else if (type === 'delete') {
        await adminService.deleteCustomer(customer.id);
        addToast('success', `Customer ${customer.name} deleted permanently.`, 'Customer Deleted');
        setSelectedCustomerId(null);
      }
      fetchCustomersList();
      if (onRefreshUsers) onRefreshUsers();
      setConfirmDialog(null);
    } catch (err: any) {
      addToast('error', err?.detail || err?.message || 'Action failed.', 'Error');
    } finally {
      setIsConfirming(false);
    }
  };

  // Summary Metrics strictly from SQL database aggregations
  const summary = customersData?.summary || {};
  const summaryMetrics = {
    totalCust: summary.total_customers ?? 0,
    activeCust: summary.active_accounts ?? 0,
    totalOrdersCount: summary.total_orders_placed ?? 0,
    totalRevenue: summary.lifetime_spend ?? 0,
  };

  const customersList = customersData?.items || [];
  const totalCount = customersData?.total || 0;
  const totalPages = customersData?.total_pages || 1;

  const selectedCust = customersList.find((c: any) => c.id === selectedCustomerId) || (customerDetails?.user ? {
    id: customerDetails.user.id,
    name: customerDetails.user.full_name,
    email: customerDetails.user.email,
    phone: customerDetails.user.phone,
    is_active: customerDetails.user.is_active,
    orders_count: customerDetails.total_orders,
    total_spent: customerDetails.total_spent,
    reward_coins: customerDetails.reward_coins,
  } : null);

  const customerOrdersList: any[] = (customerDetails?.recent_orders && customerDetails.recent_orders.length > 0)
    ? customerDetails.recent_orders
    : (adminOrders ? adminOrders.filter((o: any) => (o.user_id && o.user_id === selectedCust?.id) || (o.user && o.user.id === selectedCust?.id)) : []);

  const totalOrdersCount = customerDetails?.total_orders != null ? customerDetails.total_orders : (customerOrdersList.length > 0 ? customerOrdersList.length : (selectedCust?.orders_count ?? 0));
  const totalSpentAmount = customerDetails?.total_spent != null ? customerDetails.total_spent : (customerOrdersList.length > 0 ? customerOrdersList.filter((o: any) => o.status !== 'Cancelled').reduce((sum: number, o: any) => sum + (o.total || 0), 0) : (selectedCust?.total_spent ?? 0));
  const totalRewardCoins = customerDetails?.reward_coins != null ? customerDetails.reward_coins : (selectedCust?.reward_coins ?? 0);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchCustomersList();
      if (onRefreshUsers) {
        await onRefreshUsers();
      }
      if (selectedCustomerId) {
        setLoadingDetails(true);
        const details = await adminService.getCustomerDetails(selectedCustomerId);
        setCustomerDetails(details);
        setLoadingDetails(false);
      }
      addToast('info', 'Customer directory & profiles refreshed from database.', 'Refreshed');
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: '28px' }}>
        <span className="section-label">Access &amp; Customers</span>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', color: 'var(--cream)', margin: 0 }}>
            Customer Directory
          </h1>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '9px 16px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600,
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              border: '1px solid rgba(201,168,76,0.35)',
              background: 'rgba(201,168,76,0.08)', color: 'var(--gold)',
              opacity: isRefreshing ? 0.7 : 1,
            }}
          >
            <RefreshCw size={14} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Directory'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Customers', value: summaryMetrics.totalCust, color: '#c9a84c' },
          { label: 'Active Accounts', value: summaryMetrics.activeCust, color: '#2ecc71' },
          { label: 'Total Orders Placed', value: summaryMetrics.totalOrdersCount, color: '#3498db' },
          { label: 'Lifetime Customer Spend', value: `₹${summaryMetrics.totalRevenue.toLocaleString('en-IN')}`, color: '#c9a84c' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="glass-panel"
            style={{ padding: '16px 18px', border: `1px solid ${kpi.color}25`, borderRadius: '10px', borderTop: `2px solid ${kpi.color}` }}
          >
            <div style={{ fontSize: '0.68rem', color: 'var(--grey-light)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              {kpi.label}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: kpi.color, fontFamily: 'var(--font-display)' }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'flex-start' }}>
        <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--grey-light)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search by name, email or phone..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                style={{
                  width: '100%', paddingLeft: '36px', paddingRight: searchQuery ? '32px' : '12px',
                  paddingTop: '9px', paddingBottom: '9px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '6px', color: 'var(--cream)', fontSize: '0.85rem', outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setPage(1); }}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--grey-light)', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => { setStatusFilter(st); setPage(1); }}
                  style={{
                    padding: '5px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                    background: statusFilter === st ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.04)',
                    color: statusFilter === st ? 'var(--gold)' : 'var(--beige)',
                    border: statusFilter === st ? '1px solid rgba(201,168,76,0.5)' : '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {st === 'ALL' ? 'All Customers' : st === 'ACTIVE' ? 'Active' : 'Inactive'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--grey-light)', marginBottom: '12px' }}>
            Showing {totalCount > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, totalCount)} of {totalCount} customers
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '580px', overflowY: 'auto', paddingRight: '4px' }}>
            {customersLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--beige)' }}>
                <Loader2 size={30} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block' }} />
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Loading customer records...</p>
              </div>
            ) : customersList.length === 0 ? (
              <div style={{ padding: '50px 20px', textAlign: 'center' }}>
                <User size={36} color="var(--grey-light)" style={{ margin: '0 auto 12px', display: 'block' }} />
                <p style={{ color: 'var(--grey-light)', margin: 0, fontSize: '0.88rem' }}>
                  {totalCount === 0 && !searchQuery && statusFilter === 'ALL'
                    ? 'No Customers Found.'
                    : 'No customers match the current filter or search criteria.'}
                </p>
              </div>
            ) : (
              customersList.map((cust: any) => {
                const isSelected = cust.id === selectedCustomerId;
                const totalSpent = cust.total_spent || 0;
                const ordersCnt = cust.orders_count || 0;

                return (
                  <div
                    key={cust.id}
                    onClick={() => handleSelectCustomer(cust)}
                    style={{
                      padding: '14px 16px', borderRadius: '8px', cursor: 'pointer',
                      background: isSelected ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.02)',
                      border: isSelected ? '1px solid var(--gold)' : '1px solid rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '40px', height: '40px', borderRadius: '50%',
                          background: isSelected ? 'var(--gold)' : 'rgba(255,255,255,0.08)',
                          color: isSelected ? '#000' : 'var(--gold)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.85rem', fontFamily: 'var(--font-display)',
                        }}
                      >
                        {cust.name ? cust.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'CU'}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, color: 'var(--cream)', fontSize: '0.95rem', fontWeight: 600 }}>{cust.name}</h4>
                        <div style={{ fontSize: '0.78rem', color: 'var(--grey-light)' }}>{cust.email}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>
                        ₹{totalSpent.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--grey-light)', marginTop: '2px' }}>{ordersCnt} order{ordersCnt === 1 ? '' : 's'}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {totalPages > 1 && (
            <div style={{ marginTop: '16px' }}>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalCount}
                itemsPerPage={limit}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>

        <div>
          {loadingDetails ? (
            <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px', display: 'block', color: 'var(--gold)' }} />
              <p style={{ color: 'var(--beige)', margin: 0 }}>Loading customer profile...</p>
            </div>
          ) : selectedCust ? (
            <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, #c9a84c 0%, #8a7028 100%)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                    {selectedCust.name ? selectedCust.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'CU'}
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--cream)', margin: 0 }}>{selectedCust.name}</h2>
                    <div style={{ fontSize: '0.78rem', color: 'var(--grey-light)' }}>Customer since {customerDetails?.joined_date || 'Aug 2024'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => initiateToggleStatus(selectedCust)} style={{ padding: '7px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', background: selectedCust.is_active !== false ? 'rgba(231,76,60,0.1)' : 'rgba(46,204,113,0.1)', border: `1px solid ${selectedCust.is_active !== false ? '#e74c3c' : '#2ecc71'}40`, color: selectedCust.is_active !== false ? '#e74c3c' : '#2ecc71' }}>
                    {selectedCust.is_active !== false ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--grey-light)', textTransform: 'uppercase' }}>Total Orders</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--cream)', fontFamily: 'var(--font-display)' }}>{totalOrdersCount}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--grey-light)', textTransform: 'uppercase' }}>Total Spent</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>₹{totalSpentAmount.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--grey-light)', textTransform: 'uppercase' }}>Reward Coins</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f39c12', fontFamily: 'var(--font-display)' }}>{totalRewardCoins}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '18px', paddingBottom: '8px' }}>
                {[
                  { id: 'profile', label: 'Profile' },
                  { id: 'orders', label: `Orders (${customerOrdersList.length})` },
                  { id: 'coins', label: 'Reward Coins' },
                  { id: 'tickets', label: `Support (${customerDetails?.support_tickets?.length || 0})` },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    style={{ background: 'none', border: 'none', padding: '6px 12px', fontSize: '0.8rem', fontWeight: activeTab === t.id ? 700 : 500, color: activeTab === t.id ? 'var(--gold)' : 'var(--grey-light)', borderBottom: activeTab === t.id ? '2px solid var(--gold)' : '2px solid transparent', cursor: 'pointer' }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {activeTab === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Mail size={15} color="var(--gold)" /><div><div style={{ fontSize: '0.7rem', color: 'var(--grey-light)' }}>Email Address</div><div style={{ color: 'var(--cream)', fontWeight: 500 }}>{selectedCust.email}</div></div></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Phone size={15} color="var(--gold)" /><div><div style={{ fontSize: '0.7rem', color: 'var(--grey-light)' }}>Phone Number</div><div style={{ color: 'var(--cream)', fontWeight: 500 }}>{selectedCust.phone || 'Not provided'}</div></div></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Calendar size={15} color="var(--gold)" /><div><div style={{ fontSize: '0.7rem', color: 'var(--grey-light)' }}>Account Status</div><div style={{ color: selectedCust.is_active !== false ? '#2ecc71' : '#e74c3c', fontWeight: 600 }}>{selectedCust.is_active !== false ? 'Active Account' : 'Deactivated / Inactive'}</div></div></div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}>
                  {customerOrdersList.length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: 'var(--grey-light)', fontSize: '0.85rem' }}>No orders placed by this customer yet.</div>
                  ) : (
                    customerOrdersList.map((ord: any) => (
                      <div key={ord.id} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div><div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '0.8rem', fontFamily: 'monospace' }}>{ord.id}</div><div style={{ fontSize: '0.72rem', color: 'var(--grey-light)', marginTop: '2px' }}>{ord.created_at || ord.date}</div></div>
                        <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 700, color: 'var(--cream)', fontSize: '0.85rem' }}>₹{ord.total?.toLocaleString()}</div><span style={{ fontSize: '0.68rem', fontWeight: 700, color: ord.status === 'Cancelled' ? '#e74c3c' : '#2ecc71' }}>{ord.status}</span></div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'coins' && (
                <div style={{ padding: '16px', background: 'rgba(243,156,18,0.05)', border: '1px solid rgba(243,156,18,0.2)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}><Award size={18} color="#f39c12" /><span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f39c12' }}>Reward Wallet</span></div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--cream)', fontFamily: 'var(--font-display)' }}>{customerDetails?.reward_coins || 0} <span style={{ fontSize: '0.85rem', color: 'var(--beige)' }}>Coins</span></div>
                </div>
              )}

              {activeTab === 'tickets' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto' }}>
                  {customerDetails?.support_tickets?.length === 0 ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: 'var(--grey-light)', fontSize: '0.85rem' }}>No support tickets submitted by this customer.</div>
                  ) : (
                    customerDetails?.support_tickets?.map((t: any) => (
                      <div key={t.id} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--cream)' }}>{t.subject || 'Support Ticket'}</span><span style={{ fontSize: '0.68rem', fontWeight: 700, color: t.status === 'Resolved' ? '#2ecc71' : '#f39c12' }}>{t.status}</span></div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--grey-light)', margin: 0 }}>{t.message}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <User size={36} color="var(--grey-light)" style={{ margin: '0 auto 12px', display: 'block' }} />
              <p style={{ color: 'var(--grey-light)', margin: 0 }}>Select a customer from the left directory list to view profile details.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── CONFIRMATION MODAL FOR DESTRUCTIVE ACTIONS ─────────────── */}
      {confirmDialog && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9500,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', backdropFilter: 'blur(6px)',
          }}
        >
          <div
            style={{
              background: '#0e0a06',
              border: '1px solid rgba(231,76,60,0.4)',
              borderRadius: '12px',
              padding: '34px',
              maxWidth: '440px',
              width: '100%',
              textAlign: 'center',
            }}
          >
            <AlertTriangle size={42} color="#e74c3c" style={{ margin: '0 auto 16px', display: 'block' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: 'var(--cream)', marginBottom: '12px' }}>
              {confirmDialog.title}
            </h3>
            <p style={{ color: 'var(--beige)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '24px' }}>
              {confirmDialog.message}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmDialog(null)}
                style={{ padding: '9px 20px', borderRadius: '6px', fontSize: '0.83rem', cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--glass-border)', color: 'var(--cream)', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmAction}
                disabled={isConfirming}
                style={{ padding: '9px 20px', borderRadius: '6px', fontSize: '0.83rem', cursor: 'pointer', background: '#e74c3c', border: 'none', color: '#fff', fontWeight: 700 }}
              >
                {isConfirming ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerDirectory;
