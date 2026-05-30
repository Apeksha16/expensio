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
  strokeWidth = 6 
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  // Health color indicators
  const getColor = () => {
    if (percentage > 100) return 'stroke-rose-500';
    if (percentage > 75) return 'stroke-amber-500';
    return 'stroke-emerald-400';
  };

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* SVG Ring container */}
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-zinc-800 fill-transparent"
          strokeWidth={strokeWidth}
        />
        
        {/* Animated Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`fill-transparent transition-all duration-700 ease-out ₹{getColor()}`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      
      {/* Percentage Center Text */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xs font-black text-zinc-100 tracking-tighter">
          {percentage}%
        </span>
      </div>
    </div>
  );
}
