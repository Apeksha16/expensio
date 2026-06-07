'use client';

import React, { useState } from 'react';
import { useRecurring, useSubscriptionInsights } from '../../../hooks/useRecurring';
import { SubscriptionCard } from '../../../components/subscriptions/SubscriptionCard';

export default function SubscriptionsPage() {
  const { data: recurringItems, isLoading } = useRecurring();
  const { data: insights, isLoading: insightsLoading } = useSubscriptionInsights();
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'upcoming'>('subscriptions');

  if (isLoading || insightsLoading) {
    return <div className="p-8 text-center text-gray-500">Loading your bills...</div>;
  }

  const items = recurringItems || [];

  const subscriptions = items.filter((item) => item.type === 'subscription');
  const bills = items.filter((item) => item.type === 'standard');

  const totalMonthlyBurn = insights?.totalMonthlyCommitment || 0;
  const totalAnnualBurn = insights?.totalAnnualCommitment || 0;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Bills & Subscriptions
          </h1>
          <p className="text-gray-500 mt-2">Manage your recurring expenses in one place.</p>
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          className={`py-3 px-6 text-sm font-medium ${
            activeTab === 'subscriptions'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('subscriptions')}
        >
          Active Subscriptions
        </button>
        <button
          className={`py-3 px-6 text-sm font-medium ${
            activeTab === 'upcoming'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming Bills
        </button>
      </div>

      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
              <h2 className="text-indigo-900 font-semibold mb-1 text-sm">Monthly Run Rate</h2>
              <p className="text-2xl font-bold text-indigo-700">
                ₹{totalMonthlyBurn.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6">
              <h2 className="text-emerald-900 font-semibold mb-1 text-sm">Annual Commitment</h2>
              <p className="text-2xl font-bold text-emerald-700">
                ₹{totalAnnualBurn.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptions.length === 0 ? (
              <p className="text-gray-500">No active subscriptions tracked yet.</p>
            ) : (
              subscriptions.map((sub) => <SubscriptionCard key={sub.id} subscription={sub} />)
            )}
          </div>
        </div>
      )}

      {activeTab === 'upcoming' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {bills.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No upcoming bills tracked.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {bills.map((bill) => (
                  <li
                    key={bill.id}
                    className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {bill.description || bill.provider || 'Bill'}
                      </h4>
                      <p className="text-sm text-gray-500 capitalize">
                        Due: {new Date(bill.nextGenerationDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {bill.currency} {bill.amount.toLocaleString()}
                      </p>
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 capitalize">
                        {bill.frequency}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
