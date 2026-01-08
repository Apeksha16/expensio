import React, { createContext, useContext, useState, useEffect } from 'react';

const TransactionContext = createContext();

export const useTransactions = () => useContext(TransactionContext);

export const TransactionProvider = ({ children }) => {
    const [transactions, setTransactions] = useState(() => {
        try {
            const localData = localStorage.getItem('expensio_transactions');
            return localData ? JSON.parse(localData) : [
                { id: 1, title: 'Salary', amount: 5000.00, category: 'Salary', date: '2024-02-20', type: 'income' },
                { id: 2, title: 'Freelance', amount: 1200.00, category: 'Income', date: '2024-02-22', type: 'income' },
                { id: 3, title: 'Grocery', amount: 150.00, category: 'Food', date: '2024-02-25', type: 'expense' },
                { id: 4, title: 'Uber', amount: 25.00, category: 'Transport', date: '2024-02-26', type: 'expense' },
                { id: 5, title: 'Dinner', amount: 80.00, category: 'Food', date: '2024-02-28', type: 'expense' },
            ];
        } catch (e) {
            console.error("Failed to load transactions", e);
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('expensio_transactions', JSON.stringify(transactions));
        } catch (e) {
            console.error("Failed to save transactions", e);
        }
    }, [transactions]);

    const addTransaction = (transaction) => {
        setTransactions(prev => [{ ...transaction, id: Date.now() }, ...prev]);
    };

    const deleteTransaction = (id) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    return (
        <TransactionContext.Provider value={{ transactions, addTransaction, deleteTransaction }}>
            {children}
        </TransactionContext.Provider>
    );
};
