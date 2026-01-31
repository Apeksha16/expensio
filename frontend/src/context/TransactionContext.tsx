import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { useUser } from './UserContext';

// Basic configuration for API URL - adjusting for Android Emulator if needed
const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5001/api' : 'http://localhost:5001/api';

export interface Transaction {
    id: string;
    amount: number;
    type: 'lent' | 'borrowed' | 'expense' | 'income';
    title: string;
    date: Date;
    note?: string;
    category?: string;
    userId?: string;
}

interface TransactionContextType {
    transactions: Transaction[];
    loading: boolean;
    addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    totalBalance: number;
    totalIncome: number;
    totalExpense: number;
    recentTransactions: Transaction[];
    chartData: { label: string; value: number }[];
    selectedYear: number;
    changeYear: (year: number) => void;
    budgets: Record<string, number>;
    updateBudget: (category: string, limit: number) => Promise<void>;
    getCategorySpend: (category: string) => number;
    fetchTransactions: (userId: string, options?: { limit?: number; startDate?: string; endDate?: string }) => Promise<void>;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const useTransactions = () => {
    const context = useContext(TransactionContext);
    if (!context) {
        throw new Error('useTransactions must be used within a TransactionProvider');
    }
    return context;
};

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useUser();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [budgets, setBudgets] = useState<Record<string, number>>({});
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    const fetchTransactions = useCallback(async (userId: string, options?: { limit?: number; startDate?: string; endDate?: string }) => {
        setLoading(true);
        try {
            // Build query string with optional parameters
            const params = new URLSearchParams();
            if (options?.limit) params.append('limit', options.limit.toString());
            if (options?.startDate) params.append('startDate', options.startDate);
            if (options?.endDate) params.append('endDate', options.endDate);

            const queryString = params.toString();
            const url = `${API_URL}/transactions/${userId}${queryString ? `?${queryString}` : ''}`;

            console.log(`[TransactionContext] User ${userId} fetching transactions with options:`, options);
            console.log(`[TransactionContext] Fetch URL: ${url}`);

            const response = await fetch(url);
            if (response.ok) {
                const result = await response.json();
                // Handle both old format (array) and new format (object with transactions array)
                const data = Array.isArray(result) ? result : (result.transactions || []);
                const parsedData = data.map((t: any) => ({
                    ...t,
                    date: new Date(t.date) // Convert ISO string back to Date object
                }));
                // Sort by date desc (in case server-side sorting wasn't available)
                parsedData.sort((a: any, b: any) => b.date.getTime() - a.date.getTime());
                setTransactions(parsedData);
            }
        } catch (error) {
            console.error('Failed to fetch transactions', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchBudgets = useCallback(async (userId: string) => {
        try {
            const response = await fetch(`${API_URL}/budgets/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setBudgets(data);
            } else {
                console.error('Failed to fetch budgets');
                // Set empty budgets on error
                setBudgets({});
            }
        } catch (error) {
            console.error('Error fetching budgets:', error);
            // Set empty budgets on error
            setBudgets({});
        }
    }, []);

    useEffect(() => {
        if (user?.id) {
            fetchTransactions(user.id);
            fetchBudgets(user.id);
        } else {
            setTransactions([]);
            setBudgets({});
        }
    }, [user, fetchTransactions, fetchBudgets]);

    const changeYear = (year: number) => setSelectedYear(year);

    const updateBudget = async (category: string, limit: number) => {
        if (!user?.id) {
            console.error('User ID missing, cannot update budget');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/budgets/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    category,
                    limit,
                }),
            });

            if (response.ok) {
                // Update local state immediately for better UX
                setBudgets(prev => ({
                    ...prev,
                    [category]: limit
                }));
            } else {
                const errorData = await response.json();
                console.error('Failed to update budget:', errorData.error);
                throw new Error(errorData.error || 'Failed to update budget');
            }
        } catch (error) {
            console.error('Error updating budget:', error);
            throw error;
        }
    };

    const getCategorySpend = (category: string) => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return transactions
            .filter(t =>
                t.type === 'expense' &&
                t.category === category &&
                t.date.getMonth() === currentMonth &&
                t.date.getFullYear() === currentYear
            )
            .reduce((sum, t) => sum + t.amount, 0);
    };

    const addTransaction = async (t: Omit<Transaction, 'id'>) => {
        console.log('[TransactionContext] addTransaction called with:', t);

        if (!user?.id) {
            console.error('[TransactionContext] User ID missing, cannot add transaction. User object:', user);
            return;
        }

        setLoading(true);
        console.log(`[TransactionContext] Sending request to: ${API_URL}/transactions/add`);

        try {
            const response = await fetch(`${API_URL}/transactions/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    ...t,
                }),
            });

            console.log('[TransactionContext] Response status:', response.status);

            if (response.ok) {
                const { transaction } = await response.json();
                console.log('[TransactionContext] Transaction added successfully:', transaction);
                const newTransaction: Transaction = {
                    ...transaction,
                    date: new Date(transaction.date), // Ensure Date object
                };
                setTransactions(prev => [newTransaction, ...prev]);
            } else {
                const errorText = await response.text();
                console.error('[TransactionContext] Failed to add transaction. Status:', response.status, 'Response:', errorText);
            }
        } catch (error) {
            console.error('[TransactionContext] Network/Server Error adding transaction:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteTransaction = async (id: string) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/transactions/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setTransactions(prev => prev.filter(t => t.id !== id));
            } else {
                console.error('Failed to delete transaction');
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
        } finally {
            setLoading(false);
        }
    };

    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalBalance = totalIncome - totalExpense;

    // Chart Data Aggregation (Selected Year)
    const getChartData = () => {
        const data = [];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (let i = 0; i < 12; i++) {
            const monthName = monthNames[i];
            const total = transactions
                .filter(t => {
                    const tDate = new Date(t.date);
                    return t.type === 'expense' &&
                        tDate.getMonth() === i &&
                        tDate.getFullYear() === selectedYear;
                })
                .reduce((sum, t) => sum + t.amount, 0);

            data.push({
                label: monthName,
                value: total,
            });
        }
        return data;
    };

    const chartData = getChartData();

    // Transactions are already sorted in fetch/add, but ensure consistency
    const sortedTransactions = [...transactions].sort((a, b) => b.date.getTime() - a.date.getTime());

    return (
        <TransactionContext.Provider value={{
            transactions: sortedTransactions,
            loading,
            addTransaction,
            deleteTransaction,
            totalBalance,
            totalIncome,
            totalExpense,
            recentTransactions: sortedTransactions.slice(0, 5),
            chartData,
            selectedYear,
            changeYear,
            budgets,
            updateBudget,
            getCategorySpend,
            fetchTransactions,
            selectedDate,
            setSelectedDate,
        }}>
            {children}
        </TransactionContext.Provider>
    );
};
