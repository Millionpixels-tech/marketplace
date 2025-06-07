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
        <label className="block text-sm font-semibold mb-2" style={{ color: '#454955' }}>
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none font-medium placeholder-[#9ca3af] ${className}`}
        style={{
          backgroundColor: '#ffffff',
          borderColor: error ? '#ef4444' : 'rgba(114, 176, 29, 0.2)',
          borderWidth: '1px',
          color: '#0d0a0b'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error ? '#ef4444' : '#72b01d';
          e.currentTarget.style.borderWidth = '1px';
          e.currentTarget.style.boxShadow = error 
            ? '0 0 0 4px rgba(239, 68, 68, 0.1)' 
            : '0 0 0 4px rgba(114, 176, 29, 0.1)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? '#ef4444' : 'rgba(114, 176, 29, 0.2)';
          e.currentTarget.style.borderWidth = '1px';
          e.currentTarget.style.boxShadow = 'none';
        }}
        onMouseEnter={(e) => {
          if (!error && document.activeElement !== e.currentTarget) {
            e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.4)';
            e.currentTarget.style.borderWidth = '1px';
          }
        }}
        onMouseLeave={(e) => {
          if (!error && document.activeElement !== e.currentTarget) {
            e.currentTarget.style.borderColor = 'rgba(114, 176, 29, 0.2)';
            e.currentTarget.style.borderWidth = '1px';
          }
        }}
        {...props}
      />
      {error && (
        <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm mt-2" style={{ color: '#454955', opacity: 0.7 }}>{helperText}</p>
      )}
    </div>
  );
};

export default Input;
