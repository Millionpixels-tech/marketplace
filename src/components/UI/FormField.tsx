import React from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

export interface FormFieldProps {
  label: string;
  type?: 'input' | 'textarea' | 'file';
  error?: string;
  helperText?: string;
  required?: boolean;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  textareaProps?: TextareaHTMLAttributes<HTMLTextAreaElement>;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  type = 'input',
  error,
  helperText,
  required,
  inputProps,
  textareaProps
}) => {
  const baseStyles = {
    backgroundColor: 'rgba(243, 239, 245, 0.8)',
    borderColor: error ? '#c62828' : 'rgba(114, 176, 29, 0.3)',
    color: '#0d0a0b'
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = error ? '#c62828' : '#72b01d';
    e.currentTarget.style.boxShadow = error 
      ? '0 0 0 2px rgba(198, 40, 40, 0.2)' 
      : '0 0 0 2px rgba(114, 176, 29, 0.2)';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = error ? '#c62828' : 'rgba(114, 176, 29, 0.3)';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold mb-2" style={{ color: '#454955' }}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          className="border rounded-lg px-4 py-2 w-full text-base transition focus:outline-none focus:ring-2"
          style={baseStyles}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...textareaProps}
        />
      ) : type === 'file' ? (
        <input
          type="file"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          {...inputProps}
        />
      ) : (
        <input
          className="border rounded-lg px-4 py-2 w-full text-base transition focus:outline-none focus:ring-2"
          style={baseStyles}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...inputProps}
        />
      )}

      {error && (
        <p className="text-red-500 text-sm mt-1 font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm mt-1" style={{ color: '#454955', opacity: 0.7 }}>{helperText}</p>
      )}
    </div>
  );
};

export default FormField;
