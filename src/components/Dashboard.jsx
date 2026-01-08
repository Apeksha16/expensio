import { motion } from 'framer-motion';
import { Bell, Wallet, CreditCard, PieChart, TrendingUp, ShoppingBag, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../context/TransactionContext';
import { getIcon } from '../utils/categoryIcons';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const { transactions } = useTransactions();

    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

    const recentTransactions = transactions.slice(0, 5);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100
            }
        }
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <motion.div
                className="dashboard-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div>
                    <div className="user-greeting">
                        <h1>Overview</h1>
                        <p>Hello, User!</p>
                    </div>
                </div>
                <div className="profile-pic">
                    <Bell size={20} color="var(--palette-primary)" />
                </div>
            </motion.div>

            <motion.div
                className="main-content-area"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Cards Carousel */}
                <motion.div className="cards-scroll-container" variants={itemVariants}>
                    {/* Total Salary (Income) Card */}
                    <div className="stat-card primary">
                        <div className="card-icon-wrapper">
                            <Wallet size={20} color="white" />
                        </div>
                        <div>
                            <span className="card-label">Total Income</span>
                            <div className="card-amount">${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        </div>
                    </div>

                    {/* Total Expense Card */}
                    <div className="stat-card accent">
                        <div className="card-icon-wrapper">
                            <CreditCard size={20} color="white" />
                        </div>
                        <div>
                            <span className="card-label">Total Expense</span>
                            <div className="card-amount">${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        </div>
                    </div>

                    {/* Monthly Budget Card (Mock for now) */}
                    <div className="stat-card secondary">
                        <div className="card-icon-wrapper">
                            <PieChart size={20} />
                        </div>
                        <div>
                            <span className="card-label">Monthly Budget</span>
                            <div className="card-amount" style={{ color: 'var(--palette-primary)' }}>$3,500</div>
                        </div>
                    </div>
                </motion.div>

                {/* Action Tabs */}
                <motion.div className="action-tabs" variants={itemVariants}>
                    <div className="action-tab active">
                        <Wallet size={16} />
                        <span>Savings</span>
                    </div>
                    <div className="action-tab">
                        <Bell size={16} />
                        <span>Remind</span>
                    </div>
                    <div className="action-tab">
                        <TrendingUp size={16} />
                        <span>Budget</span>
                    </div>
                </motion.div>

                {/* Recent Entries */}
                <motion.div className="recent-entries" variants={itemVariants}>
                    <div className="section-header">
                        <span className="section-title">Latest Entries</span>
                        <span className="see-all" onClick={() => navigate('/history')}>...</span>
                    </div>

                    <div className="transactions-list">
                        {recentTransactions.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 20, color: '#888' }}>No transactions</div>
                        ) : (
                            recentTransactions.map((tx) => {
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
                                            <div className={`transaction-amount ${tx.type}`}>
                                                {tx.type === 'expense' ? '-' : '+'}${tx.amount.toFixed(2)}
                                            </div>
                                            <span className="transaction-type">
                                                {tx.category}
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

export default Dashboard;
