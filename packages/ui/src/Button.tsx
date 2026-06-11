'use client';

import * as React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref' | 'children'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const variantStyles = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-700 border-transparent shadow-[0_4px_12px_rgba(79,70,229,0.2)]',
  secondary:
    'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-transparent',
  outline:
    'bg-transparent border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
  danger:
    'bg-rose-500 text-white hover:bg-rose-600 border-transparent shadow-[0_4px_12px_rgba(244,63,94,0.2)]',
  ghost:
    'bg-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-transparent',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs rounded-lg min-h-[36px]',
  md: 'px-4 py-2.5 text-sm rounded-xl min-h-[44px]', // 44px min for mobile touch target
  lg: 'px-6 py-3.5 text-base rounded-2xl min-h-[52px]',
};

// High-end, clean circular loader spinner
function LoadingSpinner({ className }: { className?: string }) {
  return (
    <motion.svg
      className={`h-4.5 w-4.5 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
      aria-hidden="true"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3.5"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </motion.svg>
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-semibold transition-colors border outline-none active:scale-95 disabled:active:scale-100 select-none';
    const isActuallyDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        whileTap={isActuallyDisabled ? {} : { scale: 0.96 }}
        disabled={isActuallyDisabled}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${isActuallyDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && <LoadingSpinner />}
        {!isLoading && leftIcon}

        {/* Button Content */}
        <span>{isLoading && loadingText ? loadingText : children}</span>

        {!isLoading && rightIcon}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
