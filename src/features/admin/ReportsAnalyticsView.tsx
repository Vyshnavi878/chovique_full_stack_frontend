import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Download,
  Filter,
  BarChart3,
  TrendingUp,
  ShoppingBag,
  Users,
  Coins,
  Tag,
  FileSpreadsheet,
  AlertCircle,
  Check,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { adminService } from '../../services/adminService';

type ReportType = 'sales' | 'orders' | 'products' | 'customers' | 'coupons' | 'reward_coins';
type DatePreset = '7days' | '30days' | '3months' | '1year' | 'custom';

interface KPICard {
  title: string;
  value: string;
  growth_percentage?: number;
  subtext?: string;
}

interface ChartPoint {
  label: string;
  value: number;
  secondary_value?: number;
}

interface ReportData {
  report_type: string;
  start_date: string;
  end_date: string;
  kpi_summary: KPICard[];
  chart_data: ChartPoint[];
  table_headers: string[];
  table_rows: any[][];
  totals_footer?: any[];
  total_records: number;
  page: number;
  total_pages: number;
}

export const ReportsAnalyticsView: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [preset, setPreset] = useState<DatePreset>('7days');

  // Dates (Default to last 7 days)
  const getInitialDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  const initial = getInitialDates();
  const [startDate, setStartDate] = useState<string>(initial.start);
  const [endDate, setEndDate] = useState<string>(initial.end);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Loading & State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isExportingCsv, setIsExportingCsv] = useState<boolean>(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handle Preset Changes
  const handlePresetChange = (newPreset: DatePreset) => {
    setPreset(newPreset);
    const end = new Date();
    const start = new Date();

    if (newPreset === '7days') {
      start.setDate(end.getDate() - 6);
    } else if (newPreset === '30days') {
      start.setDate(end.getDate() - 29);
    } else if (newPreset === '3months') {
      start.setMonth(end.getMonth() - 3);
    } else if (newPreset === '1year') {
      start.setFullYear(end.getFullYear() - 1);
    }

    if (newPreset !== 'custom') {
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
      setCurrentPage(1);
    }
  };

  // Fetch Report Data
  const fetchReport = async (page = 1) => {
    setErrorMsg(null);

    if (!startDate || !endDate) {
      setErrorMsg('Both Start Date and End Date are required.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setErrorMsg('Start Date cannot be after End Date.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await adminService.getReport({
        report_type: reportType,
        start_date: startDate,
        end_date: endDate,
        page,
        limit: 20,
      });
      setReportData(res);
      setCurrentPage(page);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to fetch report data.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount or when reportType/dates change
  useEffect(() => {
    fetchReport(1);
  }, [reportType, startDate, endDate]);

  // Handle Excel Export
  const handleExportExcel = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!startDate || !endDate) {
      setErrorMsg('Both Start Date and End Date are required for export.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setErrorMsg('Start Date cannot be after End Date.');
      return;
    }

    setIsExportingExcel(true);
    try {
      await adminService.downloadExcelReport({
        report_type: reportType,
        start_date: startDate,
        end_date: endDate,
      });
      setSuccessMsg('Excel report downloaded successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to download report Excel.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Handle PDF Export
  const handleExportPdf = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!startDate || !endDate) {
      setErrorMsg('Both Start Date and End Date are required for export.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setErrorMsg('Start Date cannot be after End Date.');
      return;
    }

    setIsExportingPdf(true);
    try {
      await adminService.downloadPdfReport({
        report_type: reportType,
        start_date: startDate,
        end_date: endDate,
      });
      setSuccessMsg('PDF report downloaded successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to download report PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handle CSV Export
  const handleExportCsv = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!startDate || !endDate) {
      setErrorMsg('Both Start Date and End Date are required for export.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setErrorMsg('Start Date cannot be after End Date.');
      return;
    }

    setIsExportingCsv(true);
    try {
      await adminService.downloadCsvReport({
        report_type: reportType,
        start_date: startDate,
        end_date: endDate,
      });
      setSuccessMsg('CSV report downloaded successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to download report CSV.');
    } finally {
      setIsExportingCsv(false);
    }
  };

  // Max value calculation for chart bars
  const maxChartVal = reportData?.chart_data?.reduce((max, p) => Math.max(max, p.value), 0) || 1;

  const reportTabs: { id: ReportType; label: string; icon: any }[] = [
    { id: 'sales', label: 'Sales Report', icon: TrendingUp },
    { id: 'orders', label: 'Order Report', icon: BarChart3 },
    { id: 'products', label: 'Product Report', icon: ShoppingBag },
    { id: 'customers', label: 'Customer Report', icon: Users },
    { id: 'coupons', label: 'Coupon Report', icon: Tag },
    { id: 'reward_coins', label: 'Reward Coin Report', icon: Coins },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', paddingBottom: '48px', color: '#f5efe6' }}>
      {/* Header & Date Presets Header Row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <span style={{ color: 'rgba(201, 168, 76, 0.85)', fontSize: '0.78rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            — BUSINESS REPORTS
          </span>
          <h1 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '2.4rem', color: '#f5efe6', fontWeight: 700, margin: 0 }}>
            Reports & Analytics
          </h1>
        </div>

        {/* Date Quick Presets */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(20, 16, 13, 0.85)', border: '1px solid rgba(201, 168, 76, 0.2)', borderRadius: '8px', padding: '4px' }}>
          {(['7days', '30days', '3months', '1year', 'custom'] as DatePreset[]).map((p) => {
            const labels: Record<DatePreset, string> = {
              '7days': '7 Days',
              '30days': '30 Days',
              '3months': '3 Months',
              '1year': '1 Year',
              custom: 'Custom',
            };
            const isActive = preset === p;
            return (
              <button
                key={p}
                onClick={() => handlePresetChange(p)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isActive ? 'linear-gradient(135deg, #c9a84c 0%, #e5c875 100%)' : 'transparent',
                  color: isActive ? '#0f0c0a' : 'rgba(255,255,255,0.7)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Pickers & Actions Bar */}
      <div style={{ background: 'rgba(20, 16, 13, 0.85)', border: '1px solid rgba(201, 168, 76, 0.2)', borderRadius: '12px', padding: '20px 24px', marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} color="#c9a84c" />
            <span style={{ fontSize: '0.82rem', color: '#c9a84c', fontWeight: 600 }}>Start Date:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPreset('custom');
              }}
              style={{
                padding: '8px 12px',
                background: 'rgba(10, 8, 6, 0.8)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '6px',
                color: '#f5efe6',
                fontSize: '0.85rem',
                outline: 'none',
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} color="#c9a84c" />
            <span style={{ fontSize: '0.82rem', color: '#c9a84c', fontWeight: 600 }}>End Date:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPreset('custom');
              }}
              style={{
                padding: '8px 12px',
                background: 'rgba(10, 8, 6, 0.8)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '6px',
                color: '#f5efe6',
                fontSize: '0.85rem',
                outline: 'none',
              }}
              required
            />
          </div>
        </div>        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.55)', marginRight: '8px' }}>
            Selected Period: <strong>{startDate}</strong> to <strong>{endDate}</strong>
          </span>

          <button
            onClick={() => fetchReport(1)}
            disabled={isLoading}
            style={{
              padding: '10px 18px',
              background: 'rgba(201, 168, 76, 0.15)',
              border: '1px solid rgba(201, 168, 76, 0.4)',
              borderRadius: '8px',
              color: '#c9a84c',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            VIEW REPORT
          </button>

          {/* Download Excel - Primary */}
          <button
            onClick={handleExportExcel}
            disabled={isExportingExcel || isExportingPdf || isExportingCsv}
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
              opacity: isExportingExcel ? 0.6 : 1,
            }}
          >
            {isExportingExcel ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Download Excel
          </button>

          {/* Download PDF */}
          <button
            onClick={handleExportPdf}
            disabled={isExportingExcel || isExportingPdf || isExportingCsv}
            style={{
              padding: '10px 18px',
              background: 'rgba(20, 16, 13, 0.85)',
              border: '1px solid rgba(201, 168, 76, 0.5)',
              borderRadius: '8px',
              color: '#c9a84c',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isExportingPdf ? 0.6 : 1,
            }}
          >
            {isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Download PDF
          </button>

          {/* Download CSV */}
          <button
            onClick={handleExportCsv}
            disabled={isExportingExcel || isExportingPdf || isExportingCsv}
            style={{
              padding: '10px 18px',
              background: 'rgba(20, 16, 13, 0.85)',
              border: '1px solid rgba(201, 168, 76, 0.5)',
              borderRadius: '8px',
              color: '#c9a84c',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isExportingCsv ? 0.6 : 1,
            }}
          >
            {isExportingCsv ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Download CSV
          </button>
        </div>
      </div>

      {/* Error / Validation Notification */}
      {errorMsg && (
        <div
          style={{
            marginBottom: '24px',
            padding: '14px 20px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid rgba(231, 76, 60, 0.3)',
            background: 'rgba(231, 76, 60, 0.1)',
            color: '#e74c3c',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Success Notification */}
      {successMsg && (
        <div
          style={{
            marginBottom: '24px',
            padding: '14px 20px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid rgba(46, 204, 113, 0.3)',
            background: 'rgba(46, 204, 113, 0.1)',
            color: '#2ecc71',
            fontSize: '0.9rem',
            fontWeight: 500,
          }}
        >
          <Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Report Type Selector Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '28px' }}>
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = reportType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              style={{
                padding: '12px 18px',
                borderRadius: '8px',
                border: isActive ? '1px solid #c9a84c' : '1px solid rgba(255,255,255,0.08)',
                background: isActive ? 'rgba(201, 168, 76, 0.12)' : 'rgba(20, 16, 13, 0.85)',
                color: isActive ? '#f5efe6' : 'rgba(255,255,255,0.6)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={16} color={isActive ? '#c9a84c' : 'rgba(255,255,255,0.45)'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div style={{ padding: '60px', textAlign: 'center', background: 'rgba(20, 16, 13, 0.85)', border: '1px solid rgba(201, 168, 76, 0.2)', borderRadius: '12px' }}>
          <Loader2 size={36} color="#c9a84c" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>Generating {reportType.replace('_', ' ')} analytics report...</p>
        </div>
      ) : reportData ? (
        <>
          {/* KPI Summary Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            {reportData.kpi_summary.map((kpi, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(20, 16, 13, 0.85)',
                  border: '1px solid rgba(201, 168, 76, 0.2)',
                  borderRadius: '12px',
                  padding: '22px 24px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500, marginBottom: '8px' }}>
                  {kpi.title}
                </div>
                <div style={{ fontSize: '1.9rem', fontFamily: 'var(--font-display, serif)', fontWeight: 700, color: '#f5efe6', marginBottom: '6px' }}>
                  {kpi.value}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
                  {kpi.growth_percentage !== undefined && kpi.growth_percentage !== null && (
                    <span style={{ color: kpi.growth_percentage >= 0 ? '#2ecc71' : '#e74c3c', fontWeight: 700 }}>
                      {kpi.growth_percentage >= 0 ? `+${kpi.growth_percentage}%` : `${kpi.growth_percentage}%`}
                    </span>
                  )}
                  {kpi.subtext && <span style={{ color: 'rgba(255,255,255,0.45)' }}>{kpi.subtext}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Chart & Top Breakdown Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '28px', marginBottom: '32px' }}>
            {/* Sales / Performance Trend Chart */}
            <div
              style={{
                background: 'rgba(20, 16, 13, 0.85)',
                border: '1px solid rgba(201, 168, 76, 0.2)',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              <h3 style={{ color: '#c9a84c', fontSize: '1.1rem', fontFamily: 'var(--font-display, serif)', fontWeight: 600, margin: '0 0 20px 0' }}>
                Trend Analysis
              </h3>

              {reportData.chart_data && reportData.chart_data.length > 0 ? (
                <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '12px', paddingTop: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  {reportData.chart_data.slice(0, 12).map((pt, i) => {
                    const pct = Math.max(8, Math.round((pt.value / maxChartVal) * 100));
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                        <div style={{ fontSize: '0.65rem', color: '#c9a84c', fontWeight: 600, marginBottom: '4px' }}>
                          {pt.value >= 1000 ? `${(pt.value / 1000).toFixed(1)}K` : pt.value}
                        </div>
                        <div
                          style={{
                            width: '100%',
                            maxWidth: '32px',
                            height: `${pct}%`,
                            background: 'linear-gradient(180deg, #e5c875 0%, #c9a84c 100%)',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.4s ease',
                          }}
                        />
                        <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', marginTop: '8px', whiteSpace: 'nowrap' }}>
                          {pt.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                  No trend data available for this range.
                </div>
              )}
            </div>

            {/* Top Items List */}
            <div
              style={{
                background: 'rgba(20, 16, 13, 0.85)',
                border: '1px solid rgba(201, 168, 76, 0.2)',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              <h3 style={{ color: '#c9a84c', fontSize: '1.1rem', fontFamily: 'var(--font-display, serif)', fontWeight: 600, margin: '0 0 20px 0' }}>
                Top Report Summary
              </h3>

              {reportData.table_rows && reportData.table_rows.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {reportData.table_rows.slice(0, 5).map((row, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(10, 8, 6, 0.6)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f5efe6' }}>{row[0]}</div>
                        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>{row[1]}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#c9a84c' }}>
                          {row[row.length - 1]}
                        </div>
                        {row.length > 3 && (
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>{row[row.length - 2]}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                  No items found.
                </div>
              )}
            </div>
          </div>

          {/* Detailed Data Table */}
          <div
            style={{
              background: 'rgba(20, 16, 13, 0.85)',
              border: '1px solid rgba(201, 168, 76, 0.2)',
              borderRadius: '12px',
              padding: '28px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ color: '#c9a84c', fontSize: '1.2rem', fontFamily: 'var(--font-display, serif)', fontWeight: 600, margin: 0 }}>
                Detailed Report Dataset
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                Showing {reportData.table_rows.length} of {reportData.total_records} records
              </span>
            </div>

            {reportData.table_rows.length > 0 ? (
              <>
                <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#c9a84c', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {reportData.table_headers.map((h, i) => (
                          <th key={i} style={{ padding: '12px 16px' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.table_rows.map((row, rIdx) => (
                        <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#f5efe6', fontSize: '0.88rem' }}>
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} style={{ padding: '14px 16px' }}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                    {reportData.totals_footer && (
                      <tfoot>
                        <tr style={{ borderTop: '2px solid rgba(201, 168, 76, 0.4)', background: 'rgba(201, 168, 76, 0.05)', color: '#c9a84c', fontWeight: 700, fontSize: '0.9rem' }}>
                          {reportData.totals_footer.map((fCell, fIdx) => (
                            <td key={fIdx} style={{ padding: '14px 16px' }}>{fCell}</td>
                          ))}
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Pagination Controls */}
                {reportData.total_pages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                      Page {reportData.page} of {reportData.total_pages}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => fetchReport(reportData.page - 1)}
                        disabled={reportData.page <= 1}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.15)',
                          background: 'rgba(10, 8, 6, 0.8)',
                          color: '#f5efe6',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          opacity: reportData.page <= 1 ? 0.4 : 1,
                        }}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => fetchReport(reportData.page + 1)}
                        disabled={reportData.page >= reportData.total_pages}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.15)',
                          background: 'rgba(10, 8, 6, 0.8)',
                          color: '#f5efe6',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          opacity: reportData.page >= reportData.total_pages ? 0.4 : 1,
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Empty State */
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <FileSpreadsheet size={42} color="rgba(201,168,76,0.4)" style={{ margin: '0 auto 12px auto' }} />
                <h4 style={{ color: '#f5efe6', fontSize: '1rem', margin: '0 0 6px 0' }}>No Records Found</h4>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0 }}>
                  There are no {reportType.replace('_', ' ')} transactions logged for the selected date range ({startDate} to {endDate}).
                </p>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};
