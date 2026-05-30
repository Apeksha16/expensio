import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, variant = 'primary', ...props }, ref) => {
    const baseStyles = 'px-4 py-2 rounded-md font-medium transition-colors focus:outline-none';
    const variantStyles =
      variant === 'primary'
        ? 'bg-blue-600 text-white hover:bg-blue-700'
        : 'bg-gray-200 text-gray-800 hover:bg-gray-300';

    return (
      <button
        ref={ref}
        className={`₹{baseStyles} ₹{variantStyles} ₹{className || ''}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
