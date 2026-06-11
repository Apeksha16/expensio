'use client';

import * as React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'rounded';
}

export function Skeleton({ className = '', variant = 'rounded', ...props }: SkeletonProps) {
  const variantStyles = {
    rectangular: '',
    circular: 'rounded-full',
    rounded: 'rounded-2xl',
  };

  return (
    <div
      className={`animate-pulse bg-zinc-200/60 dark:bg-zinc-800/60 ${variantStyles[variant]} ${className}`}
      {...props}
    />
  );
}

export default Skeleton;
