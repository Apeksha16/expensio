import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, MoreHorizontal, ChevronDown } from 'lucide-react'; // Removing Users icon as per design
import { useTransactions } from '../context/TransactionContext';
import './Dashboard.css';

// Quick helper for mock chart data
const CHART_DATA = [
    { label: 'Jan', value: 30 },
    { label: 'Feb', value: 45 },
    { label: 'Mar', value: 25 },
    { label: 'Apr', value: 80, active: true, amount: '$2,972' },
    { label: 'May', value: 50 },
    { label: 'Jun', value: 40 },
    { label: 'Jul', value: 60 },
];

const Dashboard = () => {
    const { getBalance, transactions } = useTransactions();
    const balance = getBalance();

    // Get latest 3 transactions
    const recentTransactions = [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <header className="dash-header">
                <div className="header-left">
                    <div className="user-avatar">
                        {/* Placeholder for typical avatar or use an icon */}
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                    </div>
                </div>
                <h1 className="header-title">Home</h1>
                <div className="notification-btn">
                    <Bell size={20} color="#1E293B" />
                    <div className="badge"></div>
                </div>
            </header>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Credit Card Hero */}
                <motion.div className="credit-card" variants={itemVariants}>
                    <div className="card-top">
                        <div>
                            <span className="balance-label">Total Balance</span>
                            <h2 className="balance-amount">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
                        </div>
                        <MoreHorizontal className="card-menu" color="white" />
                    </div>

                    <div className="card-bottom">
                        <div className="card-number">
                            2644 7545 3867 1965
                        </div>
                        <div className="card-logo">
                            <div className="mastercard-circle mc-red"></div>
                            <div className="mastercard-circle mc-yellow"></div>
                        </div>
                    </div>
                </motion.div>

                {/* Analytics */}
                <motion.div variants={itemVariants}>
                    <div className="section-header">
                        <h3 className="section-title">Analytics</h3>
                        <button className="time-filter-dropdown">
                            Year - 2022 <ChevronDown size={14} />
                        </button>
                    </div>

                    <div className="chart-container">
                        <div className="chart-bars">
                            {CHART_DATA.map((item, index) => (
                                <div key={index} className="chart-col">
                                    <div className="bar-wrapper">
                                        <div className="bar-bg">
                                            <motion.div
                                                className={`bar-fill ${item.active ? 'active' : ''}`}
                                                initial={{ height: 0 }}
                                                animate={{ height: `${item.value}%` }}
                                                transition={{ duration: 0.8, delay: index * 0.1 }}
                                            />
                                        </div>
                                        {item.active && (
                                            <motion.div
                                                className="bar-label-float"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                delay={1}
                                            >
                                                {item.amount}
                                            </motion.div>
                                        )}
                                    </div>
                                    <span className={`month-label ${item.active ? 'active' : ''}`}>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Transactions */}
                <motion.div variants={itemVariants}>
                    <div className="section-header">
                        <h3 className="section-title">Transactions</h3>
                        <a href="/history" className="view-all">View All</a>
                    </div>

                    <div className="transaction-list">
                        {recentTransactions.map((t) => (
                            <div key={t.id} className="transaction-item">
                                <div className="tx-left">
                                    <div className="tx-icon">
                                        {/* Simple dynamic icon based on category */}
                                        <span style={{ fontSize: '20px' }}>
                                            {t.category === 'Food' ? '🍔' :
                                                t.category === 'Shopping' ? '🛍️' :
                                                    t.category === 'Travel' ? '🚕' : '📄'}
                                        </span>
                                    </div>
                                    <div className="tx-info">
                                        <span className="tx-name">{t.note || t.category}</span>
                                        <span className="tx-category">{t.paymentMode || 'Card'}</span>
                                    </div>
                                </div>
                                <div className="tx-right">
                                    <span className={`tx-amount ${t.type}`}>
                                        ${parseFloat(t.amount).toFixed(0)}
                                    </span>
                                    <span className="tx-date">
                                        {new Date(t.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {recentTransactions.length === 0 && (
                            <div style={{ textAlign: 'center', color: '#94A3B8', padding: '20px' }}>No recent transactions</div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Dashboard;
