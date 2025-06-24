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
        className={`w-full bg-white border rounded-xl transition-all duration-200 focus:outline-none font-medium placeholder-[#9ca3af] text-[#0d0a0b] px-3 md:px-4 py-2 md:py-3 text-sm md:text-base focus:border-[#72b01d] hover:border-[rgba(114,176,29,0.5)] focus:shadow-lg focus:ring-4 focus:ring-[#72b01d]/10 ${className}`}
        style={{
          borderColor: error ? '#ef4444' : 'rgba(114, 176, 29, 0.3)',
          color: '#0d0a0b'
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
