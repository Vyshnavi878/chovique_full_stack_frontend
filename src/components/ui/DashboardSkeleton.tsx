import React from 'react';

export const DashboardKpiSkeleton: React.FC = () => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '30px',
      }}
    >
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="glass-panel"
          style={{
            padding: '20px',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            minHeight: '110px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(26, 13, 0, 0.4) 25%, rgba(40, 20, 0, 0.6) 50%, rgba(26, 13, 0, 0.4) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.8s infinite',
          }}
        >
          <div style={{ width: '60%', height: '14px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px' }} />
          <div style={{ width: '80%', height: '28px', background: 'rgba(201, 168, 76, 0.15)', borderRadius: '4px', margin: '10px 0 6px 0' }} />
          <div style={{ width: '40%', height: '12px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px' }} />
        </div>
      ))}
    </div>
  );
};

export const DashboardCardSkeleton: React.FC<{ height?: string }> = ({ height = '320px' }) => {
  return (
    <div
      className="glass-panel"
      style={{
        padding: '24px',
        border: '1px solid var(--glass-border)',
        borderRadius: '8px',
        height,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        background: 'linear-gradient(90deg, rgba(26, 13, 0, 0.4) 25%, rgba(40, 20, 0, 0.6) 50%, rgba(26, 13, 0, 0.4) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.8s infinite',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: '35%', height: '20px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px' }} />
        <div style={{ width: '20%', height: '16px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px' }} />
      </div>
      <div style={{ flexGrow: 1, width: '100%', background: 'rgba(0, 0, 0, 0.2)', borderRadius: '6px' }} />
    </div>
  );
};
