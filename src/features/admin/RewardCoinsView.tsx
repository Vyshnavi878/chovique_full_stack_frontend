import React, { useState, useEffect } from 'react';
import {
  Check,
  AlertCircle,
  Edit2,
  ShieldCheck,
  Coins,
  Award,
  Percent,
  Clock,
  UserCheck,
  Search,
  Filter,
  RefreshCw,
  Gift,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  walletService,
  RewardSettings,
  AdminCustomerRewardStat,
  AdminCoinTransactionItem,
} from '../../services/walletService';
import { Button } from '../../components/ui/Button';

const DEFAULT_SETTINGS: RewardSettings = {
  reward_system_enabled: true,
  spend_per_coin: 10,
  coins_per_rupee: 10,
  max_redemption_percentage: 20,
  welcome_coins: 100,
  first_order_coins: 200,
  credit_delay_hours: 24,
};

export const RewardCoinsView: React.FC = () => {
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // Tab State: default is 'rules'
  const [activeTab, setActiveTab] = useState<'rules' | 'history'>('rules');

  // Settings State
  const [settings, setSettings] = useState<RewardSettings>(DEFAULT_SETTINGS);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);

  // Customer Reward Stats & Transactions State
  const [customerStats, setCustomerStats] = useState<AdminCustomerRewardStat[]>([]);
  const [transactions, setTransactions] = useState<AdminCoinTransactionItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('ALL');

  // Pagination States
  const [custPage, setCustPage] = useState(1);
  const custLimit = 10;
  const [txPage, setTxPage] = useState(1);
  const txLimit = 10;

  // Fetch Data
  useEffect(() => {
    loadRewardSettings();
    loadAdminData();
  }, []);

  const loadRewardSettings = async () => {
    try {
      const res = await walletService.getRewardSettings();
      if (res) {
        setSettings({
          reward_system_enabled: res.reward_system_enabled ?? true,
          spend_per_coin: res.spend_per_coin ?? 10,
          coins_per_rupee: res.coins_per_rupee ?? 10,
          max_redemption_percentage: res.max_redemption_percentage ?? 20,
          welcome_coins: res.welcome_coins ?? 100,
          first_order_coins: res.first_order_coins ?? 200,
          credit_delay_hours: res.credit_delay_hours ?? 24,
        });
      }
    } catch (err) {
      console.warn('Using default reward settings:', err);
    }
  };

  const loadAdminData = async () => {
    setIsLoadingData(true);
    try {
      const [custRes, txRes] = await Promise.all([
        walletService.adminGetCustomerRewards().catch(() => []),
        walletService.adminGetCoinTransactions(txTypeFilter).catch(() => []),
      ]);
      setCustomerStats(custRes || []);
      setTransactions(txRes || []);
    } catch (err) {
      console.error('Error loading admin reward data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadTxData();
  }, [txTypeFilter]);

  const loadTxData = async () => {
    try {
      const txRes = await walletService.adminGetCoinTransactions(txTypeFilter);
      setTransactions(txRes || []);
      setTxPage(1);
    } catch (err) {
      console.error('Error loading transactions:', err);
    }
  };

  // Save Settings Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await walletService.updateRewardSettings(settings);
      showNotification('success', 'Reward System rules saved successfully!');
      setShowRuleForm(false);
      loadRewardSettings();
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to save reward settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Filtering & Pagination Calculations
  const filteredCustomerStats = customerStats.filter(
    (c) =>
      c.customer_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.customer_email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const totalCustPages = Math.ceil(filteredCustomerStats.length / custLimit) || 1;
  const paginatedCustStats = filteredCustomerStats.slice((custPage - 1) * custLimit, custPage * custLimit);

  const totalTxPages = Math.ceil(transactions.length / txLimit) || 1;
  const paginatedTransactions = transactions.slice((txPage - 1) * txLimit, txPage * txLimit);

  return (
    <div style={{ width: '100%', maxWidth: '1380px', margin: '0 auto', paddingBottom: '32px', color: '#f5efe6' }}>
      {/* Header & Breadcrumb section */}
      {showRuleForm ? (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--beige)', marginBottom: '6px' }}>
            <span style={{ cursor: 'pointer', color: 'var(--gold)' }} onClick={() => setShowRuleForm(false)}>
              Reward Coins System
            </span>
            <span>&gt;</span>
            <span style={{ color: 'var(--cream)' }}>Configure Earning &amp; Redemption Rules</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '2.1rem', color: '#f5efe6', fontWeight: 700, margin: 0 }}>
            Configure Earning &amp; Redemption Rules
          </h1>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ color: 'rgba(201, 168, 76, 0.85)', fontSize: '0.75rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              — LOYALTY PROGRAM
            </span>
            <h1 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '2.1rem', color: '#f5efe6', fontWeight: 700, margin: 0 }}>
              Reward Coins System
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: settings.reward_system_enabled ? 'rgba(46, 204, 113, 0.12)' : 'rgba(231, 76, 60, 0.12)',
                color: settings.reward_system_enabled ? '#2ecc71' : '#e74c3c',
                border: settings.reward_system_enabled ? '1px solid rgba(46, 204, 113, 0.3)' : '1px solid rgba(231, 76, 60, 0.3)',
              }}
            >
              <ShieldCheck size={14} />
              {settings.reward_system_enabled ? 'Active & Enabled' : 'Disabled'}
            </span>
            <Button
              variant="glass"
              onClick={loadAdminData}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '8px 14px' }}
            >
              <RefreshCw size={15} className={isLoadingData ? 'spin' : ''} /> Refresh Data
            </Button>
          </div>
        </div>
      )}

      {/* Notification Banner */}
      {notification && (
        <div
          style={{
            marginBottom: '20px',
            padding: '12px 18px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: notification.type === 'success' ? '1px solid rgba(46, 204, 113, 0.3)' : '1px solid rgba(231, 76, 60, 0.3)',
            background: notification.type === 'success' ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)',
            color: notification.type === 'success' ? '#2ecc71' : '#e74c3c',
            fontSize: '0.88rem',
            fontWeight: 500,
          }}
        >
          {notification.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main View Mode */}
      {!showRuleForm ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Tab Navigation Buttons */}
          <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'rules' ? 'linear-gradient(135deg, #c9a84c 0%, #a68434 100%)' : 'rgba(255,255,255,0.06)',
                color: activeTab === 'rules' ? '#0f0c0a' : 'rgba(255,255,255,0.75)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'rules' ? '0 4px 14px rgba(201,168,76,0.3)' : 'none',
              }}
            >
              Active Reward Rules
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'history' ? 'linear-gradient(135deg, #c9a84c 0%, #a68434 100%)' : 'rgba(255,255,255,0.06)',
                color: activeTab === 'history' ? '#0f0c0a' : 'rgba(255,255,255,0.75)',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: activeTab === 'history' ? '0 4px 14px rgba(201,168,76,0.3)' : 'none',
              }}
            >
              Coin Transaction History
            </button>
          </div>

          {/* TAB 1: Active Reward Rules */}
          {activeTab === 'rules' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Active Rules Summary Panel — Compact 3x2 Grid */}
              <div
                style={{
                  background: 'rgba(20, 16, 13, 0.85)',
                  border: '1px solid rgba(201, 168, 76, 0.2)',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ color: '#c9a84c', fontSize: '1.15rem', fontFamily: 'var(--font-display, serif)', fontWeight: 600, margin: 0 }}>
                      Active Reward System Rules
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', margin: '2px 0 0 0' }}>
                      Current automated reward generation, redemption rate, and 24-hour credit rules
                    </p>
                  </div>
                  <Button
                    variant="glass"
                    onClick={() => setShowRuleForm(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '7px 14px' }}
                  >
                    <Edit2 size={14} /> Edit Rules
                  </Button>
                </div>

                {/* Compact 3 Columns x 2 Rows Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                  {/* Rule 1: Account Creation */}
                  <div style={{ background: 'rgba(10, 8, 6, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <UserCheck size={16} color="#c9a84c" />
                      <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Account Creation</span>
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f5efe6' }}>
                      {settings.welcome_coins ?? 100} Coins
                    </div>
                    <span style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px', display: 'block' }}>
                      Awarded once on registration
                    </span>
                  </div>

                  {/* Rule 2: First Order Bonus */}
                  <div style={{ background: 'rgba(10, 8, 6, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <Gift size={16} color="#c9a84c" />
                      <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>First Order Bonus</span>
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f5efe6' }}>
                      {settings.first_order_coins ?? 200} Bonus Coins
                    </div>
                    <span style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px', display: 'block' }}>
                      Awarded once on 1st eligible order
                    </span>
                  </div>

                  {/* Rule 3: Order Reward Rate */}
                  <div style={{ background: 'rgba(10, 8, 6, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <Coins size={16} color="#c9a84c" />
                      <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Order Reward Rate</span>
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f5efe6' }}>
                      10 Coins per ₹100
                    </div>
                    <span style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px', display: 'block' }}>
                      Earned on eligible purchases
                    </span>
                  </div>

                  {/* Rule 4: Coin Value */}
                  <div style={{ background: 'rgba(10, 8, 6, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <Award size={16} color="#c9a84c" />
                      <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Coin Value</span>
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f5efe6' }}>
                      {settings.coins_per_rupee} Coins = ₹1
                    </div>
                    <span style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px', display: 'block' }}>
                      Redemption conversion at checkout
                    </span>
                  </div>

                  {/* Rule 5: Max Redemption Cap */}
                  <div style={{ background: 'rgba(10, 8, 6, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <Percent size={16} color="#c9a84c" />
                      <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Max Redemption</span>
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f5efe6' }}>
                      {settings.max_redemption_percentage}%
                    </div>
                    <span style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px', display: 'block' }}>
                      Max % of order subtotal
                    </span>
                  </div>

                  {/* Rule 6: 24-Hour Credit Delay */}
                  <div style={{ background: 'rgba(10, 8, 6, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <Clock size={16} color="#c9a84c" />
                      <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Credit Delay</span>
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f5efe6' }}>
                      {settings.credit_delay_hours ?? 24} Hours
                    </div>
                    <span style={{ fontSize: '0.73rem', color: 'rgba(255,255,255,0.45)', marginTop: '2px', display: 'block' }}>
                      Pending hold before available
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Reward Information Overview Table */}
              <div
                style={{
                  background: 'rgba(20, 16, 13, 0.85)',
                  border: '1px solid rgba(201, 168, 76, 0.2)',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ color: '#c9a84c', fontSize: '1.1rem', fontFamily: 'var(--font-display, serif)', fontWeight: 600, margin: 0 }}>
                      Customer Reward Information
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', margin: '2px 0 0 0' }}>
                      Real-time records of customer balances, 24h pending coins, totals, and first order bonus status.
                    </p>
                  </div>

                  {/* Search Customer Bar */}
                  <div style={{ position: 'relative', width: '260px' }}>
                    <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                    <input
                      type="text"
                      placeholder="Search customer..."
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setCustPage(1);
                      }}
                      style={{
                        width: '100%',
                        padding: '7px 12px 7px 34px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(0,0,0,0.4)',
                        color: '#fff',
                        fontSize: '0.8rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Compact Customer Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.81rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(201,168,76,0.9)' }}>
                        <th style={{ padding: '10px 12px' }}>Customer</th>
                        <th style={{ padding: '10px 12px' }}>Available Coins</th>
                        <th style={{ padding: '10px 12px' }}>Pending Coins (24h)</th>
                        <th style={{ padding: '10px 12px' }}>Total Earned</th>
                        <th style={{ padding: '10px 12px' }}>Total Redeemed</th>
                        <th style={{ padding: '10px 12px' }}>Total Returned</th>
                        <th style={{ padding: '10px 12px' }}>Total Reversed</th>
                        <th style={{ padding: '10px 12px' }}>1st Order Bonus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingData ? (
                        <tr>
                          <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                            Loading customer reward information...
                          </td>
                        </tr>
                      ) : paginatedCustStats.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                            No customer reward records found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedCustStats.map((cust) => (
                          <tr key={cust.user_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s ease' }}>
                            <td style={{ padding: '10px 12px', color: '#f5efe6' }}>
                              <div style={{ fontWeight: 600 }}>{cust.customer_name}</div>
                              <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.45)' }}>{cust.customer_email}</div>
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 700, color: '#2ecc71' }}>{cust.available_coins}</td>
                            <td style={{ padding: '10px 12px', color: cust.pending_coins > 0 ? '#f39c12' : 'rgba(255,255,255,0.4)' }}>
                              {cust.pending_coins > 0 ? (
                                <span>
                                  <strong style={{ color: '#f39c12' }}>{cust.pending_coins} Coins</strong>
                                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'rgba(243,156,18,0.7)' }}>24h Hold</span>
                                </span>
                              ) : (
                                '0'
                              )}
                            </td>
                            <td style={{ padding: '10px 12px', color: '#c9a84c' }}>{cust.total_coins_earned}</td>
                            <td style={{ padding: '10px 12px', color: '#e74c3c' }}>{cust.total_coins_redeemed}</td>
                            <td style={{ padding: '10px 12px', color: '#3498db' }}>{cust.total_coins_returned}</td>
                            <td style={{ padding: '10px 12px', color: '#9b59b6' }}>{cust.total_coins_reversed}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <span
                                style={{
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                  fontSize: '0.73rem',
                                  fontWeight: 600,
                                  background:
                                    cust.first_order_bonus_status === 'Awarded'
                                      ? 'rgba(46,204,113,0.15)'
                                      : cust.first_order_bonus_status === 'Eligible'
                                      ? 'rgba(201,168,76,0.15)'
                                      : cust.first_order_bonus_status === 'Pending'
                                      ? 'rgba(243,156,18,0.15)'
                                      : 'rgba(255,255,255,0.08)',
                                  color:
                                    cust.first_order_bonus_status === 'Awarded'
                                      ? '#2ecc71'
                                      : cust.first_order_bonus_status === 'Eligible'
                                      ? '#c9a84c'
                                      : cust.first_order_bonus_status === 'Pending'
                                      ? '#f39c12'
                                      : 'rgba(255,255,255,0.4)',
                                  border: `1px solid ${
                                    cust.first_order_bonus_status === 'Awarded'
                                      ? 'rgba(46,204,113,0.3)'
                                      : cust.first_order_bonus_status === 'Eligible'
                                      ? 'rgba(201,168,76,0.3)'
                                      : cust.first_order_bonus_status === 'Pending'
                                      ? 'rgba(243,156,18,0.3)'
                                      : 'rgba(255,255,255,0.1)'
                                  }`,
                                }}
                              >
                                {cust.first_order_bonus_status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Compact Customer Table Pagination */}
                {filteredCustomerStats.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
                    <span>
                      Showing {Math.min((custPage - 1) * custLimit + 1, filteredCustomerStats.length)}–
                      {Math.min(custPage * custLimit, filteredCustomerStats.length)} of {filteredCustomerStats.length}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        disabled={custPage <= 1}
                        onClick={() => setCustPage((p) => Math.max(1, p - 1))}
                        style={{
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: custPage <= 1 ? 'rgba(255,255,255,0.25)' : '#fff',
                          borderRadius: '4px',
                          padding: '4px 10px',
                          cursor: custPage <= 1 ? 'not-allowed' : 'pointer',
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <ChevronLeft size={14} /> Previous
                      </button>
                      {Array.from({ length: totalCustPages }, (_, i) => i + 1).map((pg) => (
                        <button
                          key={pg}
                          onClick={() => setCustPage(pg)}
                          style={{
                            background: custPage === pg ? '#c9a84c' : 'rgba(0,0,0,0.3)',
                            color: custPage === pg ? '#0f0c0a' : '#fff',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            fontWeight: custPage === pg ? 700 : 400,
                            fontSize: '0.78rem',
                          }}
                        >
                          {pg}
                        </button>
                      ))}
                      <button
                        disabled={custPage >= totalCustPages}
                        onClick={() => setCustPage((p) => Math.min(totalCustPages, p + 1))}
                        style={{
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: custPage >= totalCustPages ? 'rgba(255,255,255,0.25)' : '#fff',
                          borderRadius: '4px',
                          padding: '4px 10px',
                          cursor: custPage >= totalCustPages ? 'not-allowed' : 'pointer',
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        Next <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Coin Transaction History */}
          {activeTab === 'history' && (
            <div
              style={{
                background: 'rgba(20, 16, 13, 0.85)',
                border: '1px solid rgba(201, 168, 76, 0.2)',
                borderRadius: '12px',
                padding: '20px 24px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ color: '#c9a84c', fontSize: '1.1rem', fontFamily: 'var(--font-display, serif)', fontWeight: 600, margin: 0 }}>
                    Coin Transaction History
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', margin: '2px 0 0 0' }}>
                    Audited log of every reward movement, redemption, return, reversal, and 24h status.
                  </p>
                </div>

                {/* Type Filter Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Filter size={15} color="#c9a84c" />
                  <select
                    value={txTypeFilter}
                    onChange={(e) => setTxTypeFilter(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: 'rgba(10,8,6,0.95)',
                      color: '#fff',
                      fontSize: '0.8rem',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="ALL">All Transaction Types</option>
                    <option value="ACCOUNT_CREATION">Account Creation Reward</option>
                    <option value="FIRST_ORDER_BONUS">First Order Bonus</option>
                    <option value="ORDER_REWARD">Order Reward</option>
                    <option value="REDEEM">Coin Redemption</option>
                    <option value="REFUND">Coin Return</option>
                    <option value="ADJUSTMENT">Coin Reversal</option>
                  </select>
                </div>
              </div>

              {/* Compact Transaction Log Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.81rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(201,168,76,0.9)' }}>
                      <th style={{ padding: '10px 12px' }}>Date &amp; Time</th>
                      <th style={{ padding: '10px 12px' }}>Customer</th>
                      <th style={{ padding: '10px 12px' }}>Transaction Type</th>
                      <th style={{ padding: '10px 12px' }}>Coins</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px' }}>Details &amp; Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                          No coin transactions logged yet.
                        </td>
                      </tr>
                    ) : (
                      paginatedTransactions.map((tx) => {
                        const isPositive = tx.coins > 0;
                        return (
                          <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>{tx.created_at}</td>
                            <td style={{ padding: '10px 12px', color: '#f5efe6' }}>
                              <div style={{ fontWeight: 600 }}>{tx.customer_name}</div>
                              <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.45)' }}>{tx.customer_email}</div>
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{tx.transaction_type}</td>
                            <td style={{ padding: '10px 12px', fontWeight: 700, color: isPositive ? '#2ecc71' : '#e74c3c' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                <span>{isPositive ? `+${tx.coins}` : tx.coins}</span>
                              </div>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <span
                                style={{
                                  padding: '2px 7px',
                                  borderRadius: '4px',
                                  fontSize: '0.73rem',
                                  fontWeight: 600,
                                  background:
                                    tx.status === 'Pending'
                                      ? 'rgba(243,156,18,0.15)'
                                      : tx.status === 'Credited' || tx.status === 'Available'
                                      ? 'rgba(46,204,113,0.15)'
                                      : tx.status === 'Redeemed'
                                      ? 'rgba(231,76,60,0.15)'
                                      : tx.status === 'Returned'
                                      ? 'rgba(52,152,219,0.15)'
                                      : tx.status === 'Reversed'
                                      ? 'rgba(155,89,182,0.15)'
                                      : 'rgba(255,255,255,0.1)',
                                  color:
                                    tx.status === 'Pending'
                                      ? '#f39c12'
                                      : tx.status === 'Credited' || tx.status === 'Available'
                                      ? '#2ecc71'
                                      : tx.status === 'Redeemed'
                                      ? '#e74c3c'
                                      : tx.status === 'Returned'
                                      ? '#3498db'
                                      : tx.status === 'Reversed'
                                      ? '#9b59b6'
                                      : 'rgba(255,255,255,0.6)',
                                  border: `1px solid ${
                                    tx.status === 'Pending'
                                      ? 'rgba(243,156,18,0.3)'
                                      : tx.status === 'Credited' || tx.status === 'Available'
                                      ? 'rgba(46,204,113,0.3)'
                                      : tx.status === 'Redeemed'
                                      ? 'rgba(231,76,60,0.3)'
                                      : tx.status === 'Returned'
                                      ? 'rgba(52,152,219,0.3)'
                                      : tx.status === 'Reversed'
                                      ? 'rgba(155,89,182,0.3)'
                                      : 'rgba(255,255,255,0.15)'
                                  }`,
                                }}
                              >
                                {tx.status}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px', color: 'rgba(255,255,255,0.85)' }}>
                              <div>{tx.reason}</div>
                              <div style={{ display: 'flex', gap: '10px', fontSize: '0.74rem', marginTop: '2px' }}>
                                {tx.order_id && (
                                  <span style={{ color: '#c9a84c', fontFamily: 'monospace' }}>Order: #{tx.order_id}</span>
                                )}
                                {tx.available_at ? (
                                  <span style={{ color: '#f39c12' }}>Hold 24h (Avail {tx.available_at})</span>
                                ) : (
                                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Immediate</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Compact Transaction Log Table Pagination */}
              {transactions.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>
                  <span>
                    Showing {Math.min((txPage - 1) * txLimit + 1, transactions.length)}–
                    {Math.min(txPage * txLimit, transactions.length)} of {transactions.length}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      disabled={txPage <= 1}
                      onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: txPage <= 1 ? 'rgba(255,255,255,0.25)' : '#fff',
                        borderRadius: '4px',
                        padding: '4px 10px',
                        cursor: txPage <= 1 ? 'not-allowed' : 'pointer',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>
                    {Array.from({ length: totalTxPages }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        onClick={() => setTxPage(pg)}
                        style={{
                          background: txPage === pg ? '#c9a84c' : 'rgba(0,0,0,0.3)',
                          color: txPage === pg ? '#0f0c0a' : '#fff',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontWeight: txPage === pg ? 700 : 400,
                          fontSize: '0.78rem',
                        }}
                      >
                        {pg}
                      </button>
                    ))}
                    <button
                      disabled={txPage >= totalTxPages}
                      onClick={() => setTxPage((p) => Math.min(totalTxPages, p + 1))}
                      style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: txPage >= totalTxPages ? 'rgba(255,255,255,0.25)' : '#fff',
                        borderRadius: '4px',
                        padding: '4px 10px',
                        cursor: txPage >= totalTxPages ? 'not-allowed' : 'pointer',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Configuration Form View */
        <div
          style={{
            background: 'rgba(20, 16, 13, 0.85)',
            border: '1px solid rgba(201, 168, 76, 0.2)',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(12px)',
            maxWidth: '720px',
          }}
        >
          <h2 style={{ color: '#c9a84c', fontSize: '1.2rem', fontFamily: 'var(--font-display, serif)', fontWeight: 600, margin: '0 0 20px 0' }}>
            System Earning, Signup &amp; Redemption Rules
          </h2>

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Enable Reward System Switch */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'rgba(10, 8, 6, 0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
              }}
            >
              <div>
                <span style={{ color: '#f5efe6', fontSize: '0.88rem', fontWeight: 600, display: 'block' }}>Enable Reward System</span>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.76rem' }}>Master toggle for coin generation &amp; checkout redemptions</span>
              </div>
              <div
                onClick={() => setSettings({ ...settings, reward_system_enabled: !settings.reward_system_enabled })}
                style={{
                  width: '46px',
                  height: '24px',
                  borderRadius: '12px',
                  background: settings.reward_system_enabled ? '#c9a84c' : 'rgba(255,255,255,0.15)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#0f0c0a',
                    position: 'absolute',
                    top: '3px',
                    left: settings.reward_system_enabled ? '25px' : '3px',
                    transition: 'all 0.2s ease',
                  }}
                />
              </div>
            </div>

            {/* Input 1: Account Creation Coins */}
            <div>
              <label style={{ color: '#c9a84c', fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Account Creation Reward (Coins)
              </label>
              <input
                type="number"
                min="0"
                value={settings.welcome_coins ?? 100}
                onChange={(e) => setSettings({ ...settings, welcome_coins: parseInt(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(10, 8, 6, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#f5efe6',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                required
              />
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>
                Automatically awarded once when a customer creates an account (Default: 100 Coins).
              </p>
            </div>

            {/* Input 2: First Order Bonus Coins */}
            <div>
              <label style={{ color: '#c9a84c', fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                First Order Bonus (Coins)
              </label>
              <input
                type="number"
                min="0"
                value={settings.first_order_coins ?? 200}
                onChange={(e) => setSettings({ ...settings, first_order_coins: parseInt(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(10, 8, 6, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#f5efe6',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                required
              />
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>
                Bonus coins awarded once on customer's first eligible order (Default: 200 Coins).
              </p>
            </div>

            {/* Input 3: Order Earning Rate (Spent per 1 coin) */}
            <div>
              <label style={{ color: '#c9a84c', fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Order Value per 1 Coin Earned (₹)
              </label>
              <input
                type="number"
                min="1"
                value={settings.spend_per_coin}
                onChange={(e) => setSettings({ ...settings, spend_per_coin: parseFloat(e.target.value) || 1 })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(10, 8, 6, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#f5efe6',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                required
              />
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>
                ₹10 spent = 1 Coin earned (i.e. ₹100 order value = 10 Coins).
              </p>
            </div>

            {/* Input 4: Coins per Rupee Discount */}
            <div>
              <label style={{ color: '#c9a84c', fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Coins Needed for ₹1 Discount
              </label>
              <input
                type="number"
                min="1"
                value={settings.coins_per_rupee}
                onChange={(e) => setSettings({ ...settings, coins_per_rupee: parseFloat(e.target.value) || 1 })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(10, 8, 6, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#f5efe6',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                required
              />
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>
                10 Coins = ₹1 discount value (100 Coins = ₹10).
              </p>
            </div>

            {/* Input 5: Max redemption limit % */}
            <div>
              <label style={{ color: '#c9a84c', fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Maximum Order Redemption Limit (%)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.max_redemption_percentage}
                onChange={(e) => setSettings({ ...settings, max_redemption_percentage: parseFloat(e.target.value) || 1 })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(10, 8, 6, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#f5efe6',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                required
              />
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>
                Maximum percentage of order subtotal that can be paid using coins (Default: 20%).
              </p>
            </div>

            {/* Input 6: Credit Delay Hours */}
            <div>
              <label style={{ color: '#c9a84c', fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Order Coin Credit Delay (Hours)
              </label>
              <input
                type="number"
                min="0"
                value={settings.credit_delay_hours ?? 24}
                onChange={(e) => setSettings({ ...settings, credit_delay_hours: parseInt(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(10, 8, 6, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#f5efe6',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                required
              />
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>
                Waiting period before order-earned coins become available for redemption (Default: 24 Hours).
              </p>
            </div>

            {/* Form Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setShowRuleForm(false)}
                style={{
                  padding: '10px 18px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#f5efe6',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingSettings}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #c9a84c 0%, #e5c875 50%, #c9a84c 100%)',
                  color: '#0f0c0a',
                  fontWeight: 700,
                  borderRadius: '8px',
                  border: 'none',
                  cursor: isSavingSettings ? 'not-allowed' : 'pointer',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  fontSize: '0.82rem',
                  boxShadow: '0 4px 16px rgba(201,168,76,0.3)',
                  opacity: isSavingSettings ? 0.6 : 1,
                }}
              >
                {isSavingSettings ? 'SAVING RULES...' : 'SAVE REWARD RULES'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
