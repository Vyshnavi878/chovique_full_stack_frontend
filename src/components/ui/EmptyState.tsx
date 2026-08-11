import React from 'react';
import { PackageX } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div
      style={{
        padding: '60px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '8px',
        border: '1px dashed var(--glass-border)',
        margin: '20px 0',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(201, 168, 76, 0.1)',
          border: '1px solid rgba(201, 168, 76, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--gold)',
          marginBottom: '16px',
        }}
      >
        {icon || <PackageX size={32} />}
      </div>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.3rem',
          color: 'var(--cream)',
          marginBottom: '8px',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          color: 'var(--beige)',
          fontSize: '0.9rem',
          maxWidth: '420px',
          lineHeight: 1.5,
          marginBottom: actionText && onAction ? '20px' : '0',
        }}
      >
        {description}
      </p>
      {actionText && onAction && (
        <Button variant="gold" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
