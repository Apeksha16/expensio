import React, { createContext, useContext, useState } from 'react';

export interface Subscription {
    id: string;
    name: string;
    amount: number;
    frequency: 'Monthly' | 'Yearly';
    nextBillDate: Date;
    icon: string;
    color: string;
}

interface SubscriptionContextType {
    subscriptions: Subscription[];
    addSubscription: (sub: Omit<Subscription, 'id'>) => void;
    deleteSubscription: (id: string) => void;
    totalMonthlyCost: number;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscriptions = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscriptions must be used within a SubscriptionProvider');
    }
    return context;
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([
        // Initial Dummy Data
        // { id: '1', name: 'Netflix', amount: 499, frequency: 'Monthly', nextBillDate: new Date('2023-05-15'), icon: 'logo-youtube', color: '#E50914' },
    ]);

    const addSubscription = (sub: Omit<Subscription, 'id'>) => {
        const newSub: Subscription = {
            ...sub,
            id: Math.random().toString(36).substr(2, 9),
        };
        setSubscriptions(prev => [...prev, newSub]);
    };

    const deleteSubscription = (id: string) => {
        setSubscriptions(prev => prev.filter(s => s.id !== id));
    };

    const totalMonthlyCost = subscriptions.reduce((sum, sub) => {
        return sum + (sub.frequency === 'Monthly' ? sub.amount : sub.amount / 12);
    }, 0);

    return (
        <SubscriptionContext.Provider value={{
            subscriptions,
            addSubscription,
            deleteSubscription,
            totalMonthlyCost,
        }}>
            {children}
        </SubscriptionContext.Provider>
    );
};
