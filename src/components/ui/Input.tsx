import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  fullWidth = true,
  className = '',
  id,
  type = 'text',
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const isPassword = type === 'password';
  const [showPassword, setShowPassword] = useState(false);
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        width: fullWidth ? '100%' : 'auto',
        marginBottom: '15px',
        fontFamily: 'var(--font-body)',
      }}
    >
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '0.8rem',
            color: 'var(--beige)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontWeight: 500,
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          id={inputId}
          type={resolvedType}
          style={{
            width: '100%',
            padding: isPassword ? '12px 44px 12px 16px' : '12px 16px',
            background: 'rgba(var(--dark-chocolate-rgb), 0.4)',
            border: error ? '1px solid var(--rose-gold)' : '1px solid var(--glass-border)',
            borderRadius: '4px',
            color: 'var(--cream)',
            fontFamily: 'inherit',
            fontSize: '0.95rem',
            outline: 'none',
            transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
            boxSizing: 'border-box',
          }}
          className={`luxury-input ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--gold)',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              opacity: 0.8,
              transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--rose-gold)',
            marginTop: '2px',
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  fullWidth = true,
  className = '',
  id,
  options,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        width: fullWidth ? '100%' : 'auto',
        marginBottom: '15px',
        fontFamily: 'var(--font-body)',
      }}
    >
      {label && (
        <label
          htmlFor={selectId}
          style={{
            fontSize: '0.8rem',
            color: 'var(--beige)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontWeight: 500,
          }}
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        style={{
          padding: '12px 16px',
          background: 'rgba(var(--dark-chocolate-rgb), 0.4)',
          border: error ? '1px solid var(--rose-gold)' : '1px solid var(--glass-border)',
          borderRadius: '4px',
          color: 'var(--cream)',
          fontFamily: 'inherit',
          fontSize: '0.95rem',
          outline: 'none',
          cursor: 'pointer',
          transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%23C9A84C' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          backgroundSize: '16px',
        }}
        className={`luxury-select ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            style={{ background: 'var(--dark-chocolate)', color: 'var(--cream)' }}
          >
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--rose-gold)',
            marginTop: '2px',
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
};
