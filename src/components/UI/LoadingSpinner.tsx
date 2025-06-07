import React from 'react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = '#72b01d',
  className = ''
}) => {
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'md':
        return 'h-6 w-6';
      case 'lg':
        return 'h-8 w-8';
      default:
        return 'h-6 w-6';
    }
  };

  return (
    <svg 
      className={`animate-spin ${getSizeClass()} ${className}`} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke={color} 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill={color} 
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
};

export default LoadingSpinner;
