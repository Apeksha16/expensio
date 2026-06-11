import React from 'react';

// Geometric Monochromatic Expensio Logo Component Skeleton
function ExpensioLogoSkeleton() {
  return (
    <div className="h-10 w-10 text-zinc-200 dark:text-zinc-800 animate-pulse flex flex-col justify-between py-1">
      <div className="h-1 w-[70%] bg-current rounded-full" />
      <div className="h-1 w-[55%] bg-current rounded-full mx-auto" />
      <div className="h-1 w-[70%] bg-current rounded-full" />
    </div>
  );
}

export default function AuthLoading() {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 py-12">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[360px] bg-theme-card border border-theme-card-border rounded-3xl p-6 md:p-8 shadow-xl relative z-10 flex flex-col items-center gap-6 animate-pulse">
        {/* Logo */}
        <ExpensioLogoSkeleton />

        {/* Text */}
        <div className="space-y-2 flex flex-col items-center w-full mt-2">
          <div className="h-5 w-40 bg-zinc-200/60 dark:bg-zinc-800/60 rounded" />
          <div className="h-3 w-48 bg-zinc-200/40 dark:bg-zinc-800/40 rounded" />
        </div>

        {/* Button */}
        <div className="w-full h-[46px] bg-zinc-200/50 dark:bg-zinc-800/50 rounded-xl mt-2" />

        {/* Footer */}
        <div className="h-2 w-32 bg-zinc-200/30 dark:bg-zinc-800/30 rounded mt-6" />
      </div>
    </main>
  );
}
