import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Settings, Coffee, Car, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Stats.css';

import { useTransactions } from '../context/TransactionContext';
import { getIcon } from '../utils/categoryIcons';

const Stats = () => {
    const navigate = useNavigate();
    const { transactions } = useTransactions();
    const [viewMode, setViewMode] = useState('spends'); // 'spends' | 'categories'

    // Filter only expenses for stats
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="stats-container">
            {/* Header */}
            <div className="screen-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <span className="header-title">Total Expenses</span>
                <button className="back-btn" style={{ opacity: 0 }}>
                    <Settings size={24} />
                </button>
            </div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Date Navigator */}
                <div className="date-navigator">
                    <div className="nav-arrow"><ChevronLeft size={20} /></div>
                    <span className="current-month">February - 2024</span>
                    <div className="nav-arrow"><ChevronRight size={20} /></div>
                </div>

                {/* Week Strip */}
                <div className="week-strip">
                    {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day, idx) => (
                        <div key={day} className={`day-item ${idx === 3 ? 'active' : ''}`}>
                            <span className="day-name">{day}</span>
                            <span className="day-number">{29 + idx - 3 <= 0 ? 30 + idx : 29 + idx - 3}</span>
                        </div>
                    ))}
                </div>

                {/* Chart Area */}
                <motion.div className="chart-container" variants={itemVariants}>
                    <div className="donut-outer">
                        <div className="donut-inner">
                            <span className="chart-total">${totalExpense.toFixed(2)}</span>
                            <span className="chart-label">Total Spends</span>
                        </div>
                    </div>
                </motion.div>

                {/* Toggle */}
                <div className="segmented-control">
                    <div
                        className={`segment-btn ${viewMode === 'spends' ? 'active' : ''}`}
                        onClick={() => setViewMode('spends')}
                    >
                        Spends
                    </div>
                    <div
                        className={`segment-btn ${viewMode === 'categories' ? 'active' : ''}`}
                        onClick={() => setViewMode('categories')}
                    >
                        Categories
                    </div>
                </div>

                {/* List */}
                <motion.div className="stats-list" variants={itemVariants}>
                    <div className="transactions-list">
                        {expenses.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 20, color: '#888' }}>No expenses yet</div>
                        ) : (
                            expenses.map((tx) => {
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
                                        <div>
                                            <div className="transaction-amount expense">-${tx.amount.toFixed(2)}</div>
                                            <span className="transaction-type">
                                                {tx.paymentMode || 'Cash'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Stats;
