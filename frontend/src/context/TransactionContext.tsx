import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Transaction {
    id: string;
    amount: number;
    type: 'lent' | 'borrowed' | 'expense' | 'income';
    title: string;
    date: Date;
    note?: string;
    category?: string;
}

interface TransactionContextType {
    transactions: Transaction[];
    addTransaction: (transaction: Omit<Transaction, 'id' | 'date'>) => void;
    deleteTransaction: (id: string) => void;
    totalBalance: number;
    totalIncome: number;
    totalExpense: number;
    recentTransactions: Transaction[];
    chartData: { label: string; value: number }[];
    selectedYear: number;
    changeYear: (year: number) => void;
    budgets: Record<string, number>;
    updateBudget: (category: string, limit: number) => void;
    getCategorySpend: (category: string) => number;
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
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [budgets, setBudgets] = useState<Record<string, number>>({
        'Food': 5000,
        'Entertainment': 2000,
        'Travel': 3000,
        'Bills': 10000,
        'Credit Card': 15000,
        'Others': 5000,
    }); // Default dummy budgets

    const [transactions, setTransactions] = useState<Transaction[]>([
        // Initial Dummy Data
        { id: '1', title: 'Grocery Run', amount: 1250, type: 'expense', date: new Date('2023-05-10'), category: 'Food' },
        { id: '2', title: 'Salary', amount: 45000, type: 'income', date: new Date('2023-05-01'), category: 'Salary' },
        { id: '3', title: 'Movie Night', amount: 800, type: 'expense', date: new Date('2023-05-12'), category: 'Entertainment' },
    ]);

    const changeYear = (year: number) => setSelectedYear(year);

    const updateBudget = (category: string, limit: number) => {
        setBudgets(prev => ({
            ...prev,
            [category]: limit
        }));
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

    const addTransaction = (t: Omit<Transaction, 'id' | 'date'>) => {
        const newTransaction: Transaction = {
            ...t,
            id: Math.random().toString(36).substr(2, 9),
            date: new Date(),
        };
        setTransactions(prev => [newTransaction, ...prev]);
    };

    const deleteTransaction = (id: string) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
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

    // Sort by date desc
    const sortedTransactions = [...transactions].sort((a, b) => b.date.getTime() - a.date.getTime());

    return (
        <TransactionContext.Provider value={{
            transactions: sortedTransactions,
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
        }}>
            {children}
        </TransactionContext.Provider>
    );
};
