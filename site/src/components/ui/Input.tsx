import React, { useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  id,
  className = '',
  style,
  disabled,
  ...props
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div
      className={`sahara-input-group ${className}`}
      style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}
    >
      {label && (
        <label
          htmlFor={inputId}
          style={{ fontSize: '13px', fontWeight: 600, color: 'inherit', opacity: 0.9 }}
        >
          {label}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
        {leftIcon && (
          <span
            style={{
              position: 'absolute',
              left: '12px',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
              opacity: 0.6,
            }}
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}

        <input
          id={inputId}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          style={{
            width: '100%',
            height: '44px',
            paddingLeft: leftIcon ? '40px' : '14px',
            paddingRight: rightIcon ? '40px' : '14px',
            borderRadius: '10px',
            border: error ? '1.5px solid #ef4444' : '1px solid rgba(148, 163, 184, 0.3)',
            backgroundColor: 'transparent',
            color: 'inherit',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            ...style,
          }}
          {...props}
        />

        {rightIcon && (
          <span
            style={{
              position: 'absolute',
              right: '12px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {rightIcon}
          </span>
        )}
      </div>

      {error && (
        <span
          id={errorId}
          role="alert"
          style={{ fontSize: '12px', color: '#ef4444', fontWeight: 500 }}
        >
          {error}
        </span>
      )}

      {!error && hint && (
        <span id={hintId} style={{ fontSize: '12px', opacity: 0.6 }}>
          {hint}
        </span>
      )}
    </div>
  );
};
