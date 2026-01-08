import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Wallet, CreditCard, Plus, MoreHorizontal, Calendar, FileText, Smartphone } from 'lucide-react';
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
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState('');
    const [paymentMode, setPaymentMode] = useState('Cash'); // Cash, Card, UPI

    const recentEntries = transactions.slice(0, 3);

    const handleOptionSelect = (type) => {
        setTxType(type);
        setStep('form');
        // Reset form
        setAmount('');
        setTitle('');
        setCategory('');
        setNote('');
        setPaymentMode('Cash');
        setDate(new Date().toISOString().split('T')[0]);
    };

    const handleSubmit = () => {
        if (!amount || !title) return; // Add better validation msg later

        const newTx = {
            id: Date.now(),
            title,
            amount: parseFloat(amount),
            category: category || 'Other',
            date,
            note,
            paymentMode,
            type: txType
        };

        addTransaction(newTx);
        navigate(-1);
    };

    const categories = txType === 'expense'
        ? ['Food', 'Transport', 'Shopping', 'Health', 'Bills', 'Movie', 'Rent', 'Education']
        : ['Salary', 'Rewards', 'Refund', 'Gift', 'Investment'];

    const paymentModes = ['Cash', 'Card', 'UPI'];

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
                        <div className="form-group">
                            <label className="input-label">Date</label>
                            <div className="input-wrapper date-input">
                                <Calendar size={18} className="input-icon" />
                                <input
                                    type="date"
                                    className="form-input"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="input-label">Title</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder={txType === 'income' ? 'Side Business' : 'Family Dinner'}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
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

                        <div className="form-group">
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
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="input-label">Payment Mode</label>
                            <div className="payment-modes">
                                {paymentModes.map(mode => (
                                    <div
                                        key={mode}
                                        className={`mode-pill ${paymentMode === mode ? 'active' : ''}`}
                                        onClick={() => setPaymentMode(mode)}
                                    >
                                        {mode === 'Cash' && <Wallet size={14} />}
                                        {mode === 'Card' && <CreditCard size={14} />}
                                        {mode === 'UPI' && <Smartphone size={14} />}
                                        {mode}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="input-label">Note (Optional)</label>
                            <div className="input-wrapper">
                                <FileText size={18} className="input-icon" />
                                <textarea
                                    className="form-input textarea"
                                    placeholder="Add a note..."
                                    rows={2}
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                />
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

export default AddTransaction;
