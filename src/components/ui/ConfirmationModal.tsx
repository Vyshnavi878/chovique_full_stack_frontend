import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'gold';
  children?: React.ReactNode;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isConfirming = false,
  onConfirm,
  onCancel,
  variant = 'danger',
  children,
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.82)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(8px)',
        padding: '20px',
      }}
      onClick={onCancel}
    >
      <div
        className="glass-panel"
        style={{
          padding: '30px',
          width: '100%',
          maxWidth: '460px',
          background: 'linear-gradient(135deg, rgba(15, 7, 1, 0.98) 0%, rgba(26, 13, 0, 0.98) 100%)',
          border: isDanger ? '1px solid rgba(183, 110, 121, 0.4)' : '1px solid var(--glass-border)',
          borderRadius: '10px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 20px rgba(201, 168, 76, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          fontFamily: 'var(--font-body)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: isDanger ? 'rgba(183, 110, 121, 0.15)' : 'rgba(201, 168, 76, 0.15)',
              border: isDanger ? '1px solid var(--rose-gold)' : '1px solid var(--gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={24} style={{ color: isDanger ? 'var(--rose-gold)' : 'var(--gold)' }} />
          </div>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.3rem',
              color: 'var(--cream)',
              margin: 0,
            }}
          >
            {title}
          </h3>
        </div>

        <p style={{ color: 'var(--beige)', fontSize: '0.92rem', lineHeight: 1.5, margin: 0 }}>
          {message}
        </p>

        {children}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
          <Button
            variant="text"
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            style={{ color: 'var(--cream)', border: '1px solid rgba(255, 255, 255, 0.2)' }}
          >
            {cancelText}
          </Button>

          <Button
            variant={isDanger ? 'secondary' : 'gold'}
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            style={
              isDanger
                ? {
                    background: 'rgba(183, 110, 121, 0.2)',
                    borderColor: 'var(--rose-gold)',
                    color: 'var(--cream)',
                  }
                : undefined
            }
          >
            {isConfirming ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
