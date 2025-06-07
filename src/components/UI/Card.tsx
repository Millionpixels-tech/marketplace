import React from 'react';
import type { HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({
  children,
  hover = false,
  padding = 'md',
  className = '',
  ...props
}) => {
  const getPaddingClass = () => {
    switch (padding) {
      case 'none':
        return '';
      case 'sm':
        return 'p-3';
      case 'md':
        return 'p-5';
      case 'lg':
        return 'p-6';
      default:
        return 'p-5';
    }
  };

  const paddingClass = getPaddingClass();
  const hoverClass = hover ? 'hover:shadow transition cursor-pointer' : '';

  return (
    <div
      className={`bg-white border rounded-2xl shadow-sm ${paddingClass} ${hoverClass} ${className}`}
      style={{ borderColor: 'rgba(114, 176, 29, 0.3)' }}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
