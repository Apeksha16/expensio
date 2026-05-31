'use client';

import React from 'react';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

export default function CircularProgress({
  percentage,
  size = 64,
  strokeWidth = 6,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  // Health color indicators
  const getColor = () => {
    if (percentage > 100) return 'stroke-rose-500';
    if (percentage > 75) return 'stroke-amber-500';
    return 'stroke-emerald-400';
  };

  return null;
}
