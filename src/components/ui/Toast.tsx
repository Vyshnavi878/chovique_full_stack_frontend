import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '380px',
        width: 'calc(100% - 48px)',
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      style={{
        pointerEvents: 'auto',
        background: isSuccess
          ? 'linear-gradient(135deg, rgba(20, 30, 20, 0.95) 0%, rgba(10, 20, 10, 0.95) 100%)'
          : isError
          ? 'linear-gradient(135deg, rgba(40, 15, 20, 0.95) 0%, rgba(25, 10, 15, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(26, 13, 0, 0.95) 0%, rgba(15, 7, 1, 0.95) 100%)',
        border: isSuccess
          ? '1px solid rgba(76, 201, 120, 0.5)'
          : isError
          ? '1px solid var(--rose-gold)'
          : '1px solid var(--gold)',
        borderRadius: '8px',
        padding: '14px 16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 12px rgba(201, 168, 76, 0.15)',
        backdropFilter: 'blur(12px)',
        color: 'var(--cream)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div style={{ marginTop: '2px', flexShrink: 0 }}>
        {isSuccess && <CheckCircle2 size={20} style={{ color: '#4CC978' }} />}
        {isError && <AlertCircle size={20} style={{ color: 'var(--rose-gold)' }} />}
        {!isSuccess && !isError && <Info size={20} style={{ color: 'var(--gold)' }} />}
      </div>
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {toast.title && (
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: isSuccess ? '#4CC978' : isError ? 'var(--rose-gold)' : 'var(--gold)' }}>
            {toast.title}
          </span>
        )}
        <span style={{ fontSize: '0.85rem', color: 'var(--cream)', lineHeight: 1.4 }}>{toast.message}</span>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--grey-light)',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cream)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--grey-light)')}
        aria-label="Dismiss toast"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
};
