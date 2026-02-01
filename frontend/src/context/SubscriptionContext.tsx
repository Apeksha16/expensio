import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useUser } from './UserContext';

// Basic configuration for API URL
const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5001/api' : 'http://localhost:5001/api';

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
    addSubscription: (sub: Omit<Subscription, 'id'>) => Promise<void>;
    deleteSubscription: (id: string) => Promise<void>;
    updateSubscription: (id: string, sub: Omit<Subscription, 'id'>) => Promise<void>;
    totalMonthlyCost: number;
    loading: boolean;
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
    const { user } = useUser();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchSubscriptions = async (userId: string) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/subscriptions/${userId}`);
            if (response.ok) {
                const data = await response.json();
                const parsedData = data.map((sub: any) => ({
                    ...sub,
                    nextBillDate: new Date(sub.nextBillDate),
                }));
                // Sort by next bill date asc? or created? Let's do next bill date
                parsedData.sort((a: any, b: any) => a.nextBillDate.getTime() - b.nextBillDate.getTime());
                setSubscriptions(parsedData);
            } else {
                console.error('Failed to fetch subscriptions');
            }
        } catch (error) {
            console.error('Error fetching subscriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchSubscriptions(user.id);
        } else {
            setSubscriptions([]);
        }
    }, [user?.id]);

    const addSubscription = async (sub: Omit<Subscription, 'id'>) => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/subscriptions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    ...sub,
                    nextBillDate: sub.nextBillDate.toISOString(), // Ensure ISO string
                }),
            });

            if (response.ok) {
                const { subscription } = await response.json();
                const newSub: Subscription = {
                    ...subscription,
                    nextBillDate: new Date(subscription.nextBillDate),
                };
                setSubscriptions(prev => [...prev, newSub]);
            }
        } catch (error) {
            console.error('Error adding subscription:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteSubscription = async (id: string) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/subscriptions/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setSubscriptions(prev => prev.filter(s => s.id !== id));
            }
        } catch (error) {
            console.error('Error deleting subscription:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateSubscription = async (id: string, updatedSub: Omit<Subscription, 'id'>) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/subscriptions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...updatedSub,
                    nextBillDate: updatedSub.nextBillDate.toISOString(),
                }),
            });

            if (response.ok) {
                setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, ...updatedSub } : s));
            }
        } catch (error) {
            console.error('Error updating subscription:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalMonthlyCost = subscriptions.reduce((sum, sub) => {
        return sum + (sub.frequency === 'Monthly' ? sub.amount : sub.amount / 12);
    }, 0);

    return (
        <SubscriptionContext.Provider value={{
            subscriptions,
            addSubscription,
            deleteSubscription,
            updateSubscription,
            totalMonthlyCost,
            loading,
        }}>
            {children}
        </SubscriptionContext.Provider>
    );
};
