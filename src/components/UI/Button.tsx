import React from 'react';
import type { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: '#72b01d',
          color: '#ffffff',
          borderColor: '#72b01d',
          hover: {
            backgroundColor: '#3f7d20',
            borderColor: '#3f7d20'
          }
        };
      case 'secondary':
        return {
          backgroundColor: '#ffffff',
          color: '#454955',
          borderColor: 'rgba(114, 176, 29, 0.3)',
          hover: {
            backgroundColor: 'rgba(114, 176, 29, 0.1)',
            borderColor: '#72b01d'
          }
        };
      case 'danger':
        return {
          backgroundColor: '#ffffff',
          color: '#454955',
          borderColor: 'rgba(114, 176, 29, 0.3)',
          hover: {
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderColor: '#c62828'
          }
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: '#72b01d',
          borderColor: '#72b01d',
          hover: {
            backgroundColor: '#72b01d',
            color: '#ffffff'
          }
        };
      default:
        return {
          backgroundColor: '#72b01d',
          color: '#ffffff',
          borderColor: '#72b01d',
          hover: {
            backgroundColor: '#3f7d20',
            borderColor: '#3f7d20'
          }
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1 text-sm';
      case 'md':
        return 'px-4 py-2';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2';
    }
  };

  const variantStyles = getVariantStyles();
  const sizeClasses = getSizeStyles();
  const isDisabled = disabled || loading;

  return (
    <button
      className={`${sizeClasses} rounded font-semibold transition border ${className}`}
      style={{
        backgroundColor: isDisabled ? 'rgba(69, 73, 85, 0.1)' : variantStyles.backgroundColor,
        color: isDisabled ? 'rgba(69, 73, 85, 0.4)' : variantStyles.color,
        borderColor: isDisabled ? 'rgba(69, 73, 85, 0.2)' : variantStyles.borderColor
      }}
      onMouseEnter={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = variantStyles.hover.backgroundColor;
          if (variantStyles.hover.color) {
            e.currentTarget.style.color = variantStyles.hover.color;
          }
          if (variantStyles.hover.borderColor) {
            e.currentTarget.style.borderColor = variantStyles.hover.borderColor;
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.backgroundColor = variantStyles.backgroundColor;
          e.currentTarget.style.color = variantStyles.color;
          e.currentTarget.style.borderColor = variantStyles.borderColor;
        }
      }}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
