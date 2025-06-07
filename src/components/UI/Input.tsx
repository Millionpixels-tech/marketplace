import React from 'react';
import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold mb-1" style={{ color: '#454955' }}>
          {label}
        </label>
      )}
      <input
        className={`border rounded px-3 py-2 w-full transition focus:outline-none focus:ring-2 ${className}`}
        style={{
          backgroundColor: 'rgba(243, 239, 245, 0.8)',
          borderColor: error ? '#c62828' : 'rgba(114, 176, 29, 0.3)',
          color: '#0d0a0b'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error ? '#c62828' : '#72b01d';
          e.currentTarget.style.boxShadow = error 
            ? '0 0 0 2px rgba(198, 40, 40, 0.2)' 
            : '0 0 0 2px rgba(114, 176, 29, 0.2)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? '#c62828' : 'rgba(114, 176, 29, 0.3)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        {...props}
      />
      {error && (
        <p className="text-red-500 text-sm mt-1 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm mt-1" style={{ color: '#454955', opacity: 0.7 }}>{helperText}</p>
      )}
    </div>
  );
};

export default Input;
