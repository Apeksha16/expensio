import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Wallet, CreditCard, Plus, MoreHorizontal, Coffee, Car, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './AddTransaction.css';

import { useTransactions } from '../context/TransactionContext';
import { getIcon } from '../utils/categoryIcons';

const AddTransaction = () => {
    const { addTransaction, transactions } = useTransactions();
    const navigate = useNavigate();
    const [step, setStep] = useState('menu'); // 'menu' | 'form'
    const [txType, setTxType] = useState('expense'); // 'income' | 'expense'

    // Form State
    const [amount, setAmount] = useState('');
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');

    const recentEntries = transactions.slice(0, 3);

    const handleOptionSelect = (type) => {
        setTxType(type);
        setStep('form');
        // Reset form
        setAmount('');
        setTitle('');
        setCategory('');
    };

    const handleSubmit = () => {
        if (!amount || !title) return;

        const newTx = {
            id: Date.now(),
            title,
            amount: parseFloat(amount),
            category: category || 'Other',
            date: new Date().toISOString().split('T')[0],
            type: txType
        };

        addTransaction(newTx);
        navigate(-1);
    };

    const categories = txType === 'expense'
        ? ['Food', 'Transport', 'Shopping', 'Health', 'Bills', 'Movie']
        : ['Salary', 'Rewards', 'Refund', 'Gift', 'Investment'];

    return (
        <div className="add-container">
            <div className="screen-header">
                <button className="back-btn" onClick={() => step === 'form' ? setStep('menu') : navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <span className="header-title">{step === 'menu' ? 'Add' : `Add ${txType === 'income' ? 'Income' : 'Expense'}`}</span>
                <div style={{ width: 40 }}></div>
            </div>

            <AnimatePresence mode="wait">
                {step === 'menu' ? (
                    <motion.div
                        key="menu"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <div className="add-options">
                            <div className="option-card income" onClick={() => handleOptionSelect('income')}>
                                <div className="option-icon">
                                    <Wallet size={24} />
                                </div>
                                <span className="option-label">Add Income</span>
                                <Plus size={20} style={{ alignSelf: 'flex-end', opacity: 0.5 }} />
                            </div>
                            <div className="option-card expense" onClick={() => handleOptionSelect('expense')}>
                                <div className="option-icon">
                                    <CreditCard size={24} />
                                </div>
                                <span className="option-label">Add Expense</span>
                                <Plus size={20} style={{ alignSelf: 'flex-end', opacity: 0.5 }} />
                            </div>
                        </div>

                        <div className="section-header">
                            <span className="section-title">Latest Entries</span>
                            <MoreHorizontal size={20} color="#9CA3AF" />
                        </div>

                        <div className="transactions-list">
                            {recentEntries.map((tx) => {
                                const Icon = getIcon(tx.category);
                                return (
                                    <div key={tx.id} className="transaction-item">
                                        <div className="transaction-icon">
                                            <Icon size={24} />
                                        </div>
                                        <div className="transaction-details">
                                            <div className="transaction-title">{tx.title}</div>
                                            <div className="transaction-date">{tx.date}</div>
                                        </div>
                                        <div className={`transaction-amount ${tx.type}`}>
                                            {tx.type === 'income' ? '+' : '-'}${tx.amount}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="form-container"
                    >
                        {/* Month Selector */}
                        <div className="date-navigator" style={{ margin: 0 }}>
                            <ChevronLeft size={20} className="nav-arrow" />
                            <span className="current-month">Today</span>
                            <ChevronRight size={20} className="nav-arrow" />
                        </div>

                        {/* Week Strip Mockup */}
                        {/* Simplified for now, just static */}
                        <div className="week-strip" style={{ marginBottom: 10 }}>
                            {/* ... week strip content from before ... or kept static for now */}
                        </div>

                        <div>
                            <label className="input-label">{txType === 'income' ? 'Income' : 'Expense'} Title</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder={txType === 'income' ? 'Side Business' : 'Family Dinner'}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="input-label">Amount</label>
                            <div className="amount-input-wrapper">
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                                <span className="currency-symbol">$</span>
                            </div>
                        </div>

                        <div>
                            <label className="input-label">Category</label>
                            <div className="category-grid">
                                {categories.map(cat => {
                                    const CatIcon = getIcon(cat);
                                    return (
                                        <div
                                            key={cat}
                                            className={`category-pill ${category === cat ? `active ${txType}` : ''}`}
                                            onClick={() => setCategory(cat)}
                                        >
                                            <CatIcon size={14} />
                                            {cat}
                                        </div>
                                    );
                                })}
                                <div className="category-pill dashed">
                                    <Plus size={14} />
                                </div>
                            </div>
                        </div>

                        <button className={`submit-btn ${txType}`} onClick={handleSubmit}>
                            ADD {txType.toUpperCase()}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Helper for date nav
const ChevronRight = ({ size, className }) => (
    <svg
        width={size}
        height={size}
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
);

export default AddTransaction;
