import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, ArrowDown, ArrowUp, Plus, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../context/TransactionContext';
import { getIcon } from '../utils/categoryIcons';
import './Dashboard.css';


const Dashboard = () => {
    const navigate = useNavigate();
    const { transactions, getIncome, getExpense, getBalance, goals } = useTransactions();
    const [timeFilter, setTimeFilter] = useState('month'); // 'week' | 'month' | 'all'

    const balance = getBalance();
    const income = getIncome(timeFilter);
    const expense = getExpense(timeFilter);
    const recentTransactions = transactions.slice(0, 5);

    // Mock Budgets for "Your Wallet" section - This will be replaced by Goals
    // const budgets = [
    //     { id: 1, name: 'Food', limit: 500, spent: 145, color: '#4A70A9', icon: Coffee },
    //     { id: 2, name: 'Shopping', limit: 1000, spent: 400, color: '#EF4444', icon: ShoppingBag },
    //     { id: 3, name: 'Rent', limit: 1200, spent: 1200, color: '#10B981', icon: Home },
    // ];

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
                <div>
                    <span className="greeting">Good Morning,</span>
                    <h1 className="username">Apeksha Verma</h1>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="notification-btn" onClick={() => navigate('/groups')}>
                        <Users size={24} color="#64748B" />
                    </div>
                    <div className="notification-btn">
                        <Bell size={24} color="#64748B" />
                        <div className="badge"></div>
                    </div>
                </div>
            </header>

            <motion.div
                className="main-content"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Total Balance Hero Card */}
                <motion.div className="hero-card" variants={itemVariants}>
                    <div className="card-content">
                        <span className="balance-label">Total Balance</span>
                        <h2 className="balance-amount">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
                        <div className="card-wave"></div>
                    </div>
                </motion.div>

                {/* Time Filter Toggle */}
                <div className="time-filter-row">
                    {['week', 'month', 'all'].map((filter) => (
                        <button
                            key={filter}
                            className={`time-filter-btn ${timeFilter === filter ? 'active' : ''}`}
                            onClick={() => setTimeFilter(filter)}
                        >
                            {filter === 'all' ? 'All Time' : `This ${filter.charAt(0).toUpperCase() + filter.slice(1)}`}
                        </button>
                    ))}
                </div>

                {/* Income / Expense Row */}
                <motion.div className="stats-row" variants={itemVariants}>
                    <div className="stat-block income">
                        <div className="stat-icon-wrapper down">
                            <ArrowDown size={20} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Income</span>
                            <span className="stat-value">${income.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="stat-block expense">
                        <div className="stat-icon-wrapper up">
                            <ArrowUp size={20} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Expense</span>
                            <span className="stat-value">${expense.toLocaleString()}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Goals / Wallet Section */}
                <motion.div className="section-block" variants={itemVariants}>
                    <div className="section-header">
                        <h3>My Goals</h3>
                        <span className="add-new" onClick={() => navigate('/goals')}>+ Add Goal</span>
                    </div>

                    <div className="wallets-scroll">
                        {goals.length === 0 ? (
                            <div className="empty-goals">No goals set yet. Start saving!</div>
                        ) : (
                            goals.map(goal => {
                                const progress = (goal.savedAmount / goal.targetAmount) * 100;
                                return (
                                    <div key={goal.id} className="wallet-card" style={{ '--accent-color': '#4A70A9' }}>
                                        <div className="wallet-icon">
                                            <TrendingUp size={24} color="white" />
                                        </div>
                                        <div className="wallet-info">
                                            <span className="wallet-name">{goal.title}</span>
                                            <div className="progress-bar">
                                                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                            </div>
                                            <span className="wallet-amount">${goal.savedAmount} / ${goal.targetAmount}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </motion.div>

                {/* Recent Transactions */}
                <motion.div className="section-block" variants={itemVariants}>
                    <div className="section-header">
                        <h3>Recent Transactions</h3>
                        <span className="see-all" onClick={() => navigate('/history')}>See All</span>
                    </div>

                    <div className="recent-list">
                        {recentTransactions.map(tx => {
                            const Icon = getIcon(tx.category);
                            return (
                                <div key={tx.id} className="recent-item">
                                    <div className="recent-icon">
                                        <Icon size={24} />
                                    </div>
                                    <div className="recent-details">
                                        <span className="recent-title">{tx.title}</span>
                                        <span className="recent-date">{new Date(tx.date).toLocaleDateString()}</span>
                                    </div>
                                    <span className={`recent-amount ${tx.type}`}>
                                        {tx.type === 'income' ? '+' : '-'}${tx.amount}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </motion.div>

            {/* Floating Add Button */}
            <div className="fab-container">
                <button className="fab-btn" onClick={() => navigate('/add')}>
                    <Plus size={32} />
                </button>
            </div>
        </div>
    );
};

export default Dashboard;
