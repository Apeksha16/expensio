import { createContext, useState, useContext, useEffect } from 'react';

// Initial Mock Data
const INITIAL_TRANSACTIONS = [
    {
        id: '1',
        amount: 50.00,
        type: 'expense',
        category: 'Food',
        date: new Date().toISOString(),
        note: 'Lunch at Cafe',
        paymentMode: 'Cash'
    },
    {
        id: '2',
        amount: 1200.00,
        type: 'income',
        category: 'Salary',
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        note: 'Freelance payment',
        paymentMode: 'Bank Transfer'
    }
];

const INITIAL_CATEGORIES = [
    'Food', 'Travel', 'Mobile Recharge', 'Wifi', 'Shopping', 'Investment', 'Medicines', 'Rent', 'Bills', 'Education', 'Salary', 'Other'
];

const INITIAL_GOALS = [
    {
        id: '1',
        title: 'GoPro Hero 12',
        targetAmount: 50000,
        savedAmount: 5000,
        targetDate: '2026-07-16'
    }
];

const TransactionContext = createContext();

export const useTransactions = () => {
    const context = useContext(TransactionContext);
    if (!context) {
        throw new Error('useTransactions must be used within a TransactionProvider');
    }
    return context;
};

export const TransactionProvider = ({ children }) => {
    const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
    const [categories, setCategories] = useState(INITIAL_CATEGORIES);
    const [goals, setGoals] = useState(INITIAL_GOALS);
    const [loading, setLoading] = useState(false);

    // Mock "persistence" or data fetching
    useEffect(() => {
        // In a real app, this would fetch from backend/localstorage
    }, []);

    const addTransaction = (transaction) => {
        const newTransaction = {
            ...transaction,
            id: Math.random().toString(36).substr(2, 9),
            date: transaction.date || new Date().toISOString()
        };
        setTransactions(prev => [newTransaction, ...prev]);
    };

    const deleteTransaction = (id) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    const updateTransaction = (id, updatedData) => {
        setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));
    };

    // Goals Logic
    const addGoal = (goal) => {
        setGoals(prev => [...prev, { ...goal, id: Date.now().toString() }]);
    };

    const updateGoalSavings = (id, amount) => {
        setGoals(prev => prev.map(g => g.id === id ? { ...g, savedAmount: g.savedAmount + amount } : g));
    };

    const getBalance = () => {
        return transactions.reduce((acc, curr) => {
            return curr.type === 'expense'
                ? acc - parseFloat(curr.amount)
                : acc + parseFloat(curr.amount);
        }, 0);
    };

    const getIncome = (filter = 'all') => {
        return transactions
            .filter(t => t.type === 'income')
            .filter(t => {
                if (filter === 'week') {
                    const d = new Date(t.date);
                    const now = new Date();
                    const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
                    return d >= oneWeekAgo;
                }
                if (filter === 'month') {
                    const d = new Date(t.date);
                    const now = new Date();
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }
                return true;
            })
            .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    };

    const getExpense = (filter = 'all') => {
        return transactions
            .filter(t => t.type === 'expense')
            .filter(t => {
                if (filter === 'week') {
                    const d = new Date(t.date);
                    const now = new Date();
                    const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
                    return d >= oneWeekAgo;
                }
                if (filter === 'month') {
                    const d = new Date(t.date);
                    const now = new Date();
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                }
                return true;
            })
            .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    };

    const value = {
        transactions,
        addTransaction,
        deleteTransaction,
        updateTransaction,
        categories,
        goals,
        addGoal,
        updateGoalSavings,
        getBalance,
        getIncome,
        getExpense,
        loading
    };

    return (
        <TransactionContext.Provider value={value}>
            {children}
        </TransactionContext.Provider>
    );
};
