import React from 'react';
import { CreditCard, Wallet, Users } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Overview</h1>
        <p className="text-zinc-400">Here is a summary of your financial activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-zinc-400">Total Balance</h2>
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-zinc-100">$2,450.00</p>
          <div className="mt-4 flex items-center text-xs text-emerald-400">
            <span>+12.5% from last month</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-zinc-400">Monthly Expenses</h2>
            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-red-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-zinc-100">$1,230.50</p>
          <div className="mt-4 flex items-center text-xs text-red-400">
            <span>+4.2% from last month</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-zinc-400">Active Friends</h2>
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-zinc-100">12</p>
          <div className="mt-4 flex items-center text-xs text-zinc-500">
            <span>2 pending requests</span>
          </div>
        </div>
      </div>
    </div>
  );
}
