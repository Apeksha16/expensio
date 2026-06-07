import { RecurringExpense } from '../../hooks/useRecurring';

interface SubscriptionCardProps {
  subscription: RecurringExpense;
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const isNetflix = subscription.provider?.toLowerCase().includes('netflix');
  const isSpotify = subscription.provider?.toLowerCase().includes('spotify');

  // Use a generic gradient for others
  const bgClass = isNetflix
    ? 'bg-gradient-to-br from-red-600 to-black'
    : isSpotify
      ? 'bg-gradient-to-br from-green-500 to-black'
      : 'bg-gradient-to-br from-gray-800 to-black';

  return (
    <div className={`rounded-xl p-5 text-white ${bgClass} shadow-lg relative overflow-hidden`}>
      <div className="absolute top-0 right-0 p-4 opacity-20">
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      </div>

      <div className="relative z-10">
        <h3 className="text-xl font-bold mb-1">{subscription.provider || 'Subscription'}</h3>
        <p className="text-sm opacity-80 mb-4 capitalize">{subscription.frequency}</p>

        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs opacity-70">Next Billing</p>
            <p className="font-semibold">
              {new Date(subscription.nextGenerationDate).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">
              {subscription.currency} {subscription.amount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
