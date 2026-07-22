import React from 'react';

interface ProgressProps {
  value: number;
  max?: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  height = 4,
  color = 'var(--gold)',
  backgroundColor = 'rgba(255, 255, 255, 0.1)',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      style={{
        width: '100%',
        height: `${height}px`,
        background: backgroundColor,
        borderRadius: `${height / 2}px`,
        overflow: 'hidden',
      }}
      className={`luxury-progress-container ${className}`}
    >
      <div
        style={{
          width: `${percentage}%`,
          height: '100%',
          background: color,
          borderRadius: 'inherit',
          transition: 'width 0.4s ease-out',
        }}
        className="luxury-progress-bar"
      />
    </div>
  );
};
