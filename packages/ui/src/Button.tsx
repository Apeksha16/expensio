import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, variant = 'primary', ...props }, ref) => {
    const baseStyles = 'px-5 py-3 rounded-full text-[14px] font-black transition-all duration-200 focus:outline-none active:scale-[0.98]';
    const variantStyles =
      variant === 'primary'
        ? 'bg-primary text-white dark:text-zinc-950 hover:bg-primary-hover shadow-soft'
        : 'bg-surface text-foreground hover:bg-surface-hover border border-black/5 dark:border-white/10 shadow-soft';

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${className || ''}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
